"use server"

import { buyData, getDataPlans } from "@/lib/api/gsubz"
import { createClient } from "@/lib/supabase/server"
import { saveTransaction, updateWalletBalance } from "@/lib/utils/save-transaction"

export async function purchaseData(formData: FormData) {
  const serviceID = formData.get("serviceID") as string
  const plan = formData.get("plan") as string
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

    const requestID = "TXN" + Date.now()

    // Call GSUBZ API
    const response = await buyData({
      serviceID,
      plan,
      phone,
      requestID,
    })

    // Extract amount from response
    const userAmount = response.amount ? Number(response.amount) : 0
    const balanceBefore = Number(profile.wallet_balance)

    // Check sufficient balance
    if (balanceBefore < userAmount) {
      return { success: false, message: "Insufficient wallet balance" }
    }

    // Map network name
    const networkNameMap: Record<string, string> = {
      mtn: "MTN",
      glo: "Glo",
      airtel: "Airtel",
      etisalat: "9mobile",
    }
    const networkName = networkNameMap[serviceID.toLowerCase()] || "Data"

    // Determine success
    const isSuccess =
      (response.code === 200 || response.code === "200" || response.code === "000") &&
      (response.status === "TRANSACTION_SUCCESSFUL" ||
        response.status === "success" ||
        response.status === "successful" ||
        response.description === "TRANSACTION_SUCCESSFUL")

    if (isSuccess) {
      const transactionId = String(response.transactionID || requestID)
      const balanceAfter = balanceBefore - userAmount

      // Save transaction
      await saveTransaction({
        userId: user.id,
        transactionId,
        category: "DATA",
        serviceId: serviceID,
        serviceName: `${networkName} Data`,
        amount: userAmount,
        phone,
        status: "SUCCESS",
        description: `${networkName} Data · ${phone}`,
        balanceBefore,
        balanceAfter,
        apiResponse: response,
      })

      // Update wallet
      await updateWalletBalance(user.id, balanceAfter)

      return {
        success: true,
        message: "Data purchase successful",
        transaction: {
          id: transactionId,
          type: "data",
          serviceID,
          plan,
          phone,
          amount: userAmount,
          status: "success",
          balance: balanceAfter,
        },
      }
    }

    // Transaction failed - still save it
    const failedTransactionId = String(response.transactionID || requestID)

    await saveTransaction({
      userId: user.id,
      transactionId: failedTransactionId,
      category: "DATA",
      serviceId: serviceID,
      serviceName: `${networkName} Data`,
      amount: userAmount,
      phone,
      status: "FAILED",
      description: `${networkName} Data · ${phone}`,
      balanceBefore,
      balanceAfter: balanceBefore,
      apiResponse: response,
    })

    return {
      success: false,
      message: response.description || "Transaction failed",
      transaction: {
        id: failedTransactionId,
        type: "data",
        serviceID,
        plan,
        phone,
        amount: userAmount,
        status: "failed",
        balance: balanceBefore,
      },
    }
  } catch (error) {
    console.error("[v0] Data purchase error:", error)
    return { success: false, message: "An error occurred while processing your request", error: String(error) }
  }
}

export async function fetchDataPlans(serviceID: string) {
  try {
    const plans = await getDataPlans(serviceID)
    
    // Fetch pricing rules for this service to apply markup
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const serviceMap: Record<string, string> = {
      mtn_sme: "mtn",
      mtn_datashare: "mtn",
      mtn_gifting: "mtn",
      mtn_awoof: "mtn",
      glo_data: "glo",
      glo_sme: "glo",
      airtel_sme: "airtel",
      airtel_gifting: "airtel",
      etisalat_data: "etisalat",
    }
    
    const serviceId = serviceMap[serviceID.toLowerCase()] || serviceID
    
    const { data: pricingRules } = await supabase
      .from("pricing_rules")
      .select("plan_name, base_price, markup_type, markup_value")
      .eq("service_id", serviceId)
      .eq("is_active", true)
    
    console.log(`[v0] Fetched pricing rules for ${serviceId}:`, pricingRules)
    console.log(`[v0] Original plans:`, plans.plans)
    
    // Apply markup to plans if pricing rules exist
    const enhancedPlans = (plans.plans || []).map((plan: any) => {
      const rule = pricingRules?.find((r) => r.plan_name.toLowerCase() === plan.displayName.toLowerCase())
      
      if (rule) {
        const basePrice = parseFloat(plan.price)
        const markup = rule.markup_type === "fixed" ? rule.markup_value : (basePrice * rule.markup_value) / 100
        const finalPrice = basePrice + markup
        
        console.log(`[v0] Applying markup to ${plan.displayName}: ${basePrice} + ${markup} = ${finalPrice}`)
        
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
    
    console.log(`[v0] Enhanced plans with markup:`, enhancedPlans)
    
    return {
      success: true,
      plans: enhancedPlans,
      service: plans.service,
    }
  } catch (error) {
    console.error("[v0] Error fetching plans:", error)
    return { success: false, plans: [], error: String(error) }
  }
}
