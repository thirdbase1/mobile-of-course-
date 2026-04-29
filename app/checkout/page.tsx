"use client"

import { Copy, CheckCircle } from "lucide-react"
import { useState } from "react"

export default function CheckoutPage() {
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText("874 3561 460")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="w-full bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <h1 className="text-base font-bold text-white">Checkout</h1>
        </div>
        <p className="text-xs text-slate-400">checkout.mozosubz.com</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Title */}
          <h2 className="text-3xl font-bold text-white text-center mb-6">Pay with bank transfer</h2>

          {/* Amount */}
          <div className="text-center mb-8">
            <p className="text-5xl font-bold text-blue-500">₦1,350.00</p>
          </div>

          {/* Transfer Details Box */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6 space-y-6">
            {/* Header Text */}
            <p className="text-slate-300 text-center">Please transfer to the following account</p>

            {/* Bank Info */}
            <div className="space-y-4">
              {/* Bank Name */}
              <div>
                <p className="text-xs text-slate-400 mb-1">Bank Name:</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <p className="text-sm font-semibold text-white">PalmPay</p>
                </div>
              </div>

              {/* Account Number */}
              <div>
                <p className="text-xs text-slate-400 mb-1">Account Number (Only for this transaction)</p>
                <div className="flex items-center justify-between gap-3 bg-slate-900/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-blue-500 font-mono">874 3561 460</p>
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 border border-blue-500 text-blue-400 rounded-full text-xs font-medium hover:bg-blue-500/10 transition-all flex items-center gap-1.5"
                  >
                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <div>
                <p className="text-xs text-slate-400 mb-1">Account Name:</p>
                <p className="text-sm font-medium text-white">Life AI</p>
              </div>
            </div>

            {/* Expires Timer */}
            <div className="text-center pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-300">
                Order Expires in <span className="text-orange-400 font-semibold">29:22</span>
              </p>
            </div>
          </div>

          {/* Loading Button */}
          <button
            disabled
            className="w-full h-12 bg-blue-600 text-white rounded-full font-semibold text-sm hover:bg-blue-700 disabled:bg-blue-600 transition-all flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            {isLoading ? "Verifying Payment..." : "Payment Confirmed"}
          </button>

          {/* Footer Info */}
          <p className="text-center text-xs text-slate-500 mt-4">
            Your payment is being verified. Do not close this page.
          </p>
        </div>
      </div>
    </div>
  )
}
