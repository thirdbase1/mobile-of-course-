"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-sm relative z-10 mx-auto">
        {!success ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
            <h1 className="text-xl font-bold text-white text-center mb-1">Reset your password</h1>
            <p className="text-blue-100 text-center text-xs mb-5">Enter your email and we&apos;ll send you a reset link.</p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-blue-100 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-xs font-medium outline-none focus:border-blue-400/50 focus:bg-white/20 transition-all disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-200">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "Sending..." : "Send reset link"}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-blue-200">
                  Remember your password?{" "}
                  <Link href="/login" className="text-blue-300 hover:text-blue-200 font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-blue-100 text-xs mb-6">
              We sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
            </p>

            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
