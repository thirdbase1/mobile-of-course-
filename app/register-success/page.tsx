"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  MailCheck,
  ExternalLink,
  RotateCw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Inbox,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const PROVIDERS: Record<
  string,
  { name: string; url: string; short: string; accent: string }
> = {
  "gmail.com": {
    name: "Open Gmail",
    url: "https://mail.google.com/mail/u/0/#inbox",
    short: "Gmail",
    accent: "from-red-500 to-rose-500",
  },
  "googlemail.com": {
    name: "Open Gmail",
    url: "https://mail.google.com/mail/u/0/#inbox",
    short: "Gmail",
    accent: "from-red-500 to-rose-500",
  },
  "yahoo.com": {
    name: "Open Yahoo Mail",
    url: "https://mail.yahoo.com/",
    short: "Yahoo Mail",
    accent: "from-purple-500 to-fuchsia-500",
  },
  "ymail.com": {
    name: "Open Yahoo Mail",
    url: "https://mail.yahoo.com/",
    short: "Yahoo Mail",
    accent: "from-purple-500 to-fuchsia-500",
  },
  "outlook.com": {
    name: "Open Outlook",
    url: "https://outlook.live.com/mail/0/inbox",
    short: "Outlook",
    accent: "from-sky-500 to-blue-500",
  },
  "hotmail.com": {
    name: "Open Outlook",
    url: "https://outlook.live.com/mail/0/inbox",
    short: "Outlook",
    accent: "from-sky-500 to-blue-500",
  },
  "live.com": {
    name: "Open Outlook",
    url: "https://outlook.live.com/mail/0/inbox",
    short: "Outlook",
    accent: "from-sky-500 to-blue-500",
  },
  "icloud.com": {
    name: "Open iCloud Mail",
    url: "https://www.icloud.com/mail/",
    short: "iCloud Mail",
    accent: "from-slate-400 to-slate-600",
  },
  "proton.me": {
    name: "Open Proton Mail",
    url: "https://mail.proton.me/",
    short: "Proton",
    accent: "from-violet-500 to-purple-500",
  },
  "protonmail.com": {
    name: "Open Proton Mail",
    url: "https://mail.proton.me/",
    short: "Proton",
    accent: "from-violet-500 to-purple-500",
  },
}

function RegisterSuccessInner() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [cooldown, setCooldown] = useState(0)
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  )
  const [resendMessage, setResendMessage] = useState<string>("")

  // Detect the email provider from the domain
  const provider = useMemo(() => {
    if (!email) return null
    const domain = email.split("@")[1]?.toLowerCase()
    return domain ? PROVIDERS[domain] ?? null : null
  }, [email])

  // Cooldown timer after resend
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const handleResend = async () => {
    if (!email || resendState === "loading" || cooldown > 0) return
    setResendState("loading")
    setResendMessage("")

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })
      if (error) {
        setResendState("error")
        setResendMessage(error.message || "Failed to resend. Please try again.")
        return
      }
      setResendState("sent")
      setResendMessage("Confirmation email sent. Check your inbox.")
      setCooldown(60)
    } catch {
      setResendState("error")
      setResendMessage("Network error. Please try again.")
    }
  }

  // Mask email for display: john.doe@gmail.com -> j*****e@gmail.com
  const displayEmail = email || ""

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs (matches register page) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md relative z-10 mx-auto">
        {/* Main card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Animated envelope header */}
          <div className="relative px-6 pt-8 pb-6 text-center">
            {/* Pulsing glow */}
            <div className="absolute left-1/2 top-8 -translate-x-1/2 w-24 h-24 rounded-full bg-blue-400/30 blur-2xl animate-pulse" />

            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <MailCheck className="w-10 h-10 text-white" strokeWidth={2.25} />
              </div>
              {/* Small floating checkmark */}
              <div className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-green-500 border-2 border-slate-900 flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>

            <h1 className="mt-5 text-2xl font-bold text-white text-balance">
              Verify your email to continue
            </h1>
            <p className="mt-2 text-sm text-blue-100/90 text-pretty">
              We sent a confirmation link to
            </p>
            {displayEmail && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                <Inbox className="w-3.5 h-3.5 text-blue-200" />
                <span className="text-sm font-semibold text-white break-all">
                  {displayEmail}
                </span>
              </div>
            )}
          </div>

          {/* Provider-specific open mail button */}
          {provider ? (
            <div className="px-6 pb-4">
              <a
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full h-12 rounded-xl bg-gradient-to-r ${provider.accent} text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all`}
              >
                <ExternalLink className="w-4 h-4" />
                {provider.name}
              </a>
              <p className="mt-2 text-center text-[11px] text-blue-200/70">
                Opens {provider.short} in a new tab
              </p>
            </div>
          ) : (
            // Generic fallback: three popular providers
            <div className="px-6 pb-4">
              <p className="text-[11px] font-semibold text-blue-100/80 uppercase tracking-wider text-center mb-2">
                Open your inbox
              </p>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href="https://mail.google.com/mail/u/0/#inbox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  Gmail
                </a>
                <a
                  href="https://mail.yahoo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  Yahoo
                </a>
                <a
                  href="https://outlook.live.com/mail/0/inbox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  Outlook
                </a>
              </div>
            </div>
          )}

          {/* Resend section */}
          <div className="mx-6 mb-4 rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  The link expires in 1 hour. Check your{" "}
                  <span className="font-semibold text-white">spam or promotions</span>{" "}
                  folder if you don&apos;t see it.
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="text-xs text-blue-100/70">
                Didn&apos;t get the email?
              </span>
              <button
                onClick={handleResend}
                disabled={
                  !email || resendState === "loading" || cooldown > 0
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-blue-200 disabled:text-blue-100/40 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCw
                  className={`w-3 h-3 ${
                    resendState === "loading" ? "animate-spin" : ""
                  }`}
                />
                {resendState === "loading"
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend email"}
              </button>
            </div>

            {/* Resend feedback */}
            {resendMessage && (
              <div
                className={`mt-3 flex items-start gap-2 text-[11px] rounded-lg px-3 py-2 ${
                  resendState === "sent"
                    ? "bg-green-500/15 border border-green-400/30 text-green-200"
                    : "bg-red-500/15 border border-red-400/30 text-red-200"
                }`}
                role="status"
              >
                {resendState === "sent" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                )}
                <span>{resendMessage}</span>
              </div>
            )}
          </div>

          {/* Footer links */}
          <div className="border-t border-white/10 px-6 py-4 bg-black/20 flex items-center justify-between text-xs">
            <Link
              href="/register"
              className="text-blue-200 hover:text-white transition-colors"
            >
              Wrong email? Sign up again
            </Link>
            <Link
              href="/login"
              className="font-semibold text-white hover:text-blue-200 transition-colors"
            >
              Sign in →
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-5 text-center">
          <Link
            href="/"
            className="text-xs text-blue-200/80 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      }
    >
      <RegisterSuccessInner />
    </Suspense>
  )
}
