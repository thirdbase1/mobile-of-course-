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
  ShieldCheck,
  Loader2,
  ArrowRight,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

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

  const handleCancelClick = () => {
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = async () => {
    setCancelDialogOpen(false)
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
  // Pending state — PalmPay-style checkout layout
  // ──────────────────────────────────────────────
  const timerIsDanger = timeLeft <= 2 * 60 * 1000
  const timerIsWarn = !timerIsDanger && timeLeft <= 5 * 60 * 1000
  const timerColor = timerIsDanger
    ? "text-red-600"
    : timerIsWarn
      ? "text-amber-600"
      : "text-red-500"

  return (
    <div className="min-h-screen w-full bg-white font-sans flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 py-7">
        <div className="w-full max-w-md mx-auto">
          {/* Title — centered, dark navy */}
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Pay with bank transfer
          </h2>

          {/* Amount — centered, blue, hero */}
          <div className="text-center mb-7">
            <span className="text-4xl sm:text-5xl font-bold text-blue-600 tabular-nums">
              {"\u20A6"}
              {transaction.amount.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Bank details — light blue card */}
          {transaction.accountNumber && (
            <section className="bg-blue-50 rounded-2xl p-5 sm:p-6 mb-5">
              <p className="text-sm text-slate-700 mb-5">Please transfer to the following account</p>

              {/* Bank Name (inline) */}
              <div className="mb-5 flex items-center gap-3 flex-wrap">
                <p className="text-sm text-slate-500">Bank Name:</p>
                <p className="text-base font-bold text-slate-900">{transaction.bankName}</p>
              </div>

              {/* Account Number */}
              <div className="mb-5">
                <p className="text-sm text-slate-500 mb-1.5">
                  Account Number
                  <span className="text-xs text-slate-400">(Only for this transaction)</span>
                </p>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 tabular-nums tracking-wide break-all">
                    {transaction.accountNumber}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(transaction.accountNumber || "", "account")}
                    className={`px-5 py-1.5 text-sm font-semibold rounded-full border-2 transition flex-shrink-0 ${
                      copied === "account"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-white text-blue-600 border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    {copied === "account" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Account Name (inline) */}
              {transaction.accountName && (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-slate-500">Account Name:</p>
                  <p className="text-sm font-semibold text-slate-900">{transaction.accountName}</p>
                </div>
              )}
            </section>
          )}

          {/* Order expires timer — below card, red */}
          <p className="text-center text-sm text-slate-700 mb-5">
            Order Expires in{" "}
            <span className={`font-semibold ${timerColor}`}>{formatTime(timeLeft)}</span>
          </p>

          {/* Status banner */}
          {statusMessage && (
            <div
              className={`rounded-xl border p-3 mb-4 flex items-start gap-2 ${
                statusMessage.kind === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
              role="status"
            >
              {statusMessage.kind === "error" ? (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-4 h-4 flex-shrink-0 mt-0.5 animate-spin" />
              )}
              <p className="text-xs font-medium">{statusMessage.text}</p>
            </div>
          )}

          {/* Primary action — full-width rounded-full pill */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-base font-semibold rounded-full transition inline-flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "I've made the payment"
            )}
          </button>

          {/* Cancel — subtle text link */}
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={isCancelling}
            className="mt-3 w-full py-2 text-slate-500 hover:text-slate-700 font-medium text-xs"
          >
            {isCancelling ? "Cancelling..." : "Cancel payment"}
          </button>

          {/* Polling indicator (subtle) */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${
                  isPolling ? "" : "hidden"
                }`}
              />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Watching for your transfer
          </div>

          {/* Secured-by */}
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400 pb-4">
            <ShieldCheck className="w-3 h-3" />
            Payments secured by Monnify
          </div>
        </div>
      </main>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-bold">
              Cancel this payment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-slate-600">
              You can always start a new deposit. Your account won&apos;t be charged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700 text-white w-full rounded-xl h-11"
            >
              Yes, cancel payment
            </AlertDialogAction>
            <AlertDialogCancel className="w-full rounded-xl h-11 mt-0">
              Keep payment open
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

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
