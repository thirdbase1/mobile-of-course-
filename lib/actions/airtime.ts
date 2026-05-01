"use server"

import { buyAirtime } from "@/lib/api/gsubz"
import { createClient } from "@/lib/supabase/server"
import { saveTransaction, atomicDeductWallet, atomicRefundWallet } from "@/lib/utils/save-transaction"
import { sendTransactionEmail } from "@/lib/email/send-transaction-email"
import { isValidAmount, isValidPhone } from "@/lib/utils/input-validation"
import { revalidatePath } from "next/cache"

// Background verification function - doesn't wait, just verifies
async function verifyAirtimePurchase({
  serviceID,
  phone,
  amount,
  requestID,
  transactionId,
  userId,
  network,
}: {
  serviceID: string
  phone: string
  amount: string
  requestID: string
  transactionId: string
  userId: string
  network: string
}) {
  try {
    console.log("[v0] Starting background verification for:", requestID)
    const response = await buyAirtime({
      serviceID,
      phone,
      amount,
      requestID,
    })

    const isSuccess =
      (response.code === 200 || response.code === "200" || response.code === "000") &&
      (response.status === "TRANSACTION_SUCCESSFUL" ||
        response.status === "success" ||
        response.status === "successful" ||
        response.description === "TRANSACTION_SUCCESSFUL")

    const supabase = await createClient()
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", userId).single()

    if (isSuccess) {
      console.log("[v0] Background verification succeeded for:", requestID)
      // Update transaction status to success
      await supabase
        .from("transactions")
        .update({ status: "success" })
        .eq("id", transactionId)

      // Send success email
      if (profile?.email) {
        try {
          await sendTransactionEmail({
            email: profile.email,
            type: "airtime",
            status: "success",
            amount: Number(amount),
            network,
            phone,
            balance: Number(profile.wallet_balance),
          })
        } catch (emailErr) {
          console.error("[v0] Email sending failed:", emailErr)
        }
      }
    } else {
      console.log("[v0] Background verification failed for:", requestID, "Refunding...")
      // Refund the amount
      await atomicRefundWallet(supabase, userId, Number(amount))

      // Update transaction status to failed
      await supabase
        .from("transactions")
        .update({ status: "failed", description: response.description || "Transaction failed" })
        .eq("id", transactionId)

      // Send failure email
      if (profile?.email) {
        try {
          await sendTransactionEmail({
            email: profile.email,
            type: "airtime",
            status: "failed",
            amount: Number(amount),
            network,
            phone,
            balance: Number(profile.wallet_balance),
          })
        } catch (emailErr) {
          console.error("[v0] Email sending failed:", emailErr)
        }
      }
    }

    revalidatePath("/dashboard")
  } catch (error) {
    console.error("[v0] Background verification error:", error)
    // On error, assume failure and refund
    try {
      const supabase = await createClient()
      await atomicRefundWallet(supabase, userId, Number(amount))
      await supabase
        .from("transactions")
        .update({ status: "failed", description: "Verification timeout" })
        .eq("id", transactionId)
      revalidatePath("/dashboard")
    } catch (refundErr) {
      console.error("[v0] Refund failed:", refundErr)
    }
  }
}

export async function purchaseAirtime(formData: FormData) {
  const network = formData.get("network") as string
  const phone = formData.get("phone") as string
  const amount = formData.get("amount") as string

  const startTime = Date.now()

  try {
    // SECURITY: Validate inputs
    const numAmount = parseFloat(amount)
    if (!isValidAmount(numAmount) || numAmount <= 0) {
      return { success: false, message: "Invalid amount" }
    }

    if (!isValidPhone(phone)) {
      return { success: false, message: "Invalid phone number" }
    }

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

    // OPTIMISTIC UPDATE: Deduct balance immediately
    const { error: deductError } = await atomicDeductWallet(supabase, user.id, userAmount)
    if (deductError) {
      return { success: false, message: "Failed to deduct balance. Please try again." }
    }

    const balanceAfter = balanceBefore - userAmount
    const transactionId = `AIRTIME-${requestID}`

    // Create transaction record immediately (status: pending)
    const { data: transaction } = await saveTransaction(supabase, {
      user_id: user.id,
      type: "airtime",
      status: "pending",
      amount: userAmount,
      description: `Airtime: ${network.toUpperCase()} - ${phone}`,
      metadata: {
        network,
        phone,
        serviceID,
        requestID,
        isOptimistic: true, // Mark as optimistic
      },
    })

    // VERIFY IN BACKGROUND (don't wait for this)
    // Send the verification as a fire-and-forget operation
    verifyAirtimePurchase({
      serviceID,
      phone,
      amount: String(userAmount),
      requestID,
      transactionId,
      userId: user.id,
      network,
    }).catch((err) => console.error("[v0] Background verification failed:", err))

    // Return success immediately
    return {
      success: true,
      message: "Airtime purchase successful",
      transaction: {
        id: transactionId,
        type: "airtime",
        network,
        phone,
        amount: userAmount,
        status: "pending", // Show as pending until verified
        balance: balanceAfter,
      },
    }
  } catch (error) {
    console.error("[v0] Purchase error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Purchase failed. Please try again.",
    }
  }
}
