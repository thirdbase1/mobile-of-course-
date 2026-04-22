"use client"

import { useState } from "react"
import { Loader2, Check, AlertCircle } from "lucide-react"

interface Props {
  token: string
  category: "transactional" | "marketing"
}

type Scope = "transactional" | "marketing" | "all"

export function UnsubscribeForm({ token, category }: Props) {
  const [loading, setLoading] = useState<Scope | null>(null)
  const [done, setDone] = useState<{ scope: Scope; resubscribed: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(scope: Scope, resubscribe: boolean) {
    setLoading(scope)
    setError(null)
    try {
      const res = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, category: scope, resubscribe }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not save your preference. Please try again.")
        setLoading(null)
        return
      }
      setDone({ scope, resubscribed: resubscribe })
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  if (done) {
    const label =
      done.scope === "all"
        ? "all Mozosubz emails"
        : done.scope === "transactional"
        ? "transaction receipts"
        : "marketing emails"
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-emerald-600" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-2">
          {done.resubscribed ? "You're subscribed" : "You've been unsubscribed"}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {done.resubscribed
            ? `You will continue to receive ${label} from Mozosubz.`
            : `You will no longer receive ${label}.`}{" "}
          {done.scope === "transactional" && !done.resubscribed && (
            <span className="block mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Heads up: you will not get payment confirmations or receipts while this is off.
            </span>
          )}
        </p>
        <button
          onClick={() => setDone(null)}
          className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Change again
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-2">Email preferences</h1>
      <p className="text-sm text-slate-600 leading-relaxed mb-6">
        You received this email as part of our{" "}
        <span className="font-semibold text-slate-900">{category}</span> emails. Choose what you want to change.
      </p>

      <div className="space-y-2.5">
        <Action
          title={`Unsubscribe from ${category} emails`}
          desc={
            category === "transactional"
              ? "You will stop receiving receipts and payment confirmations."
              : "You will stop receiving product updates and tips."
          }
          onClick={() => submit(category, false)}
          loading={loading === category}
          disabled={loading !== null}
          variant="primary"
        />

        <Action
          title="Unsubscribe from all emails"
          desc="Stop all transactional and marketing emails from Mozosubz."
          onClick={() => submit("all", false)}
          loading={loading === "all"}
          disabled={loading !== null}
          variant="secondary"
        />
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-2">Changed your mind?</p>
        <button
          onClick={() => submit("all", true)}
          disabled={loading !== null}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {loading === "all" ? "Working…" : "Resubscribe to everything"}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

function Action({
  title,
  desc,
  onClick,
  loading,
  disabled,
  variant,
}: {
  title: string
  desc: string
  onClick: () => void
  loading: boolean
  disabled: boolean
  variant: "primary" | "secondary"
}) {
  const base =
    "w-full text-left rounded-xl border px-4 py-3.5 transition flex items-start gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
  const styles =
    variant === "primary"
      ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-600 mt-0.5 leading-snug">{desc}</p>
      </div>
      {loading && <Loader2 className="w-4 h-4 text-slate-500 animate-spin flex-shrink-0 mt-0.5" />}
    </button>
  )
}
