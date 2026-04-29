"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { calculateDepositFee, type DepositRules } from "@/lib/utils/deposit-fee"

interface DepositClientProps {
  initialRules: DepositRules | null
}

const MIN = 100
const MAX = 100000
const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

/**
 * Deposit form.
 *
 * The parent server component has already fetched the active deposit_rules
 * row before any HTML left the server, so the "you will receive" line and
 * the "Continue" button are interactive on first paint — no "Loading…"
 * flash.
 *
 * Realtime keeps the rules in sync if an admin updates fees while the user
 * is on the page. A silent polling fallback re-fetches every 20s when the
 * realtime channel isn't connected (and every 60s as a safety net), and it
 * only re-renders when the rules actually changed — so the UI stays
 * perfectly still unless something is genuinely different.
 */
export function DepositClient({ initialRules }: DepositClientProps) {
  const [rules, setRules] = useState<DepositRules | null>(initialRules)
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)

  const rulesRef = useRef<DepositRules | null>(initialRules)
  const realtimeConnectedRef = useRef<boolean>(false)

  useEffect(() => {
    rulesRef.current = rules
  }, [rules])

  // Realtime + silent polling for deposit_rules. Admins can change fees at
  // any time; we want users to see the new rules without ever showing a
  // loading state.
  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const fetchRules = async (): Promise<DepositRules | null> => {
      const { data } = await supabase
        .from("deposit_rules")
        .select("*")
        .eq("is_active", true)
        .maybeSingle()
      return data
    }

    const rulesChanged = (next: DepositRules | null, prev: DepositRules | null) => {
      if (!next || !prev) return next !== prev
      return (
        Number(next.base_fee) !== Number(prev.base_fee) ||
        Number(next.percentage_fee) !== Number(prev.percentage_fee) ||
        Number(next.threshold_amount) !== Number(prev.threshold_amount) ||
        (next.max_fee ?? null) !== (prev.max_fee ?? null) ||
        next.is_active !== prev.is_active
      )
    }

    const applyRules = (next: DepositRules | null) => {
      if (!mounted || !next) return
      if (!rulesChanged(next, rulesRef.current)) return
      setRules(next)
    }

    const channel = supabase
      .channel("deposit_rules:active")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deposit_rules" },
        async () => {
          // Any change → re-pull the active row (small, cheap query).
          const fresh = await fetchRules()
          applyRules(fresh)
        },
      )
      .subscribe((status) => {
        realtimeConnectedRef.current = status === "SUBSCRIBED"
      })

    const tick = async () => {
      if (!mounted) return
      if (typeof document !== "undefined" && document.hidden) return
      try {
        const fresh = await fetchRules()
        applyRules(fresh)
      } catch {
        /* silent */
      }
    }

    const fastInterval = setInterval(() => {
      if (!realtimeConnectedRef.current) tick()
    }, 20_000)
    const safetyInterval = setInterval(tick, 60_000)

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
      clearInterval(fastInterval)
      clearInterval(safetyInterval)
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus)
        document.removeEventListener("visibilitychange", onFocus)
      }
      supabase.removeChannel(channel)
    }
  }, [])

  const numAmount = amount ? Number.parseFloat(amount) : 0
  const calculation = rules && numAmount > 0 ? calculateDepositFee(numAmount, rules) : null
  const showReceiveBox = numAmount > 0 && !error

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString())
    setError("")
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    setError("")
    if (!value) return
    const num = Number.parseFloat(value)
    if (num < MIN) setError(`Minimum deposit is ₦${MIN.toLocaleString()}`)
    else if (num > MAX) setError(`Maximum deposit is ₦${MAX.toLocaleString()}`)
  }

  const handleContinue = async () => {
    if (!calculation || calculation.depositAmount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setProcessing(true)

    try {
      const response = await fetch("/api/deposit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: calculation.depositAmount,
          processingFee: calculation.processingFee,
          netAmount: calculation.netAmount,
          description: "Wallet deposit",
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Deposit failed")
      }

      const data = await response.json()
      window.location.href = data.checkoutUrl || data.paymentUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process deposit")
      setProcessing(false)
    }
  }

  // If, somehow, the server returned no rules row (shouldn't happen — we seed
  // a default), the form still renders and the continue button is disabled.
  const rulesAvailable = !!rules

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-1">Add Funds</h1>
        <p className="text-sm text-gray-500 mb-6">Fund your wallet securely</p>

        <div className="mb-3">
          <label htmlFor="amount" className="text-sm font-medium text-gray-900">
            Enter Amount
          </label>
          <input
            id="amount"
            type="number"
            inputMode="numeric"
            placeholder="₦1000"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            disabled={processing}
            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black/10 disabled:bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_AMOUNTS.map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => handleQuickAmount(quickAmount)}
              disabled={processing}
              className={`rounded-xl py-2 text-sm font-medium transition-all ${
                amount === quickAmount.toString()
                  ? "bg-black text-white"
                  : "border border-gray-200 text-gray-900 hover:border-gray-300"
              } disabled:opacity-50`}
            >
              {quickAmount >= 1000 ? `₦${quickAmount / 1000}k` : `₦${quickAmount}`}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Minimum: ₦{MIN.toLocaleString()} • Maximum: ₦{MAX.toLocaleString()}
        </p>

        {showReceiveBox && calculation && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-600">
              You will receive{" "}
              <span className="font-semibold text-black">
                ₦{calculation.netAmount.toLocaleString()}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Final amount after processing</p>
          </div>
        )}

        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={
            !rulesAvailable ||
            !calculation ||
            calculation.depositAmount <= 0 ||
            processing ||
            !!error
          }
          className="w-full bg-black text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Processing..." : "Continue"}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Secure payments powered by Monnify
        </p>
      </div>
    </div>
  )
}
