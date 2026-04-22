"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, EyeOff, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getBankLogo, formatBankName } from "@/lib/utils/bank-utils"
import { createClient } from "@/lib/supabase/client"

interface WalletCardProps {
  balance: number
  userId: string
  accountNumber?: string
  bankName?: string
  bvn?: string
}

export function WalletCard({
  balance: _ignoredInitialBalance,
  userId,
  accountNumber: initialAccountNumber,
  bankName: initialBankName,
  bvn,
}: WalletCardProps) {
  const [isHidden, setIsHidden] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [liveBalance, setLiveBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Always fetch balance directly from DB and poll every 2 seconds.
  // This ensures it ALWAYS stays in sync with the database, whether
  // the admin credits the user or any other update happens.
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const supabase = createClient()

        // Get current user to verify auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          console.error("[v0] Auth error or no user:", authError)
          setLoading(false)
          return
        }

        // ALWAYS fetch balance fresh from DB for this user
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("[v0] Error fetching balance:", error)
          setLoading(false)
          return
        }

        const currentBalance = profile?.wallet_balance ?? 0
        console.log("[v0] Balance fetched:", {
          userId: user.id,
          balance: currentBalance,
          timestamp: new Date().toISOString(),
        })

        setLiveBalance(currentBalance)
        setLoading(false)
      } catch (error) {
        console.error("[v0] Balance fetch error:", error)
        setLoading(false)
      }
    }

    // Fetch immediately on mount
    fetchBalance()

    // Poll every 2 seconds to stay in sync with DB
    const interval = setInterval(fetchBalance, 2000)

    // Load balance visibility from localStorage
    const savedHidden = localStorage.getItem("walletBalanceHidden") === "true"
    setIsHidden(savedHidden)
    setMounted(true)

    return () => clearInterval(interval)
  }, [userId])

  const displayBalance = liveBalance ?? 0
  const balanceDisplay = isHidden ? "••••" : `₦${displayBalance.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 rounded-xl shadow-lg p-6 text-white overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Wallet Balance</p>
            <p className="text-3xl font-bold tracking-tight">
              {loading ? <span className="animate-pulse">Loading...</span> : balanceDisplay}
            </p>
          </div>

          {/* Toggle visibility */}
          <button
            onClick={() => {
              const newHidden = !isHidden
              setIsHidden(newHidden)
              localStorage.setItem("walletBalanceHidden", String(newHidden))
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={isHidden ? "Show balance" : "Hide balance"}
          >
            {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Account details */}
        {initialAccountNumber && initialBankName && (
          <div className="mb-6 pb-6 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              {getBankLogo(initialBankName) && (
                <img
                  src={getBankLogo(initialBankName) || ""}
                  alt={formatBankName(initialBankName)}
                  className="w-5 h-5 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
              )}
              <p className="text-xs font-medium text-slate-300">{formatBankName(initialBankName)}</p>
            </div>

            <div className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3">
              <p className="text-sm font-mono tracking-wider">{initialAccountNumber}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(initialAccountNumber)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                  toast({ title: "Copied!", description: "Account number copied to clipboard" })
                }}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
              >
                {copied ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} className="text-slate-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            href="/deposit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-center text-sm"
          >
            Fund Wallet
          </Link>
          <Link
            href="/dashboard/transactions"
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-center text-sm"
          >
            History
          </Link>
        </div>
      </div>
    </div>
  )
}
