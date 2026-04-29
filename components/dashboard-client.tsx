"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Settings, ChevronRight, CheckCircle2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { isHardcodedAdmin } from "@/lib/utils/hardcoded-admin"
import { ServiceGrid } from "@/components/service-grid"
import { TransactionList } from "@/components/transaction-list"
import { NotificationBell } from "@/components/notification-bell"
import { Logo } from "@/components/logo"
import { WalletCard } from "@/components/wallet-card"
import { setupSessionManager } from "@/lib/utils/session-check"

interface DashboardClientProps {
  userId: string
  userEmail: string | null
  initialProfile: any
  initialTransactions: any[]
}

/**
 * Dashboard client wrapper.
 *
 * The parent server component (`app/dashboard/page.tsx`) has ALREADY fetched
 * the profile and the last 4 transactions on the server before any HTML
 * was sent. We hydrate this component with that data as the initial state,
 * so the wallet balance and transactions are real and final on first paint.
 *
 * Realtime stays on top of that: a Supabase channel scoped to this user
 * pushes profile + transaction updates so the dashboard stays live without
 * polling and without a refresh.
 */
export function DashboardClient({
  userId,
  userEmail,
  initialProfile,
  initialTransactions,
}: DashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [profile, setProfile] = useState<any>(initialProfile)
  const [transactions, setTransactions] = useState<any[]>(initialTransactions)
  const [isAdmin, setIsAdmin] = useState<boolean>(
    isHardcodedAdmin(userEmail) || initialProfile?.is_admin === true,
  )

  const [banner, setBanner] = useState<
    | { kind: "confirmed"; title: string; subtitle: string }
    | { kind: "welcome"; title: string; subtitle: string }
    | null
  >(null)

  // Multi-device session detection
  useEffect(() => {
    const cleanup = setupSessionManager()
    return () => cleanup()
  }, [])

  // One-time top-of-page banners (?confirmed=1 / ?welcome=1)
  useEffect(() => {
    const confirmed = searchParams.get("confirmed") === "1"
    const welcome = searchParams.get("welcome") === "1"
    if (!confirmed && !welcome) return

    if (confirmed) {
      setBanner({
        kind: "confirmed",
        title: "Email confirmed — welcome to Mozosubz!",
        subtitle: "Fund your wallet to start buying airtime, data, and more.",
      })
    } else {
      setBanner({
        kind: "welcome",
        title: "Signed in successfully",
        subtitle: "Welcome back. Your wallet is ready.",
      })
    }

    router.replace("/dashboard", { scroll: false })
    const id = setTimeout(() => setBanner(null), 5000)
    return () => clearTimeout(id)
  }, [searchParams, router])

  // Refs let the polling loop see the latest values without re-running
  // the effect every time state changes (which would tear down the channel).
  const profileRef = useRef<any>(initialProfile)
  const transactionsRef = useRef<any[]>(initialTransactions)
  const realtimeConnectedRef = useRef<boolean>(false)

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  useEffect(() => {
    transactionsRef.current = transactions
  }, [transactions])

  // Realtime + silent polling fallback.
  //
  // Primary path: a Supabase realtime channel pushes profile + transaction
  // changes the instant they happen. RLS scopes both tables to the owner,
  // so we only ever receive our own rows.
  //
  // Fallback path: a quiet background poll re-fetches the same data on an
  // interval. It NEVER touches loading state, never shows a spinner, and
  // only calls setState when the new value is actually different from
  // what's already on screen — so the UI stays perfectly still unless
  // something genuinely changed. The poll is also paused when the tab is
  // hidden to save battery + bandwidth.
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    let mounted = true

    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
      return data
    }

    const fetchTransactions = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(4)
      return data ?? []
    }

    // Compare the fields we actually render. If nothing changed, skip
    // setState entirely so React doesn't even consider a re-render.
    const profileChanged = (next: any, prev: any) => {
      if (!next || !prev) return next !== prev
      return (
        next.wallet_balance !== prev.wallet_balance ||
        next.bvn !== prev.bvn ||
        next.monnify_account_number !== prev.monnify_account_number ||
        next.monnify_bank_name !== prev.monnify_bank_name ||
        next.is_admin !== prev.is_admin ||
        next.full_name !== prev.full_name ||
        next.phone !== prev.phone
      )
    }

    const transactionsChanged = (next: any[], prev: any[]) => {
      if (next.length !== prev.length) return true
      for (let i = 0; i < next.length; i++) {
        const a = next[i]
        const b = prev[i]
        if (a.id !== b.id || a.status !== b.status || a.amount !== b.amount) return true
      }
      return false
    }

    const applyProfile = (next: any) => {
      if (!mounted || !next) return
      if (!profileChanged(next, profileRef.current)) {
        console.log("[v0] Profile unchanged, skipping update")
        return
      }
      console.log("[v0] Applying profile update:", next.wallet_balance, "from", profileRef.current?.wallet_balance)
      setProfile(next)
      if (!isHardcodedAdmin(userEmail) && next?.is_admin === true) {
        setIsAdmin(true)
      }
    }

    const applyTransactions = (next: any[]) => {
      if (!mounted) return
      if (!transactionsChanged(next, transactionsRef.current)) {
        console.log("[v0] Transactions unchanged, skipping update")
        return
      }
      console.log("[v0] Applying transactions update:", next?.length, "from", transactionsRef.current?.length)
      setTransactions(next)
    }

    // ---- Realtime channel ----
    const channel = supabase
      .channel(`dashboard:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log("[v0] Realtime profile update:", payload.new?.wallet_balance)
          applyProfile(payload.new)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const fresh = await fetchTransactions()
          console.log("[v0] Realtime transaction update:", fresh?.length)
          applyTransactions(fresh)
        },
      )
      .subscribe((status) => {
        console.log("[v0] Realtime status:", status)
        realtimeConnectedRef.current = status === "SUBSCRIBED"
      })

    // ---- Silent polling ----
    // Polls every 5s to keep balance fresh. Always runs as safety net
    // even when realtime is active. Always silent — no loading UI,
    // no state update unless data actually changed.
    const tick = async () => {
      if (!mounted) return
      if (typeof document !== "undefined" && document.hidden) return
      try {
        const [p, t] = await Promise.all([fetchProfile(), fetchTransactions()])
        applyProfile(p)
        applyTransactions(t)
        console.log("[v0] Polling tick: profile =", p?.wallet_balance, ", transactions =", t?.length)
      } catch (error) {
        // Network blip — ignore, next tick will retry. Never disturb the UI.
        console.log("[v0] Polling error:", error)
      }
    }

    // Run immediate tick on mount to ensure we have fresh data
    tick()

    const pollInterval = setInterval(() => {
      tick()
    }, 5_000)

    // Re-sync immediately when the tab regains focus (catches anything
    // missed while the tab was backgrounded).
    const onFocus = () => {
      if (!mounted) return
      if (typeof document !== "undefined" && document.hidden) return
      tick()
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus)
      document.addEventListener("visibilitychange", onFocus)
    }

    return () => {
      mounted = false
      clearInterval(pollInterval)
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus)
        document.removeEventListener("visibilitychange", onFocus)
      }
      supabase.removeChannel(channel)
    }
  }, [userId, userEmail])

  const walletBalance = profile?.wallet_balance ?? 0
  const bvn = profile?.bvn
  const accountNumber = profile?.monnify_account_number
  const bankName = profile?.monnify_bank_name

  return (
    <div className="bg-slate-50 w-full min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs font-semibold text-blue-600 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition"
                title="Admin Panel"
              >
                <Settings size={14} />
                Admin
              </Link>
            )}
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8 w-full">
        {banner && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-900">{banner.title}</p>
              <p className="text-xs text-green-700/90 mt-0.5">{banner.subtitle}</p>
            </div>
            <button
              onClick={() => setBanner(null)}
              className="flex-shrink-0 p-1 rounded-md text-green-700 hover:bg-green-100 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Wallet Card — real balance on first paint, no skeleton */}
        <div className="mb-8 md:mb-12">
          <WalletCard
            balance={walletBalance}
            userId={userId}
            bvn={bvn}
            accountNumber={accountNumber}
            bankName={bankName}
          />
        </div>

        {/* Services Grid */}
        <div className="mb-8 md:mb-12">
          <ServiceGrid />
        </div>

        {/* Recent Transactions — real list on first paint */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
            <Link
              href="/dashboard/transactions"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              See all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-slate-200 p-4">
            <TransactionList transactions={transactions} />
          </div>
        </div>
      </main>
    </div>
  )
}
