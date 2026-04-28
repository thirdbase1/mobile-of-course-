"use server"

import { createClient } from "@/lib/supabase/server"

export async function getWalletBalance() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        balance: 0,
        currency: "NGN",
      }
    }

    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", user.id).single()

    return {
      balance: profile?.wallet_balance || 0,
      currency: "NGN",
    }
  } catch (error) {
    return {
      balance: 0,
      currency: "NGN",
    }
  }
}

export async function getTransactions(filters?: { category?: string; status?: string; search?: string; limit?: number }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        transactions: [],
        total: 0,
      }
    }

    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category.toUpperCase())
    }

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status.toUpperCase())
    }

    if (filters?.search) {
      query = query.or(
        `description.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,transaction_id.ilike.%${filters.search}%`
      )
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data: transactions, count } = await query

    return {
      transactions: transactions || [],
      total: count || 0,
    }
  } catch (error) {
    console.error("[v0] Error fetching transactions:", error)
    return {
      transactions: [],
      total: 0,
    }
  }
}
