"use client"

import { Mail } from "lucide-react"

export default function ConfirmEmailPage() {
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
          <p className="text-base">We sent you a confirmation email.</p>
          
          <p className="text-base">
            Click the link in the email to verify your account and get started.
          </p>

          <p className="text-sm pt-4 border-t border-slate-200">
            <span className="font-semibold">Didn&apos;t receive it?</span> Check your spam or junk folder.
          </p>
        </div>
      </div>
    </div>
  )
}

