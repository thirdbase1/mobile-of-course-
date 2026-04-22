"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Clock,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react"

interface Transaction {
  id: string
  paymentReference: string
  transactionReference: string | null
  amount: number
  status: "PENDING" | "SUCCESS" | "EXPIRED" | "CANCELLED"
  accountNumber: string | null
  bankName: string | null
  accountName: string | null
  ussdCode: string | null
  expiresAt: string
  paidAt: string | null
  processing_fee?: number
}

interface CheckoutClientProps {
  paymentReference: string
  transaction: Transaction
  onCancel: (ref: string) => Promise<any>
  onVerify: (ref: string) => Promise<any>
}

// Must match the TTL set in /api/deposit/start (currently 20 minutes)
const TOTAL_DURATION_MS = 20 * 60 * 1000

export function CheckoutClient({ paymentReference, transaction: initialTransaction }: CheckoutClientProps) {
  const expiresAtMs = new Date(initialTransaction.expiresAt).getTime()
  const expiresAtRef = useRef(expiresAtMs)

  const [transaction, setTransaction] = useState(initialTransaction)
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, expiresAtMs - Date.now()))
  const [copied, setCopied] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // Countdown
  useEffect(() => {
    if (transaction.status !== "PENDING") return
    const t = setInterval(() => {
      const remaining = Math.max(0, expiresAtRef.current - Date.now())
      setTimeLeft(remaining)
      if (remaining <= 0) {
        setTransaction((prev) => ({ ...prev, status: "EXPIRED" }))
      }
    }, 1000)
    return () => clearInterval(t)
  }, [transaction.status])

  // Poll for payment confirmation
  useEffect(() => {
    if (transaction.status !== "PENDING") return

    const graceEnd = expiresAtRef.current + 5 * 60 * 1000
    if (Date.now() > graceEnd) return

    let cancelled = false

    const poll = async () => {
      setIsPolling(true)
      try {
        const res = await fetch(`/api/checkout/${paymentReference}/query`, { method: "POST" })
        const data = await res.json()
        if (!cancelled && data?.success && data.data?.status && data.data.status !== transaction.status) {
          setTransaction(data.data)
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setIsPolling(false)
      }
    }

    const startDelay = setTimeout(poll, 2000)
    const interval = setInterval(poll, 10000)

    return () => {
      cancelled = true
      clearTimeout(startDelay)
      clearInterval(interval)
    }
  }, [transaction.status, paymentReference])

  const formatTime = (ms: number) => {
    const s = Math.floor((ms / 1000) % 60)
    const m = Math.floor(ms / 1000 / 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const timerTone =
    timeLeft <= 2 * 60 * 1000 ? "danger" : timeLeft <= 5 * 60 * 1000 ? "warn" : "ok"

  const timerColors = {
    ok: { text: "text-blue-600", ring: "stroke-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    warn: { text: "text-amber-600", ring: "stroke-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
    danger: { text: "text-red-600", ring: "stroke-red-600", bg: "bg-red-50", border: "border-red-200" },
  }[timerTone]

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / TOTAL_DURATION_MS) * 100))

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2500)
    } catch {
      setStatusMessage({ kind: "error", text: "Unable to copy. Please select and copy manually." })
    }
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    setStatusMessage({ kind: "info", text: "Verifying your payment with the bank..." })
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReference }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setStatusMessage({
          kind: "error",
          text: data.error || "We couldn't confirm your payment yet. Give it a moment and try again.",
        })
        setIsVerifying(false)
        return
      }
      setTimeout(() => window.location.reload(), 800)
    } catch {
      setStatusMessage({ kind: "error", text: "Couldn't reach the server. Check your connection and try again." })
      setIsVerifying(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Cancel this payment? You can always start a new deposit.")) return
    setIsCancelling(true)
    try {
      const res = await fetch(`/api/checkout/${paymentReference}/cancel`, { method: "POST" })
      const data = await res.json()
      if (data?.success) {
        setTransaction((prev) => ({ ...prev, status: "CANCELLED" }))
      } else {
        setStatusMessage({ kind: "error", text: "Failed to cancel. Please try again." })
      }
    } catch {
      setStatusMessage({ kind: "error", text: "Network error while cancelling." })
    } finally {
      setIsCancelling(false)
    }
  }

  // ──────────────────────────────────────────────
  // Terminal states
  // ──────────────────────────────────────────────
  if (transaction.status === "SUCCESS") {
    const credited = transaction.amount - (transaction.processing_fee || 0)
    return (
      <ResultShell>
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8" strokeWidth={2.25} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment received</h1>
        <p className="text-slate-600 mb-6">
          Your wallet has been credited with{" "}
          <span className="font-bold text-slate-900">₦{credited.toLocaleString()}</span>.
        </p>
        <ReferenceCard label="Transaction reference" value={transaction.transactionReference || transaction.id} />
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          Back to dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </ResultShell>
    )
  }

  if (transaction.status === "EXPIRED") {
    return (
      <ResultShell>
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-5">
          <Clock className="w-7 h-7" strokeWidth={2.25} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">This payment expired</h1>
        <p className="text-slate-600 mb-6">
          One-time accounts are short-lived for your security. No charges were made.
        </p>
        <Link
          href="/dashboard/deposit"
          className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          Start a new deposit
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
        <Link
          href="/dashboard"
          className="mt-3 inline-flex items-center justify-center w-full px-6 py-3 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
        >
          Back to dashboard
        </Link>
      </ResultShell>
    )
  }

  if (transaction.status === "CANCELLED") {
    return (
      <ResultShell>
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-7 h-7" strokeWidth={2.25} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment cancelled</h1>
        <p className="text-slate-600 mb-6">You cancelled this payment. No charges were made.</p>
        <Link
          href="/dashboard/deposit"
          className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          Start a new deposit
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
        <Link
          href="/dashboard"
          className="mt-3 inline-flex items-center justify-center w-full px-6 py-3 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
        >
          Back to dashboard
        </Link>
      </ResultShell>
    )
  }

  // ──────────────────────────────────────────────
  // Pending state
  // ──────────────────────────────────────────────
  const amountStr = transaction.amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const amountCopyStr = transaction.amount.toString()

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/icon.svg" alt="Mozosubz" className="w-7 h-7 rounded-md" />
            <span className="font-bold text-slate-900 text-sm">Mozosubz</span>
          </Link>

          {/* Compact inline timer in header */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold tabular-nums ${timerColors.bg} ${timerColors.border} ${timerColors.text}`}
            aria-live="polite"
          >
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-40 md:pb-24">
        {/* Amount card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-4 relative overflow-hidden">
          {/* Decorative ring timer — desktop visible, mobile hidden to save space */}
          <div className="hidden sm:block absolute top-5 right-5">
            <TimerRing percent={progressPercent} colorClass={timerColors.ring} />
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Transfer exactly</p>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-slate-500">₦</span>
            <span className="text-4xl sm:text-5xl font-bold text-slate-900 tabular-nums">{amountStr}</span>
          </div>
          <button
            onClick={() => handleCopy(amountCopyStr, "amount")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            {copied === "amount" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Amount copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy amount
              </>
            )}
          </button>

          {/* One-time account reassurance */}
          <div className="mt-5 flex items-start gap-2.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3">
            <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
            <span>
              This is a one-time account. Transfer the <span className="font-semibold text-slate-900">exact amount</span>{" "}
              — if you send a different amount, the payment will not be recognized.
            </span>
          </div>
        </section>

        {/* Polling indicator */}
        <div
          className="flex items-center justify-center gap-2 py-3 mb-2 text-xs font-medium text-slate-600"
          aria-live="polite"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${
                isPolling ? "" : "hidden"
              }`}
            />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Watching for your transfer — this page updates automatically
        </div>

        {/* Bank details card */}
        {transaction.accountNumber && (
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank details</h2>
            </div>

            {/* Bank */}
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Bank</p>
              <p className="text-base font-bold text-slate-900">{transaction.bankName}</p>
            </div>

            {/* Account number — tap entire row to copy */}
            <button
              onClick={() => handleCopy(transaction.accountNumber || "", "account")}
              className="w-full px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-50 transition text-left group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">Account number</p>
                <p className="text-xl font-mono font-bold text-slate-900 tracking-wider tabular-nums truncate">
                  {transaction.accountNumber}
                </p>
              </div>
              <span
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition ${
                  copied === "account"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                }`}
              >
                {copied === "account" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </span>
            </button>

            {/* Account name */}
            {transaction.accountName && (
              <div className="px-5 py-4">
                <p className="text-xs text-slate-500 mb-1">Account name</p>
                <p className="text-sm font-semibold text-slate-900">{transaction.accountName}</p>
              </div>
            )}
          </section>
        )}

        {/* How to pay */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">How to pay</h2>
          <ol className="space-y-3">
            {[
              "Open your bank app or dial your transfer USSD code.",
              <>
                Transfer <span className="font-bold text-slate-900">exactly ₦{amountStr}</span> to the account above.
              </>,
              "Tap 'I've made the payment' — your wallet credits in seconds.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Danger / info banner */}
        {statusMessage && (
          <div
            className={`rounded-xl border p-4 mb-4 flex items-start gap-3 ${
              statusMessage.kind === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
            role="status"
          >
            {statusMessage.kind === "error" ? (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <Loader2 className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />
            )}
            <p className="text-sm font-medium">{statusMessage.text}</p>
          </div>
        )}

        {/* Desktop action buttons */}
        <div className="hidden md:flex flex-col gap-3 mb-6">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition inline-flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                I&apos;ve made the payment
              </>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full py-3 text-slate-600 hover:text-slate-900 font-semibold rounded-lg transition text-sm"
          >
            {isCancelling ? "Cancelling..." : "Cancel payment"}
          </button>
        </div>

        {/* Footer: secured-by badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          Payments secured by Monnify
        </div>
      </main>

      {/* Sticky mobile action bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-4px_16px_-4px_rgba(15,23,42,0.08)]">
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition inline-flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              I&apos;ve made the payment
            </>
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="w-full py-2.5 mt-1 text-slate-600 hover:text-slate-900 font-semibold text-xs"
        >
          {isCancelling ? "Cancelling..." : "Cancel payment"}
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function TimerRing({ percent, colorClass }: { percent: number; colorClass: string }) {
  const size = 56
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="stroke-slate-100 fill-none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        className={`fill-none transition-[stroke-dashoffset] duration-1000 ease-linear ${colorClass}`}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

function ResultShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-3 flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/icon.svg" alt="Mozosubz" className="w-7 h-7 rounded-md" />
            <span className="font-bold text-slate-900 text-sm">Mozosubz</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-7 sm:p-9 text-center">
          {children}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            Payments secured by Monnify
          </div>
        </div>
      </main>
    </div>
  )
}

function ReferenceCard({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    } catch {
      /* no-op */
    }
  }
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-mono font-bold text-slate-900 break-all">{value}</p>
        <button
          onClick={copy}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-md transition ${
            done ? "bg-emerald-100 text-emerald-700" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          aria-label="Copy reference"
        >
          {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {done ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}
