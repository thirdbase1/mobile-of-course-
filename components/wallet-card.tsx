"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WalletCardProps {
  balance: number
  userId: string
  accountNumber?: string
  bankName?: string
  bvn?: string
}

// The dashboard now fetches the wallet balance once on mount and keeps it
// in sync via a Supabase Realtime channel. This card receives the live
// `balance` as a prop, so we no longer run our own auth + profile fetch
// (the duplicate that was producing the "Loading..." flash AFTER the
// dashboard had already painted). Render is instant and 100% reactive.
export function WalletCard({
  balance,
  userId: _userId,
  accountNumber: _accountNumber,
  bankName: _bankName,
  bvn: _bvn,
}: WalletCardProps) {
  const [isHidden, setIsHidden] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast: _toast } = useToast()

  // Restore the user's "hide balance" preference on mount.
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsHidden(localStorage.getItem("walletBalanceHidden") === "true")
    }
    setMounted(true)
  }, [])

  const handleToggleBalance = (newState: boolean) => {
    setIsHidden(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem("walletBalanceHidden", String(newState))
    }
  }

  const formattedBalance = balance.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="wallet-card">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <span className="balance-label">Wallet Balance</span>
          <button
            onClick={() => handleToggleBalance(!isHidden)}
            className="eye-btn"
            aria-label={isHidden ? "Show balance" : "Hide balance"}
          >
            {mounted && isHidden ? (
              <EyeOff style={{ width: 15, height: 15 }} />
            ) : (
              <Eye style={{ width: 15, height: 15 }} />
            )}
          </button>
        </div>

        <div className="balance-amount mb-4">
          {mounted && isHidden ? "********" : `\u20A6${formattedBalance}`}
        </div>

        <div className="flex items-end justify-between">
          <div className="flex-1">
            <p className="account-label">Quick Actions</p>
            <Link
              href="/dashboard/deposit"
              className="w-full py-2 px-3 mt-3 bg-[#10b981] hover:bg-[#059669] rounded-lg text-xs text-white font-semibold transition-colors block text-center"
            >
              Deposit Funds
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
