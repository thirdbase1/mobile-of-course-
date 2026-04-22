"use server"

import { generateRechargePins as generatePinsAPI } from "@/lib/api/gsubz"
import { createClient } from "@/lib/supabase/server"

export async function generateRechargePins(data: { network: string; value: string; number: string }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to generate pins",
      }
    }

    // Check wallet balance
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", user.id).single()

    const totalCost = Number(data.value) * Number(data.number)

    if (!profile || profile.wallet_balance < totalCost) {
      return {
        success: false,
        error: `Insufficient wallet balance. You need ₦${totalCost.toLocaleString()} but your balance is ₦${(profile?.wallet_balance || 0).toLocaleString()}`,
      }
    }

    console.log("[v0] Generating recharge pins:", data)

    const response = await generatePinsAPI({
      network: data.network.toLowerCase(),
      value: data.value,
      number: data.number,
    })

    console.log("[v0] Recharge pins API response:", response)

    if (response.status === "error") {
      return {
        success: false,
        error: response.message || response.title || "Failed to generate pins. Please try again.",
      }
    }

    if (response.status === "success") {
      // Deduct from wallet
      const newBalance = wallet.balance - totalCost
      await supabase.from("wallets").update({ balance: newBalance }).eq("user_id", user.id)

      const transactionData = {
        user_id: user.id,
        transaction_id: response.id || "TXN" + Date.now(),
        amount: totalCost,
        service_name: "Recharge Pins",
        service_id: data.network.toLowerCase(),
        description: `${data.network.toUpperCase()} Recharge Pins - ${data.number} x ₦${data.value}`,
        phone: "",
        status: "success",
        api_response: JSON.stringify(response),
      }

      await supabase.from("transactions").insert(transactionData)

      return {
        success: true,
        message: response.message,
        pins: response.pins,
        delivered: response.delivered,
        pending: response.pending,
      }
    } else {
      return {
        success: false,
        error: response.message || "Failed to generate pins. Please try again.",
      }
    }
  } catch (error) {
    console.error("[v0] Recharge pins generation error:", error)
    return {
      success: false,
      error: "An error occurred while processing your request. Please try again or contact support.",
    }
  }
}
