"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Mail } from "lucide-react"
import { Suspense } from "react"

function RegisterSuccessInner() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs - same as register page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/50 mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>

        {/* Message */}
        <div className="space-y-4 text-blue-100 mb-8">
          <p className="text-sm">We sent a confirmation link to:</p>
          
          <div className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-lg">
            <p className="text-sm font-medium text-white break-all">{email}</p>
          </div>

          <p className="text-sm">
            Click the link in the email to verify your account.
          </p>

          <p className="text-xs pt-4 border-t border-white/20">
            <span className="font-semibold">Didn&apos;t receive it?</span> Check your spam or junk folder.
          </p>
        </div>

        {/* Footer links */}
        <div className="space-y-3 pt-6 border-t border-white/20">
          <Link
            href="/register"
            className="block text-sm text-blue-300 hover:text-blue-200 font-medium transition-colors"
          >
            Wrong email? Sign up again
          </Link>
          <Link
            href="/login"
            className="block text-sm text-blue-300 hover:text-blue-200 font-medium transition-colors"
          >
            Already have account? Sign in →
          </Link>
        </div>

        {/* Back to home */}
        <div className="mt-6">
          <Link
            href="/"
            className="text-xs text-blue-200/60 hover:text-blue-200 transition-colors"
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
          <div className="text-blue-200">Loading...</div>
        </div>
      }
    >
      <RegisterSuccessInner />
    </Suspense>
  )
}
