"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
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

export function ResetPasswordClient() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user has a valid recovery session or code
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const code = searchParams.get("code")

      // If there's a recovery code from the URL, exchange it
      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error("[v0] Recovery code exchange failed:", exchangeError.message)
            setError("Invalid or expired recovery link. Please request a new one.")
            setSessionReady(false)
            return
          }
          // Code exchanged successfully - now they have a recovery session
          console.log("[v0] Recovery code exchanged successfully")
          setSessionReady(true)
          return
        } catch (err) {
          console.error("[v0] Recovery code exchange error:", err)
          setError("Failed to verify recovery link. Please try again.")
          setSessionReady(false)
          return
        }
      }

      // If no code, check if there's already a valid session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // No code and no session - redirect to forgot password
        router.push("/forgot-password")
        return
      }

      setSessionReady(true)
    }

    checkSession()
  }, [router, searchParams])

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
    <>
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
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">{error}</p>
                </div>
              </div>
            )}

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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              <div className="mt-3 space-y-2">
                <div className="flex gap-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-colors ${
                        i < strengthScore ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-xs font-medium ${
                    strengthScore < 2
                      ? "text-red-600"
                      : strengthScore < 3
                        ? "text-amber-600"
                        : "text-green-600"
                  }`}
                >
                  {strengthScore < 2
                    ? "Weak password"
                    : strengthScore < 3
                      ? "Fair password"
                      : "Strong password"}
                </p>
              </div>

              {/* Requirements */}
              <div className="mt-3.5 space-y-1.5">
                {[
                  { label: "At least 8 characters", check: strength.length },
                  { label: "One uppercase letter", check: strength.uppercase },
                  { label: "One number", check: strength.number },
                  { label: "One special character", check: strength.special },
                ].map((req) => (
                  <div key={req.label} className="flex items-center gap-2 text-xs">
                    {req.check ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )}
                    <span className={req.check ? "text-slate-600" : "text-slate-400"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold text-slate-700 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    passwordsMatch ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !passwordsMatch || !strength.length}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none mt-7 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Reset password
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        // Success state
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="px-7 py-12 text-center">
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-green-500/10 blur-xl rounded-full" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Password reset successful</h2>
            <p className="text-slate-600 mb-6">
              Your password has been updated successfully. You will be redirected to login shortly.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting...
            </div>
          </div>
        </div>
      )}
    </>
  )
}
