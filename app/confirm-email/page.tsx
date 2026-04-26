"use client"

import { useEffect, useState } from "react"
import { Mail, Smartphone, Download, ExternalLink, CheckCircle2 } from "lucide-react"

/**
 * Email provider detector for Gmail, Outlook, Yahoo, etc.
 * Opens the email app directly if accessing from mobile
 */
function detectEmailProvider(email: string): {
  provider: string
  deepLink: string | null
  webLink: string
} {
  const domain = email.split("@")[1]?.toLowerCase() || ""

  // Check if on mobile Android/iOS
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isMobile = isAndroid || isIOS

  // Gmail detection and deep linking
  if (domain.includes("gmail")) {
    return {
      provider: "Gmail",
      deepLink: isAndroid ? "https://mail.google.com/mail/u/0/" : isMobile ? "googlegmail:///" : null,
      webLink: "https://mail.google.com/mail/u/0/",
    }
  }

  // Outlook/Hotmail
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live")) {
    return {
      provider: "Outlook",
      deepLink: isAndroid ? "ms-outlook://" : isMobile ? "ms-outlook:///" : null,
      webLink: "https://outlook.live.com",
    }
  }

  // Yahoo Mail
  if (domain.includes("yahoo")) {
    return {
      provider: "Yahoo Mail",
      deepLink: isAndroid ? "https://mail.yahoo.com" : isMobile ? "ymail:///" : null,
      webLink: "https://mail.yahoo.com",
    }
  }

  // Generic fallback
  return {
    provider: "Email",
    deepLink: null,
    webLink: "https://mail.google.com",
  }
}

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState<string>("")
  const [provider, setProvider] = useState<string>("")
  const [deepLink, setDeepLink] = useState<string | null>(null)
  const [webLink, setWebLink] = useState<string>("")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Get email from URL params or localStorage
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get("email") || localStorage.getItem("signup_email") || ""

    const isAndroid = /Android/i.test(navigator.userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const mobile = isAndroid || isIOS

    setEmail(emailParam)
    setIsMobile(mobile)

    if (emailParam) {
      const { provider: p, deepLink: dl, webLink: wl } = detectEmailProvider(emailParam)
      setProvider(p)
      setDeepLink(dl)
      setWebLink(wl)
    }
  }, [])

  const handleOpenEmail = () => {
    if (isMobile && deepLink) {
      // Try to open native app first
      window.location.href = deepLink
      
      // Fallback to web version after 2 seconds
      setTimeout(() => {
        window.location.href = webLink
      }, 2000)
    } else {
      // Desktop or no deep link available
      window.open(webLink, "_blank")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Success Icon */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Check Your Email</h1>
          <p className="text-slate-600">
            We sent a confirmation link to <span className="font-semibold text-slate-900">{email}</span>
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden p-7 mb-6">
          {/* Provider Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Confirmation Email</p>
                <p className="text-sm text-blue-700">
                  Check your {provider} inbox (and spam folder) for the verification link
                </p>
              </div>
            </div>
          </div>

          {/* Open Email Button */}
          {isMobile && deepLink ? (
            <button
              onClick={handleOpenEmail}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <Smartphone className="w-5 h-5" />
              Open {provider} App
            </button>
          ) : (
            <button
              onClick={handleOpenEmail}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <ExternalLink className="w-5 h-5" />
              Open {provider} in Browser
            </button>
          )}

          {/* Instructions */}
          <div className="space-y-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900 mb-2">What to do:</p>
            <ol className="space-y-2 ml-4 list-decimal">
              <li>Click the confirmation link in the email</li>
              <li>You'll be automatically logged in to your account</li>
              <li>Start enjoying Mozosubz!</li>
            </ol>
          </div>
        </div>

        {/* Didn't receive email */}
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-2">Didn&apos;t receive the email?</p>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">• Check your spam or junk folder</p>
            <p className="text-sm text-slate-600">• Wait a few moments and refresh</p>
            <p className="text-sm text-slate-600">• Make sure you entered the correct email</p>
          </div>
        </div>
      </div>
    </div>
  )
}
