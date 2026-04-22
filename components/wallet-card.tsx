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

export function WalletCard({ balance, userId, accountNumber: initialAccountNumber, bankName: initialBankName, bvn }: WalletCardProps) {
  const [isHidden, setIsHidden] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [verifiedBalance, setVerifiedBalance] = useState(balance)
  const [verifying, setVerifying] = useState(true)
  const { toast } = useToast()

  // Verify balance is from authenticated user on mount
  useEffect(() => {
    const verifyBalance = async () => {
      if (typeof window === 'undefined') {
        setVerifying(false)
        return
      }

      try {
        const supabase = createClient()
        
        // Verify the logged-in user matches the userId prop
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user || user.id !== userId) {
          console.error("[v0] Balance verification failed: user mismatch")
          toast({ title: "Security Error", description: "Unable to verify balance owner", variant: "destructive" })
          setVerifying(false)
          return
        }

        // Fetch balance directly from DB to ensure it's current
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("[v0] Error fetching balance:", error)
          setVerifying(false)
          return
        }

        const currentBalance = profile?.wallet_balance ?? 0
        console.log("[v0] Balance verified:", {
          userId: user.id,
          balance: currentBalance,
          matches: currentBalance === balance,
        })
        
        setVerifiedBalance(currentBalance)
        setVerifying(false)

        // Subscribe to real-time balance updates. When admin credits this user,
        // the balance updates in the DB, and this listener fires immediately.
        const subscription = supabase
          .channel(`profile:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              const newBalance = payload.new?.wallet_balance ?? 0
              console.log("[v0] Balance updated via realtime:", { newBalance })
              setVerifiedBalance(newBalance)
            }
          )
          .subscribe()

        // Cleanup subscription on unmount
        return () => {
          supabase.removeChannel(subscription)
        }
      } catch (error) {
        console.error("[v0] Balance verification error:", error)
        setVerifying(false)
      }
    }

    verifyBalance()

    // Load balance visibility state from localStorage on mount
    const savedHidden = localStorage.getItem('walletBalanceHidden') === 'true'
    setIsHidden(savedHidden)
    setMounted(true)
  }, [userId, balance, toast])

  // Save balance visibility state to localStorage when it changes
  const handleToggleBalance = (newState: boolean) => {
    setIsHidden(newState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('walletBalanceHidden', String(newState))
    }
  }

  const formattedBalance = verifiedBalance.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const handleCopy = async () => {
    if (initialAccountNumber) {
      await navigator.clipboard.writeText(initialAccountNumber.replace(/\s/g, ""))
      setCopied(true)
      toast({ title: "Copied!", description: "Account number copied to clipboard" })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const bankLogo = getBankLogo(initialBankName)

  if (verifying) {
    return (
      <div className="wallet-card">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="balance-label">Wallet Balance</span>
          </div>
          <div className="balance-amount mb-4">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-card">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <span className="balance-label">Wallet Balance</span>
          <button onClick={() => handleToggleBalance(!isHidden)} className="eye-btn">
            {isHidden ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
          </button>
        </div>

        <div className="balance-amount mb-4">{isHidden ? "********" : `₦${formattedBalance}`}</div>

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
