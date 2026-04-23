"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {!success ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
            {/* Header */}
            <div className="px-7 pt-8 pb-6 text-center border-b border-slate-100">
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Mail className="w-7 h-7 text-white" strokeWidth={2.25} />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Reset your password</h1>
              <p className="text-sm text-slate-600">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleResetPassword} className="p-7 space-y-5">
              <div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all disabled:opacity-60"
                />
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
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
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-sm text-slate-600">
                  Remember your password?{" "}
                  <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-7 pt-8 pb-6 text-center">
              <div className="relative inline-flex items-center justify-center mb-5">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
              <p className="text-sm text-slate-600 mb-6">
                We sent a reset link to <strong>{email}</strong>
              </p>

              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
              >
                Back to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
