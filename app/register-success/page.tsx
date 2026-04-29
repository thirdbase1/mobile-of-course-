"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Mail, CheckCircle2, ArrowRight } from "lucide-react"
import { Suspense } from "react"

function RegisterSuccessInner() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs - identical to /login and /register */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-sm relative z-10 mx-auto">
        {/* Frosted-glass card matching the rest of the auth flow */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/40 flex items-center justify-center">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-xl font-bold text-white text-center mb-1">Check Your Email</h1>
          <p className="text-blue-100 text-center text-xs mb-5">
            We sent a confirmation link to verify your account
          </p>

          {/* Email pill */}
          {email && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-center">
              <p className="text-xs font-medium text-white break-all">{email}</p>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-2 mb-5">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-blue-200">1</span>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                Open the email from <span className="font-semibold text-white">Mozosubz</span>
              </p>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-blue-200">2</span>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                Tap the confirmation link to activate your account
              </p>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-blue-200">3</span>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                You&apos;ll be signed in automatically
              </p>
            </div>
          </div>

          {/* Spam-folder hint */}
          <div className="mb-5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/30">
            <p className="text-[11px] text-amber-100/90 leading-relaxed">
              <span className="font-semibold">Didn&apos;t get it?</span> Check your spam or
              promotions folder.
            </p>
          </div>

          {/* CTAs */}
          <Link
            href="/login"
            className="w-full h-9 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-1.5"
          >
            Already confirmed? Sign In
            <ArrowRight className="w-3 h-3" />
          </Link>

          <p className="mt-4 text-center text-xs text-blue-100">
            Wrong email?{" "}
            <Link href="/register" className="font-semibold text-blue-300 hover:text-blue-200">
              Sign up again
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
  )
}

export default function RegisterSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
          <div className="text-blue-200 text-sm">Loading…</div>
        </div>
      }
    >
      <RegisterSuccessInner />
    </Suspense>
  )
}
