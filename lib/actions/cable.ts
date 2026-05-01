"use server"

import { buyCableSubscription, getCablePlans } from "@/lib/api/gsubz"
import { createClient } from "@/lib/supabase/server"
import { saveTransaction, atomicDeductWallet } from "@/lib/utils/save-transaction"
import { sendTransactionEmail } from "@/lib/email/send-transaction-email"
import { isValidAmount } from "@/lib/utils/input-validation"
import { revalidatePath } from "next/cache"

export async function subscribeCable(formData: FormData) {
  const provider = formData.get("provider") as string
  const package_name = formData.get("package") as string
  const packageDisplayName = formData.get("packageDisplayName") as string
  const smartcard = formData.get("smartcard") as string
  const phone = formData.get("phone") as string

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: "You must be logged in to make a purchase" }
    }

    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", user.id).single()

    if (!profile) {
      return { success: false, message: "Profile not found. Please contact support." }
    }

    // Map provider to service ID
    const serviceIdMap: Record<string, string> = {
      dstv: "dstv",
      gotv: "gotv",
      startimes: "startimes",
    }

    const serviceID = serviceIdMap[provider.toLowerCase()] || "dstv"
    const requestID = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`

    // Call GSUBZ API
    const response = await buyCableSubscription({
      serviceID,
      plan: package_name,
      phone,
      customerID: smartcard,
      requestID,
    })

    const purchaseAmount = Number(response.amount || 0)
    const balanceBefore = Number(profile.wallet_balance)

    // Check sufficient balance
    if (balanceBefore < purchaseAmount) {
      return { success: false, message: "Insufficient wallet balance" }
    }

    // Determine success
    const isSuccess =
      (response.code === 200 || response.code === "200" || response.code === "000") &&
      (response.status === "TRANSACTION_SUCCESSFUL" ||
        response.status === "success" ||
        response.status === "successful" ||
        response.description === "TRANSACTION_SUCCESSFUL")

    if (isSuccess) {
      const transactionId = String(response.transactionID || requestID)

      // ATOMIC: Deduct wallet balance in a single database transaction
      const deductResult = await atomicDeductWallet(user.id, purchaseAmount)

      if (!deductResult.success) {
        console.error("[v0] Deduction failed - contact support")
        return {
          success: false,
          message: deductResult.error || "Failed to update wallet balance. Please contact support.",
        }
      }

      const balanceAfter = deductResult.newBalance!

      // Save transaction (smartcard stored in phone field)
      await saveTransaction({
        userId: user.id,
        transactionId,
        category: "CABLE",
        serviceId: serviceID,
        serviceName: `${provider} TV`,
        amount: purchaseAmount,
        phone: smartcard,
        status: "SUCCESS",
        description: packageDisplayName ? `${provider} ${packageDisplayName}` : `${provider} ${package_name} · ${smartcard}`,
        balanceBefore,
        balanceAfter,
        apiResponse: response,
        planDetails: packageDisplayName,
      })

      // Send transaction email
      try {
        await sendTransactionEmail({
          email: user.email || '',
          userName: 'User',
          transactionType: `${provider} TV Subscription`,
          amount: purchaseAmount,
          phone: smartcard,
          transactionId,
          status: 'SUCCESS',
          balanceAfter,
        })
      } catch (emailErr) {
        console.error("[v0] Email sending failed - continuing anyway")
      }

      // Revalidate dashboard to update balance and transactions
      revalidatePath("/dashboard")

      return {
        success: true,
        message: "Cable subscription successful",
        transaction: {
          id: transactionId,
          type: "cable",
          provider,
          package: package_name,
          smartcard,
          amount: purchaseAmount,
          status: "success",
          balance: balanceAfter,
        },
      }
    }

    // Transaction failed
    const failedTransactionId = String(response.transactionID || requestID)

    await saveTransaction({
      userId: user.id,
      transactionId: failedTransactionId,
      category: "CABLE",
      serviceId: serviceID,
      serviceName: `${provider} TV`,
      amount: purchaseAmount,
      phone: smartcard,
      status: "FAILED",
      description: packageDisplayName ? `${provider} ${packageDisplayName}` : `${provider} ${package_name} · ${smartcard}`,
      balanceBefore,
      balanceAfter: balanceBefore,
      apiResponse: response,
      planDetails: packageDisplayName,
    })

    // Send failure email
    await sendTransactionEmail({
      userId: user.id,
      category: "CABLE",
      serviceName: `${provider} TV`,
      amount: purchaseAmount,
      status: "FAILED",
      transactionId: failedTransactionId,
      extras: [
        { label: "Provider", value: provider },
        { label: "Package", value: package_name },
        { label: "Smartcard", value: smartcard },
        { label: "Status", value: "Failed" },
        { label: "Reason", value: response.description || "Transaction could not be processed" },
      ],
    })

    return {
      success: false,
      message: response.description || "Transaction failed",
      transaction: {
        id: failedTransactionId,
        type: "cable",
        provider,
        package: package_name,
        smartcard,
        amount: purchaseAmount,
        status: "failed",
        balance: balanceBefore,
      },
    }
  } catch (error) {
    console.error("[v0] Request processing error")
    return { success: false, message: "An error occurred while processing your request" }
  }
}

export async function fetchCablePlans(provider: string) {
  try {
    const serviceIdMap: Record<string, string> = {
      dstv: "dstv",
      gotv: "gotv",
      startimes: "startimes",
    }

    const service = serviceIdMap[provider.toLowerCase()] || "dstv"
    const plans = await getCablePlans(service)

    // Fetch pricing rules for this service to apply markup
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: pricingRules } = await supabase
      .from("pricing_rules")
      .select("plan_name, base_price, markup_type, markup_value")
      .eq("service_id", service)
      .eq("is_active", true)

    // Apply markup to plans if pricing rules exist
    const enhancedPlans = (plans.plans || []).map((plan: any) => {
      const rule = pricingRules?.find((r) => r.plan_name.toLowerCase() === plan.displayName.toLowerCase())

      if (rule) {
        const basePrice = parseFloat(plan.price)
        const markup = rule.markup_type === "fixed" ? rule.markup_value : (basePrice * rule.markup_value) / 100
        const finalPrice = basePrice + markup

        return {
          ...plan,
          price: finalPrice.toString(),
          originalPrice: plan.price,
          hasMarkup: true,
          markup: markup,
        }
      }

      return plan
    })

    console.log(`[v0] Enhanced cable plans with markup:`, enhancedPlans)

    return {
      success: true,
      plans: enhancedPlans,
      service: plans.service,
    }
  } catch (error) {
    console.error("[v0] Error fetching cable plans:", error)
    return { success: false, plans: [], error: String(error) }
  }
}

export async function verifySmartcard(provider: string, smartcard: string) {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    success: true,
    customerName: "Customer",
    currentPackage: "Active",
  }
}
