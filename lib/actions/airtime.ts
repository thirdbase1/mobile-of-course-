"use server"

import { buyAirtime } from "@/lib/api/gsubz"
import { createClient } from "@/lib/supabase/server"
import { saveTransaction, updateWalletBalance } from "@/lib/utils/save-transaction"
import { sendTransactionEmail } from "@/lib/email/send-transaction-email"

export async function purchaseAirtime(formData: FormData) {
  const network = formData.get("network") as string
  const phone = formData.get("phone") as string
  const amount = formData.get("amount") as string

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
    const response = await buyAirtime({
      serviceID,
      amount: String(userAmount),
      phone,
      requestID,
    })

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
        category: "AIRTIME",
        serviceId: `${network.toLowerCase()}-airtime`,
        serviceName: `${network} Airtime`,
        serviceType: "Airtime",
        amount: userAmount,
        phone,
        status: "SUCCESS",
        description: `${network} Airtime · ${phone}`,
        balanceBefore,
        balanceAfter,
        apiResponse: response,
      })

      // Update wallet
      await updateWalletBalance(user.id, balanceAfter)

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
      serviceType: "Airtime",
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
