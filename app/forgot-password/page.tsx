"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2, ShieldCheck, KeyRound } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
        : `${window.location.origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 flex flex-col">
      {/* Top navigation */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/icon.svg" alt="Mozosubz" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-slate-900 text-lg">Mozosubz</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {!success ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
              {/* Header */}
              <div className="px-7 pt-8 pb-6 text-center border-b border-slate-100">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <KeyRound className="w-7 h-7 text-white" strokeWidth={2.25} />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Forgot your password?</h1>
                <p className="text-sm text-slate-600 text-pretty">
                  No worries. Enter your email and we&apos;ll send you a secure reset link.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleResetPassword} className="p-7 space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800 leading-snug">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-500/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>

                <div className="text-center pt-1">
                  <p className="text-xs text-slate-500">
                    Remember your password?{" "}
                    <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>

              {/* Security footer */}
              <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5" />
                Your data is encrypted and secure
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              {/* Success state */}
              <div className="px-7 pt-8 pb-6 text-center">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
                <p className="text-sm text-slate-600 mb-1 text-pretty">
                  We sent a password reset link to
                </p>
                <p className="text-sm font-semibold text-slate-900 mb-6 break-all">{email}</p>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-6">
                  <p className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">What&apos;s next?</p>
                  <ul className="space-y-2 text-sm text-blue-900/80">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                        1
                      </span>
                      <span>Open your inbox and find the email from Mozosubz</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                        2
                      </span>
                      <span>Click the secure link to set a new password</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                        3
                      </span>
                      <span>Sign in with your new password</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-500/25"
                  >
                    Back to login
                  </Link>
                  <button
                    onClick={() => {
                      setSuccess(false)
                      setEmail("")
                    }}
                    className="w-full h-11 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    Didn&apos;t get the email? Try again
                  </button>
                </div>
              </div>

              <div className="px-7 py-3 bg-amber-50 border-t border-amber-100 flex items-center justify-center gap-1.5">
                <p className="text-[11px] text-amber-900 text-center">
                  Check your spam folder if you don&apos;t see it within 2 minutes
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 text-center">
        <p className="text-xs text-slate-500">
          Need help?{" "}
          <Link href="/support" className="text-blue-600 hover:text-blue-700 font-medium">
            Contact support
          </Link>
        </p>
      </footer>
    </div>
  )
}
