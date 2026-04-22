import Link from "next/link"
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe"
import { UnsubscribeForm } from "./unsubscribe-form"

export const metadata = {
  title: "Email preferences · Mozosubz",
  description: "Manage which emails you receive from Mozosubz.",
}

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams
  const verified = token ? verifyUnsubscribeToken(token) : null

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="Mozosubz" className="w-9 h-9 rounded-lg" />
            <span className="text-xl font-bold text-slate-900">Mozosubz</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {!verified ? (
            <InvalidLink />
          ) : (
            <UnsubscribeForm token={token!} category={verified.category} />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Mozosubz. All rights reserved.
        </p>
      </div>
    </div>
  )
}

function InvalidLink() {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-lg font-bold text-slate-900 mb-2">Invalid or expired link</h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        This unsubscribe link is no longer valid. If you want to change your email preferences,
        open the latest email from Mozosubz and tap the unsubscribe link there.
      </p>
      <Link
        href="/"
        className="inline-block mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        Back to home
      </Link>
    </div>
  )
}
