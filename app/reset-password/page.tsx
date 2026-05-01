import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"
import { ResetPasswordClient } from "@/components/reset-password-client"

function ResetPasswordLoading() {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
      <div className="px-7 py-12 text-center">
        <div className="w-8 h-8 bg-slate-200 rounded-full mx-auto mb-4 animate-pulse" />
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={<ResetPasswordLoading />}>
            <ResetPasswordClient />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
