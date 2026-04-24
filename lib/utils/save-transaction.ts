"use server"

import { createClient } from "@/lib/supabase/server"
import { processReferralEarning } from "@/lib/referral"
import { sendTransactionEmail } from "@/lib/email/send-transaction-email"

export type TransactionCategory = "AIRTIME" | "DATA" | "CABLE" | "ELECTRICITY" | "WALLET_FUND" | "RECHARGE_PINS"
export type TransactionStatus = "SUCCESS" | "FAILED" | "PENDING"

export interface SaveTransactionPayload {
  userId: string
  transactionId: string
  category: TransactionCategory
  serviceId: string
  serviceName: string
  amount: number
  phone: string
  balanceBefore: number
  balanceAfter: number
  description: string
  status: TransactionStatus
  apiResponse?: Record<string, any>
  planDetails?: string
  serviceType?: string
}

/**
 * UNIFIED TRANSACTION LOGGING
 * This is the ONLY place where transactions are saved to database
 * All services (airtime, data, cable, electricity, wallet) must use this
 */
export async function saveTransaction(payload: SaveTransactionPayload) {
  try {
    const supabase = await createClient()

    const transactionData = {
      user_id: payload.userId,
      transaction_id: payload.transactionId,
      category: payload.category,
      service_id: payload.serviceId,
      service_name: payload.serviceName,
      service_type: payload.serviceType || null,
      amount: payload.amount,
      phone: payload.phone || "",
      status: payload.status,
      description: payload.description,
      balance_before: payload.balanceBefore,
      balance_after: payload.balanceAfter,
      api_response: payload.apiResponse ? JSON.stringify(payload.apiResponse) : null,
      plan_details: payload.planDetails || null,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("transactions").insert([transactionData])

    if (error) {
      console.error("[v0] Failed to save transaction:", error)
      throw error
    }

    console.log("[v0] Transaction saved:", {
      transactionId: payload.transactionId,
      category: payload.category,
      amount: payload.amount,
      status: payload.status,
    })

    // Process referral earning if transaction is successful
    processReferralEarning({
      id: payload.transactionId,
      user_id: payload.userId,
      category: payload.category,
      status: payload.status,
    }).catch(() => {})

    // Fire-and-forget receipt email. Email failures MUST NOT affect the
    // transaction flow — sendTransactionEmail is non-throwing internally.
    const extras: Array<{ label: string; value: string }> = []
    
    // Add recipient/smartcard info
    if (payload.phone) {
      const recipientLabel = payload.category === 'CABLE' ? 'Smartcard' : 'Recipient'
      extras.push({ label: recipientLabel, value: payload.phone })
    }
    
    // Add plan details for data and cable
    if (payload.planDetails) {
      const planLabel = payload.category === 'CABLE' ? 'Package' : 'Plan'
      extras.push({ label: planLabel, value: payload.planDetails })
    }
    
    // Add balance info
    extras.push({ label: 'Balance Before', value: `₦${Number(payload.balanceBefore).toLocaleString()}` })
    extras.push({ label: 'Balance After', value: `₦${Number(payload.balanceAfter).toLocaleString()}` })
    
    sendTransactionEmail({
      userId: payload.userId,
      category: payload.category,
      serviceName: payload.serviceName,
      amount: payload.amount,
      status: payload.status,
      transactionId: payload.transactionId,
      extras: extras.length > 0 ? extras : undefined,
    }).catch((err) => {
      console.error("[v0] sendTransactionEmail failed (swallowed):", err)
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error("[v0] saveTransaction error:", error)
    return {
      success: false,
      error: String(error),
    }
  }
}

/**
 * UPDATE WALLET BALANCE
 * After a successful transaction, ALWAYS call this to update user wallet
 */
export async function updateWalletBalance(userId: string, newBalance: number) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("profiles")
      .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      console.error("[v0] Failed to update wallet:", error)
      throw error
    }

    console.log("[v0] Wallet updated:", { userId, newBalance })

    return {
      success: true,
    }
  } catch (error) {
    console.error("[v0] updateWalletBalance error:", error)
    return {
      success: false,
      error: String(error),
    }
  }
}
