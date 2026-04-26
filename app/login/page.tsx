"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { saveCurrentSessionId } from "@/lib/utils/session-check"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Get the new session and save it locally
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Save session ID to localStorage for single-device login detection
        saveCurrentSessionId(session.access_token)
      }

      // Fire-and-forget sign-in alert email. We don't await so email latency
      // never blocks the navigation to the dashboard.
      fetch("/api/email/login-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      }).catch(() => {})

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred"
      setError(message)
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="w-full max-w-sm relative z-10 mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
            <h1 className="text-xl font-bold text-white text-center mb-1">Welcome back</h1>
            <p className="text-blue-100 text-center text-xs mb-5">Sign in to your account</p>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-blue-100 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-xs font-medium outline-none focus:border-blue-400/50 focus:bg-white/20 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="text-xs font-semibold text-blue-100">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-blue-300 hover:text-blue-200">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-9 px-3 pr-10 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-xs font-medium outline-none focus:border-blue-400/50 focus:bg-white/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 disabled:opacity-50 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-400/50 text-xs text-red-200">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-blue-100">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-blue-300 hover:text-blue-200">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-blue-200 hover:text-white">
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Toaster />
    </>
  )
}
