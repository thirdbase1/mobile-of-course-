"use server"

import { buyAirtime } from "@/lib/api/gsubz"
import { createClient } from "@/lib/supabase/server"
import { saveTransaction, updateWalletBalance } from "@/lib/utils/save-transaction"
import { sendTransactionEmail } from "@/lib/email/send-transaction-email"
import { isValidAmount, isValidPhone } from "@/lib/utils/input-validation"

export async function purchaseAirtime(formData: FormData) {
  const network = formData.get("network") as string
  const phone = formData.get("phone") as string
  const amount = formData.get("amount") as string

  const startTime = Date.now()
  console.log("[v0] purchaseAirtime START")

  try {
    // SECURITY: Validate inputs
    const numAmount = parseFloat(amount)
    if (!isValidAmount(numAmount) || numAmount <= 0) {
      return { success: false, message: "Invalid amount" }
    }

    if (!isValidPhone(phone)) {
      return { success: false, message: "Invalid phone number" }
    }

    console.log(`[v0] [${Date.now() - startTime}ms] Initializing Supabase`)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: "You must be logged in to make a purchase" }
    }

    console.log(`[v0] [${Date.now() - startTime}ms] Fetching user profile`)
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", user.id).single()

    if (!profile) {
      return { success: false, message: "Profile not found. Please contact support." }
    }

    const userAmount = Number(amount)
    const balanceBefore = Number(profile.wallet_balance)

    // Check sufficient balance
    if (balanceBefore < userAmount) {
      return { success: false, message: "Insufficient wallet balance" }
    }

    // Map network to GSUBZ service ID
    const serviceIdMap: Record<string, string> = {
      mtn: "mtn",
      airtel: "airtel",
      glo: "glo",
      "9mobile": "etisalat",
    }

    const serviceID = serviceIdMap[network.toLowerCase()] || "mtn"
    const requestID = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`

    // Call GSUBZ API
    console.log(`[v0] [${Date.now() - startTime}ms] Calling Gsubz API`)
    const gsubzStartTime = Date.now()
    const response = await buyAirtime({
      serviceID,
      phone,
      amount: String(userAmount),
      requestID,
    })
    const gsubzTime = Date.now() - gsubzStartTime
    console.log(`[v0] [${Date.now() - startTime}ms] Gsubz API responded (took ${gsubzTime}ms)`)

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

      console.log(`[v0] [${Date.now() - startTime}ms] Transaction successful, saving to DB`)
      const saveStartTime = Date.now()
      // Save transaction
      await saveTransaction({
        userId: user.id,
        transactionId,
        category: "AIRTIME",
        serviceId: `${network.toLowerCase()}-airtime`,
        serviceName: `${network} Airtime`,
        amount: userAmount,
        phone,
        status: "SUCCESS",
        description: `${network} Airtime · ${phone}`,
        balanceBefore,
        balanceAfter,
        apiResponse: response,
      })
      const saveTime = Date.now() - saveStartTime
      console.log(`[v0] [${Date.now() - startTime}ms] Database save completed (took ${saveTime}ms)`)

      // Update wallet
      console.log(`[v0] [${Date.now() - startTime}ms] Updating wallet balance`)
      const walletStartTime = Date.now()
      await updateWalletBalance(user.id, balanceAfter)
      const walletTime = Date.now() - walletStartTime
      console.log(`[v0] [${Date.now() - startTime}ms] Wallet updated (took ${walletTime}ms)`)

      console.log(`[v0] purchaseAirtime COMPLETE (total: ${Date.now() - startTime}ms, Gsubz: ${gsubzTime}ms, DB: ${saveTime}ms, Wallet: ${walletTime}ms)`)
      return {
        success: true,
        message: "Airtime purchase successful",
        transaction: {
          id: transactionId,
          type: "airtime",
          network,
          phone,
          amount: userAmount,
          status: "success",
          balance: balanceAfter,
        },
      }
    }

    // Transaction failed - still save it as FAILED
    const failedTransactionId = String(response.transactionID || requestID)

    await saveTransaction({
      userId: user.id,
      transactionId: failedTransactionId,
      category: "AIRTIME",
      serviceId: `${network.toLowerCase()}-airtime`,
      serviceName: `${network} Airtime`,
      amount: userAmount,
      phone,
      status: "FAILED",
      description: `${network} Airtime · ${phone}`,
      balanceBefore,
      balanceAfter: balanceBefore,
      apiResponse: response,
    })

    // Send failure email
    await sendTransactionEmail({
      userId: user.id,
      category: "AIRTIME",
      serviceName: `${network} Airtime`,
      amount: userAmount,
      status: "FAILED",
      transactionId: failedTransactionId,
      extras: [
        { label: "Phone", value: phone },
        { label: "Status", value: "Failed" },
        { label: "Reason", value: response.description || "Transaction could not be processed" },
      ],
    })

    return {
      success: false,
      message: response.description || "Transaction failed",
      transaction: {
        id: failedTransactionId,
        type: "airtime",
        network,
        phone,
        amount: userAmount,
        status: "failed",
        balance: balanceBefore,
      },
    }
  } catch (error) {
    console.error("[v0] Airtime purchase error:", error)
    return { success: false, message: "An error occurred while processing your request", error: String(error) }
  }
}
