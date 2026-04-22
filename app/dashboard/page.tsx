'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { Bell, Settings, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { isHardcodedAdmin } from "@/lib/utils/hardcoded-admin"
import { ServiceGrid } from "@/components/service-grid"
import { TransactionList } from "@/components/transaction-list"
import { NotificationBell } from "@/components/notification-bell"
import { Logo } from "@/components/logo"
import { WalletCard } from "@/components/wallet-card"

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Skeleton components
  const SkeletonCard = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-5 w-5 bg-slate-200 rounded animate-pulse"></div>
      </div>
      <div className="h-8 bg-slate-100 rounded w-1/2 animate-pulse"></div>
    </div>
  )

  const SkeletonTransaction = () => (
    <div className="border-b border-slate-100 py-4 px-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-5 bg-slate-200 rounded w-1/6"></div>
      </div>
    </div>
  )

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      
      const { data: { user }, error } = await supabase.auth.getUser()

      if (!user || error) {
        console.error("[v0] Auth error:", error)
        setLoading(false)
        return
      }

      console.log("[v0] User authenticated:", user.id)
      setUser(user)

      if (isHardcodedAdmin(user.email)) {
        console.log("[v0] User is hardcoded admin")
        setIsAdmin(true)
      } else {
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
          setIsAdmin(profileData?.is_admin === true)
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

      setLoading(false)
    }

    load()
    
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 w-full overflow-y-auto">
        <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-20 bg-slate-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full">
          <SkeletonCard />
          <SkeletonCard />
          <div className="mt-8">
            <div className="h-6 bg-slate-200 rounded w-1/4 mb-5 animate-pulse"></div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <SkeletonTransaction />
              <SkeletonTransaction />
              <SkeletonTransaction />
              <SkeletonTransaction />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 w-full flex items-center justify-center">
        <p className="text-slate-600">Not authenticated</p>
      </div>
    )
  }

  const walletBalance = profile?.wallet_balance ?? 0
  const bvn = profile?.bvn
  const accountNumber = profile?.monnify_account_number
  const bankName = profile?.monnify_bank_name

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-y-auto">
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
        {/* Wallet Card */}
        <div className="mb-8 md:mb-12">
          <WalletCard 
            balance={walletBalance} 
            userId={user.id}
            bvn={bvn}
            accountNumber={accountNumber}
            bankName={bankName}
          />
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
          <div className="divide-y divide-slate-200">
            <TransactionList transactions={transactions} />
          </div>
        </div>
      </main>
    </div>
  )
}
