"use server"

import { buyData, getDataPlans } from "@/lib/api/gsubz"
import { createClient } from "@/lib/supabase/server"
import { saveTransaction, atomicDeductWallet } from "@/lib/utils/save-transaction"
import { sendTransactionEmail } from "@/lib/email/send-transaction-email"
import { isValidAmount, isValidPhone } from "@/lib/utils/input-validation"
import { revalidatePath } from "next/cache"

export async function purchaseData(formData: FormData) {
  const plan = formData.get("plan") as string
  const phone = formData.get("phone") as string
  const amount = formData.get("amount") as string

  try {
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

    if (balanceBefore < userAmount) {
      return { success: false, message: "Insufficient wallet balance" }
    }

    const requestID = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
    const transactionId = `DATA-${requestID}`

    // STEP 1: Call gsubz API with 5-second timeout
    let gsubzResponse: any = null
    let isTimeout = false

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        isTimeout = true
      }, 5000) // 5 second timeout

      gsubzResponse = await Promise.race([
        buyData({
          plan,
          phone,
          amount: String(userAmount),
          requestID,
        }),
        new Promise((_, reject) =>
          controller.signal.addEventListener("abort", () => {
            clearTimeout(timeoutId)
            reject(new Error("API Timeout"))
          })
        ),
      ]).catch((err) => {
        clearTimeout(timeoutId)
        return { error: err.message }
      })
    } catch (apiErr) {
      isTimeout = true
      gsubzResponse = null
    }

    // Check if API call succeeded
    const isSuccess =
      gsubzResponse &&
      !gsubzResponse.error &&
      (gsubzResponse.code === 200 || gsubzResponse.code === "200" || gsubzResponse.code === "000") &&
      (gsubzResponse.status === "TRANSACTION_SUCCESSFUL" ||
        gsubzResponse.status === "success" ||
        gsubzResponse.status === "successful" ||
        gsubzResponse.description === "TRANSACTION_SUCCESSFUL")

    if (isSuccess) {
      // ✓ IMMEDIATE SUCCESS: API confirmed transaction within 5 seconds
      const { error: deductError } = await atomicDeductWallet(supabase, user.id, userAmount)
      if (deductError) {
        console.error("[v0] Balance deduction failed after confirmed purchase:", deductError)
      }

      const balanceAfter = balanceBefore - userAmount

      // Save transaction as SUCCESS
      await saveTransaction(supabase, {
        user_id: user.id,
        type: "data",
        status: "success",
        amount: userAmount,
        description: `Data Purchase · ${plan}`,
        metadata: {
          plan,
          phone,
          requestID,
        },
      })

      // Send confirmation email
      try {
        await sendTransactionEmail({
          email: user.email || "",
          userName: profile.name || user.email || "User",
          transactionType: "Data Purchase",
          amount: userAmount,
          phone,
          transactionId,
          status: "SUCCESS",
          balanceAfter,
        })
      } catch (emailErr) {
        console.error("[v0] Email sending failed:", emailErr)
      }

      revalidatePath("/dashboard")

      return {
        success: true,
        message: "Data purchase successful",
        transaction: {
          id: transactionId,
          type: "data",
          plan,
          phone,
          amount: userAmount,
          status: "success",
          balance: balanceAfter,
        },
      }
    } else if (isTimeout) {
      // ⏱️ TIMEOUT: API didn't respond in 5 seconds
      // Create PENDING transaction and tell user to wait for email
      const { error: deductError } = await atomicDeductWallet(supabase, user.id, userAmount)
      if (deductError) {
        return { success: false, message: "Failed to deduct balance. Please try again." }
      }

      const balanceAfter = balanceBefore - userAmount

      // Save as PENDING - will be verified in background
      await saveTransaction(supabase, {
        user_id: user.id,
        type: "data",
        status: "pending",
        amount: userAmount,
        description: `Data Purchase · ${plan}`,
        metadata: {
          plan,
          phone,
          requestID,
          isPending: true,
        },
      })

      // Send "pending" email
      try {
        await sendTransactionEmail({
          email: user.email || "",
          userName: profile.name || user.email || "User",
          transactionType: "Data Purchase",
          amount: userAmount,
          phone,
          transactionId,
          status: "PENDING",
          balanceAfter,
        })
      } catch (emailErr) {
        console.error("[v0] Email sending failed:", emailErr)
      }

      revalidatePath("/dashboard")

      return {
        success: true,
        message: "Purchase is being processed. Check your email for confirmation.",
        transaction: {
          id: transactionId,
          type: "data",
          plan,
          phone,
          amount: userAmount,
          status: "pending",
          balance: balanceAfter,
        },
      }
    } else {
      // ✗ FAILED: API returned error
      return {
        success: false,
        message: gsubzResponse?.description || "Transaction failed. Please try again.",
      }
    }
  } catch (error) {
    console.error("[v0] Purchase error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Purchase failed. Please try again.",
    }
  }
}

export async function fetchDataPlans() {
  try {
    const plans = await getDataPlans()
    return { success: true, data: plans }
  } catch (error) {
    console.error("[v0] Failed to fetch data plans:", error)
    return { success: false, error: "Failed to fetch data plans" }
  }
}
