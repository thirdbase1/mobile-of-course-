"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

function RegisterFormContent() {
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const checkUsername = useCallback(async (value: string) => {
    if (!value.trim()) {
      setUsernameAvailable(null)
      setUsernameError(null)
      setCheckingUsername(false)
      return
    }

    if (value.length < 3) {
      setUsernameError("At least 3 characters")
      setUsernameAvailable(false)
      setCheckingUsername(false)
      return
    }

    if (value.includes(" ")) {
      setUsernameError("No spaces allowed")
      setUsernameAvailable(false)
      setCheckingUsername(false)
      return
    }

    if (!/^[a-z0-9_-]+$/.test(value)) {
      setUsernameError("Lowercase, numbers, hyphens only")
      setUsernameAvailable(false)
      setCheckingUsername(false)
      return
    }

    setCheckingUsername(true)
    setUsernameError(null)

    try {
      const response = await fetch("/api/auth/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value.toLowerCase().trim() }),
      })

      const data = await response.json()
      if (data.available) {
        setUsernameAvailable(true)
        setUsernameError(null)
      } else {
        setUsernameAvailable(false)
        setUsernameError("Username taken")
      }
    } catch (error) {
      console.error("Error checking username:", error)
      setUsernameAvailable(null)
    } finally {
      setCheckingUsername(false)
    }
  }, [])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    setUsername(value)
    
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    if (value.trim()) {
      setCheckingUsername(true)
      debounceTimerRef.current = setTimeout(() => {
        checkUsername(value)
      }, 400)
    } else {
      setUsernameAvailable(null)
      setUsernameError(null)
      setCheckingUsername(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!fullName.trim()) {
      setError("Full name required")
      setIsLoading(false)
      return
    }

    if (!username.trim() || !usernameAvailable) {
      setError("Choose valid username")
      setIsLoading(false)
      return
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Valid email required")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password min 6 chars")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName.trim(),
            username: username.toLowerCase().trim(),
            phone: phone.trim(),
          },
        },
      })
      if (error) {
        setError(error.message.includes("registered") ? "Email already used" : error.message || "Signup failed")
        setIsLoading(false)
        return
      }

      // Fire-and-forget branded welcome email. We don't await so slow email
      // delivery never blocks navigation to the success screen.
      fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), fullName: fullName.trim() }),
      }).catch(() => {})

      router.push(`/register-success?email=${encodeURIComponent(email.trim())}`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred"
      setError(message)
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleRegister} className="space-y-3">
        <div>
          <label htmlFor="fullname" className="block text-xs font-semibold text-blue-100 mb-1">
            Full Name
          </label>
          <input
            id="fullname"
            type="text"
            placeholder="John Doe"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            className="w-full h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-xs font-medium outline-none focus:border-blue-400/50 focus:bg-white/20 transition-all"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-xs font-semibold text-blue-100 mb-1 flex items-center justify-between">
            <span>Username <span className="text-red-300">*</span></span>
            {username && checkingUsername && <span className="text-xs text-blue-300">Checking...</span>}
            {username && !checkingUsername && usernameAvailable && <span className="text-xs text-green-300">Available!</span>}
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              placeholder="johndoe"
              required
              value={username}
              onChange={handleUsernameChange}
              disabled={isLoading}
              className={`w-full h-9 px-3 pr-9 rounded-lg bg-white/10 border text-white placeholder:text-white/50 text-xs font-medium outline-none transition-all ${
                username
                  ? usernameAvailable
                    ? "border-green-400/50 focus:border-green-400 focus:bg-green-500/10"
                    : "border-red-400/50 focus:border-red-400 focus:bg-red-500/10"
                  : "border-white/20 focus:border-blue-400/50 focus:bg-white/20"
              }`}
            />
            <div className="absolute right-2.5 top-2.5">
              {checkingUsername && <Loader2 className="w-4 h-4 text-blue-300 animate-spin" />}
              {!checkingUsername && usernameAvailable && <CheckCircle className="w-4 h-4 text-green-400" />}
              {!checkingUsername && usernameAvailable === false && username && <AlertCircle className="w-4 h-4 text-red-400" />}
            </div>
          </div>
          {usernameError && <p className="text-xs text-red-300 mt-0.5">{usernameError}</p>}
        </div>

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
          <label htmlFor="phone" className="block text-xs font-semibold text-blue-100 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+234 800 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
            className="w-full h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-xs font-medium outline-none focus:border-blue-400/50 focus:bg-white/20 transition-all"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-blue-100 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 6 chars"
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
          <div className="p-2 rounded-lg bg-red-500/20 border border-red-400/50 text-xs text-red-200 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !usernameAvailable}
          className="w-full h-9 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-blue-100">
        Have an account?{" "}
        <Link href="/login" className="font-semibold text-blue-300 hover:text-blue-200">
          Sign in
        </Link>
      </p>
    </>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-sm relative z-10 mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5 shadow-2xl">
          <h1 className="text-lg font-bold text-white text-center mb-1">Create account</h1>
          <p className="text-blue-100 text-center text-xs mb-5">Get started in seconds</p>

          <RegisterFormContent />
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-blue-200 hover:text-white">
            Back to Home
          </Link>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
