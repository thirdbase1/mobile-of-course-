'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Settings, ChevronRight, CheckCircle2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { isHardcodedAdmin } from "@/lib/utils/hardcoded-admin"
import { ServiceGrid } from "@/components/service-grid"
import { TransactionList } from "@/components/transaction-list"
import { NotificationBell } from "@/components/notification-bell"
import { Logo } from "@/components/logo"
import { WalletCard } from "@/components/wallet-card"
import { setupSessionManager, cleanupSessionManager } from "@/lib/utils/session-check"

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[] | null>(null)
  const [banner, setBanner] = useState<
    | { kind: "confirmed"; title: string; subtitle: string }
    | { kind: "welcome"; title: string; subtitle: string }
    | null
  >(null)

  // Initialize session manager to detect multi-device logins
  useEffect(() => {
    const cleanup = setupSessionManager()
    return () => cleanup()
  }, [])

  // One-time top-of-page banners.
  //   ?confirmed=1 — set by the auth callback after email confirmation
  //   ?welcome=1   — set by /login after a successful sign-in, so the user
  //                  gets visible feedback that login worked (mirrors the
  //                  unconfirmed-email and session-expired notices on /login)
  // We clean the URL after reading so refreshing doesn't re-trigger them.
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

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      
      const { data: { user }, error } = await supabase.auth.getUser()

      if (!user || error) {
        console.error("[v0] Auth error:", error)
        // Mark transactions as "loaded but empty" so the placeholders go away
        setTransactions((prev) => prev ?? [])
        return
      }

      console.log("[v0] User authenticated:", user.id)
      setUser(user)

      // Check if user is hardcoded admin
      if (isHardcodedAdmin(user.email)) {
        console.log("[v0] User is hardcoded admin:", user.email)
        setIsAdmin(true)
      }

      // Always fetch profile from database regardless of admin status
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("[v0] Error fetching profile:", profileError)
      } else {
        console.log("[v0] Profile loaded:", {
          id: profileData?.id,
          wallet_balance: profileData?.wallet_balance,
          is_admin: profileData?.is_admin,
        })
        setProfile(profileData)
        // If not hardcoded admin, check database flag (set by proxy middleware)
        if (!isHardcodedAdmin(user.email) && profileData?.is_admin === true) {
          setIsAdmin(true)
        }
      }

      const { data: transactionsData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4)

      if (txError) {
        console.error("[v0] Error fetching transactions:", txError)
      } else {
        console.log("[v0] Transactions loaded:", transactionsData?.length || 0)
        setTransactions(transactionsData || [])
      }
    }

    load()
    
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  // No full-page skeleton — we render the actual layout instantly and only
  // the data-dependent slots (wallet card, transaction list) show inline
  // shimmers until their data arrives. This makes the dashboard feel fast
  // even on a slow first render.
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
        {/* One-time top banner: email-confirmed OR welcome-back after login */}
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

        {/* Wallet Card — render instantly. Until we have a user.id we show
            a thin placeholder card; once the auth check resolves the real
            WalletCard mounts and runs its own balance verification. */}
        <div className="mb-8 md:mb-12">
          {user ? (
            <WalletCard
              balance={walletBalance}
              userId={user.id}
              bvn={bvn}
              accountNumber={accountNumber}
              bankName={bankName}
            />
          ) : (
            <div className="wallet-card">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="balance-label">Wallet Balance</span>
                </div>
                <div className="balance-amount mb-4">
                  <span className="inline-block h-7 w-32 bg-white/20 rounded-md animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Services Grid */}
        <div className="mb-8 md:mb-12">
          <ServiceGrid />
        </div>

        {/* Recent Transactions */}
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
            {transactions === null ? (
              // Inline placeholders while the first fetch is in flight
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl animate-pulse"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-2/5" />
                      <div className="h-3 bg-slate-200/70 rounded w-1/3" />
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-4 bg-slate-200 rounded w-16 ml-auto" />
                      <div className="h-3 bg-slate-200/70 rounded w-12 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <TransactionList transactions={transactions} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
