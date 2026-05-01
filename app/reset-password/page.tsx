"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Check,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

function checkPasswordStrength(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/forgot-password")
        return
      }

      setSessionReady(true)
    }

    checkSession()
  }, [router])

  const strength = checkPasswordStrength(password)
  const strengthScore = Object.values(strength).filter(Boolean).length
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!strength.length) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setSuccess(true)
      setTimeout(() => router.push("/login"), 2500)
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
          {!sessionReady ? (
            // Loading state while checking session
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
              <div className="px-7 py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">Verifying your recovery link...</p>
              </div>
            </div>
          ) : !success ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
              {/* Header */}
              <div className="px-7 pt-8 pb-6 text-center border-b border-slate-100">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Lock className="w-7 h-7 text-white" strokeWidth={2.25} />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Create new password</h1>
                <p className="text-sm text-slate-600 text-pretty">
                  Your new password must be different from previously used passwords.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleResetPassword} className="p-7 space-y-5">
                {/* New password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full h-12 pl-10 pr-11 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="mt-3">
                      <div className="flex gap-1.5 mb-2">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              strengthScore > i
                                ? strengthScore <= 1
                                  ? "bg-red-500"
                                  : strengthScore <= 2
                                    ? "bg-amber-500"
                                    : strengthScore <= 3
                                      ? "bg-blue-500"
                                      : "bg-emerald-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <Requirement met={strength.length} label="8+ characters" />
                        <Requirement met={strength.uppercase} label="Uppercase letter" />
                        <Requirement met={strength.number} label="Number" />
                        <Requirement met={strength.special} label="Special character" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className={`w-full h-12 pl-10 pr-11 bg-slate-50 border text-slate-900 text-sm rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? "border-emerald-300 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white"
                            : "border-red-300 focus:ring-red-500/30 focus:border-red-500 focus:bg-white"
                          : "border-slate-200 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p
                      className={`mt-2 text-[11px] font-medium flex items-center gap-1 ${
                        passwordsMatch ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {passwordsMatch ? (
                        <>
                          <Check className="w-3 h-3" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          Passwords don&apos;t match
                        </>
                      )}
                    </p>
                  )}
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
                  disabled={isLoading || !password || !confirmPassword || !passwordsMatch || !strength.length}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-500/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </button>
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
              <div className="px-7 pt-10 pb-8 text-center">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Password updated!</h1>
                <p className="text-sm text-slate-600 mb-6 text-pretty">
                  Your password has been reset successfully. Redirecting you to sign in...
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Redirecting...
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1 ${met ? "text-emerald-600" : "text-slate-400"}`}>
      {met ? <Check className="w-3 h-3 flex-shrink-0" /> : <X className="w-3 h-3 flex-shrink-0" />}
      <span className="font-medium">{label}</span>
    </div>
  )
}
