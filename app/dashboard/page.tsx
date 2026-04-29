import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardClient } from "@/components/dashboard-client"

/**
 * Server-rendered dashboard.
 *
 * What used to happen on the client (auth.getUser → profile fetch →
 * transactions fetch → render) now happens on the server BEFORE any HTML
 * is streamed to the user. By the time the browser paints, the wallet
 * balance and the last 4 transactions are already in the markup — no
 * spinner, no shimmer, no waterfall.
 *
 * Realtime subscriptions for live balance/tx updates are kept inside
 * `<DashboardClient />`, which boots with this server data as initial
 * state.
 */
export default async function DashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Layout already redirects unauthenticated users, but we double-check
  // here so we can safely use `user.id` below.
  if (!user || authError) {
    redirect("/login")
  }

  // Profile + recent transactions in parallel on the server. RLS limits
  // both queries to the current user's rows.
  const [profileRes, transactionsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email ?? null}
      initialProfile={profileRes.data ?? null}
      initialTransactions={transactionsRes.data ?? []}
    />
  )
}
