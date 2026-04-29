"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Mail } from "lucide-react"
import { Suspense } from "react"

function RegisterSuccessInner() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Check Your Email</h1>

        {/* Message */}
        <div className="space-y-4 text-slate-600">
          <p className="text-base">We sent you a confirmation link to:</p>
          
          <div className="inline-block px-4 py-2 bg-slate-100 rounded-lg">
            <p className="text-sm font-medium text-slate-900 break-all">{email}</p>
          </div>

          <p className="text-base">
            Click the link in the email to verify your account.
          </p>

          <p className="text-sm pt-4 border-t border-slate-200">
            <span className="font-semibold">Didn&apos;t receive it?</span> Check your spam or junk folder.
          </p>
        </div>

        {/* Footer links */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Wrong email? Sign up again
          </Link>
          <div className="hidden sm:block text-slate-300">•</div>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Already have account? Sign in
          </Link>
        </div>

        {/* Back to home */}
        <div className="mt-6">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-700"
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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <RegisterSuccessInner />
    </Suspense>
  )
}
