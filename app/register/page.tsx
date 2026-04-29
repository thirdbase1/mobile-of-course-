"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useCallback, useRef, useEffect } from "react"
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Snappy: short debounce so feedback feels instant.
const DEBOUNCE_MS = 220

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RX = /^[a-z0-9_-]+$/

function RegisterFormContent() {
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>("")

  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const [emailError, setEmailError] = useState<string | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)

  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  // Debounce timers
  const debounceUsernameRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceEmailRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncePhoneRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // AbortControllers - cancel stale requests so the latest keystroke always wins.
  const usernameAbortRef = useRef<AbortController | null>(null)
  const emailAbortRef = useRef<AbortController | null>(null)
  const phoneAbortRef = useRef<AbortController | null>(null)

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      usernameAbortRef.current?.abort()
      emailAbortRef.current?.abort()
      phoneAbortRef.current?.abort()
      if (debounceUsernameRef.current) clearTimeout(debounceUsernameRef.current)
      if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current)
      if (debouncePhoneRef.current) clearTimeout(debouncePhoneRef.current)
    }
  }, [])

  // ---------------------- Username availability ----------------------
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
    if (!USERNAME_RX.test(value)) {
      setUsernameError("Lowercase, numbers, hyphens only")
      setUsernameAvailable(false)
      setCheckingUsername(false)
      return
    }

    // Cancel any in-flight check.
    usernameAbortRef.current?.abort()
    const controller = new AbortController()
    usernameAbortRef.current = controller

    setCheckingUsername(true)
    setUsernameError(null)
    try {
      const response = await fetch("/api/auth/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value.toLowerCase().trim() }),
        signal: controller.signal,
      })
      const data = await response.json()
      if (controller.signal.aborted) return
      if (data.available === true) {
        setUsernameAvailable(true)
        setUsernameError(null)
      } else {
        setUsernameAvailable(false)
        setUsernameError(data.error === "Username taken" || !data.error ? "Username taken" : data.error)
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setUsernameAvailable(false)
      setUsernameError("Could not verify username")
    } finally {
      if (!controller.signal.aborted) setCheckingUsername(false)
    }
  }, [])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    setUsername(value)
    if (debounceUsernameRef.current) clearTimeout(debounceUsernameRef.current)
    if (value.trim()) {
      setCheckingUsername(true)
      debounceUsernameRef.current = setTimeout(() => checkUsername(value), DEBOUNCE_MS)
    } else {
      usernameAbortRef.current?.abort()
      setUsernameAvailable(null)
      setUsernameError(null)
      setCheckingUsername(false)
    }
  }

  // ---------------------- Email availability ----------------------
  const checkEmail = useCallback(async (value: string) => {
    const trimmed = value.toLowerCase().trim()
    if (!trimmed) {
      setEmailAvailable(null)
      setEmailError(null)
      setCheckingEmail(false)
      return
    }
    if (!EMAIL_RX.test(trimmed)) {
      setEmailError("Invalid email format")
      setEmailAvailable(false)
      setCheckingEmail(false)
      return
    }

    emailAbortRef.current?.abort()
    const controller = new AbortController()
    emailAbortRef.current = controller

    setCheckingEmail(true)
    setEmailError(null)
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
        signal: controller.signal,
      })
      const data = await response.json()
      if (controller.signal.aborted) return
      if (data.available === true) {
        setEmailAvailable(true)
        setEmailError(null)
      } else {
        setEmailAvailable(false)
        setEmailError(data.error || "Email already registered")
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setEmailAvailable(false)
      setEmailError("Could not verify email")
    } finally {
      if (!controller.signal.aborted) setCheckingEmail(false)
    }
  }, [])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current)
    if (value.trim()) {
      setCheckingEmail(true)
      debounceEmailRef.current = setTimeout(() => checkEmail(value), DEBOUNCE_MS)
    } else {
      emailAbortRef.current?.abort()
      setEmailAvailable(null)
      setEmailError(null)
      setCheckingEmail(false)
    }
  }

  // ---------------------- Phone availability ----------------------
  const checkPhone = useCallback(async (value: string) => {
    if (!value.trim()) {
      setPhoneAvailable(null)
      setPhoneError(null)
      setCheckingPhone(false)
      return
    }
    const digitsOnly = value.replace(/\D/g, "")
    if (digitsOnly.length !== 11) {
      setPhoneError("Phone must be exactly 11 digits (e.g., 09056428348)")
      setPhoneAvailable(false)
      setCheckingPhone(false)
      return
    }

    phoneAbortRef.current?.abort()
    const controller = new AbortController()
    phoneAbortRef.current = controller

    setCheckingPhone(true)
    setPhoneError(null)
    try {
      const response = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digitsOnly }),
        signal: controller.signal,
      })
      const data = await response.json()
      if (controller.signal.aborted) return
      if (data.available === true) {
        setPhoneAvailable(true)
        setPhoneError(null)
      } else {
        setPhoneAvailable(false)
        setPhoneError(data.error || "Phone already registered")
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setPhoneAvailable(false)
      setPhoneError("Could not verify phone")
    } finally {
      if (!controller.signal.aborted) setCheckingPhone(false)
    }
  }, [])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhone(value)
    if (debouncePhoneRef.current) clearTimeout(debouncePhoneRef.current)
    if (value.trim()) {
      setCheckingPhone(true)
      debouncePhoneRef.current = setTimeout(() => checkPhone(value), DEBOUNCE_MS)
    } else {
      phoneAbortRef.current?.abort()
      setPhoneAvailable(null)
      setPhoneError(null)
      setCheckingPhone(false)
    }
  }

  // ---------------------- Submit ----------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Cheap local-only validations - no network, no spinner needed yet.
    if (!fullName.trim()) {
      setError("Full name required")
      return
    }
    if (!username.trim() || !usernameAvailable) {
      setError("Choose a valid, available username")
      return
    }
    if (!email.trim() || !emailAvailable) {
      setError("Use a valid, available email")
      return
    }
    if (!phone.trim() || !phoneAvailable) {
      setError("Use a valid, available phone number")
      return
    }
    if (password.length < 6) {
      setError("Password min 6 chars")
      return
    }

    setIsLoading(true)
    setError(null)
    setLoadingStep("Creating your account…")

    // We DO NOT re-verify email/phone here:
    //   1) The live availability checks already passed (button disabled otherwise).
    //   2) The DB has unique partial indexes on lower(email), lower(username) and
    //      phone_number — Supabase will fail fast with a duplicate error if a race
    //      did slip through, so we get the same safety with one round-trip instead
    //      of three. This is what was making "Creating..." hang on slow networks.

    // Hard timeout so the button can never silently freeze. 25s is generous for
    // mobile data; Supabase normally answers in under 2s.
    const TIMEOUT_MS = 25_000
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS),
    )

    try {
      // Lazy-load the Supabase client only when the user actually submits.
      // Removes ~50KB+ from the initial register-page bundle for a faster LCP.
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const phoneDigits = phone.replace(/\D/g, "")

      const signUpPromise = supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName.trim(),
            username: username.toLowerCase().trim(),
            phone: phoneDigits,
          },
        },
      })

      // Show a friendlier label after a few seconds so the user knows we're
      // still working and the button hasn't frozen.
      const stepTimer = setTimeout(() => setLoadingStep("Almost there…"), 3500)

      let data: Awaited<typeof signUpPromise>["data"] | null = null
      let signUpError: Awaited<typeof signUpPromise>["error"] | null = null
      try {
        const result = (await Promise.race([signUpPromise, timeoutPromise])) as Awaited<
          typeof signUpPromise
        >
        data = result.data
        signUpError = result.error
      } finally {
        clearTimeout(stepTimer)
      }

      if (signUpError) {
        const msg = signUpError.message?.toLowerCase() ?? ""
        if (msg.includes("registered") || msg.includes("already") || msg.includes("duplicate")) {
          setError("Email already registered")
        } else {
          setError(signUpError.message || "Signup failed")
        }
        setIsLoading(false)
        setLoadingStep("")
        return
      }

      // CRITICAL: When Supabase has email-enumeration protection on (the default),
      // signing up with an existing email returns NO error but the new "user" has
      // an empty `identities` array. Treat that as "email already registered".
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setEmailAvailable(false)
        setEmailError("Email already registered")
        setError("Email already registered")
        setIsLoading(false)
        setLoadingStep("")
        return
      }

      // Fire-and-forget welcome email — never block the redirect on this.
      fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), fullName: fullName.trim() }),
      }).catch(() => {})

      router.push(`/register-success?email=${encodeURIComponent(email.trim())}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred"
      const display =
        message === "TIMEOUT"
          ? "The network is slow. Please check your connection and try again."
          : message
      setError(display)
      toast({
        title: "Registration failed",
        description: display,
        variant: "destructive",
      })
      setIsLoading(false)
      setLoadingStep("")
    }
  }

  const submitDisabled =
    isLoading ||
    !usernameAvailable ||
    !emailAvailable ||
    !phoneAvailable ||
    checkingUsername ||
    checkingEmail ||
    checkingPhone

  return (
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
          autoComplete="name"
          className="w-full h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-xs font-medium outline-none focus:border-blue-400/50 focus:bg-white/20 transition-all"
        />
      </div>

      <div>
        <label
          htmlFor="username"
          className="block text-xs font-semibold text-blue-100 mb-1 flex items-center justify-between"
        >
          <span>
            Username <span className="text-red-300">*</span>
          </span>
          {username && checkingUsername && <span className="text-xs text-blue-300">Checking...</span>}
          {username && !checkingUsername && usernameAvailable && (
            <span className="text-xs text-green-300">Available!</span>
          )}
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
            autoComplete="username"
            inputMode="text"
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
            {!checkingUsername && usernameAvailable === false && username && (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
        {usernameError && <p className="text-xs text-red-300 mt-0.5">{usernameError}</p>}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold text-blue-100 mb-1 flex items-center justify-between"
        >
          <span>Email</span>
          {email && checkingEmail && <span className="text-xs text-blue-300">Checking...</span>}
          {email && !checkingEmail && emailAvailable && (
            <span className="text-xs text-green-300">Available!</span>
          )}
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={handleEmailChange}
            disabled={isLoading}
            autoComplete="email"
            inputMode="email"
            className={`w-full h-9 px-3 pr-9 rounded-lg bg-white/10 border text-white placeholder:text-white/50 text-xs font-medium outline-none transition-all disabled:opacity-50 ${
              email
                ? emailAvailable
                  ? "border-green-400/50 focus:border-green-400 focus:bg-green-500/10"
                  : "border-red-400/50 focus:border-red-400 focus:bg-red-500/10"
                : "border-white/20 focus:border-blue-400/50 focus:bg-white/20"
            }`}
          />
          <div className="absolute right-2.5 top-2.5">
            {checkingEmail && <Loader2 className="w-4 h-4 text-blue-300 animate-spin" />}
            {!checkingEmail && emailAvailable && <CheckCircle className="w-4 h-4 text-green-400" />}
            {!checkingEmail && emailAvailable === false && email && (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
        {emailError && <p className="text-xs text-red-300 mt-0.5">{emailError}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-xs font-semibold text-blue-100 mb-1">
          Phone Number <span className="text-red-300">*</span>
        </label>
        <div className="relative">
          <input
            id="phone"
            type="tel"
            placeholder="09056428348"
            required
            value={phone}
            onChange={handlePhoneChange}
            disabled={isLoading}
            autoComplete="tel"
            inputMode="numeric"
            maxLength={15}
            className="w-full h-9 px-3 pr-10 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-xs font-medium outline-none focus:border-blue-400/50 focus:bg-white/20 transition-all disabled:opacity-50"
          />
          {checkingPhone && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-blue-300" />
          )}
          {!checkingPhone && phoneAvailable === true && phone.trim() && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-400" />
          )}
          {!checkingPhone && phoneAvailable === false && phone.trim() && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400" />
          )}
        </div>
        {phoneError && <p className="text-xs text-red-300 mt-0.5">{phoneError}</p>}
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
            autoComplete="new-password"
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
        disabled={submitDisabled}
        className="w-full h-9 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 mt-4"
      >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{loadingStep || "Creating…"}</span>
                  </>
                ) : (
                  "Create Account"
        )}
      </button>

      <p className="mt-4 text-center text-xs text-blue-100">
        Have an account?{" "}
        <Link href="/login" className="font-semibold text-blue-300 hover:text-blue-200">
          Sign in
        </Link>
      </p>
    </form>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
    </div>
  )
}
