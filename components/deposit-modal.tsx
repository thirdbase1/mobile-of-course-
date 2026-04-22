"use client"

import { useState } from "react"
import { X, Copy, Check } from "lucide-react"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  accountNumber: string
  bankName: string
}

export function DepositModal({ isOpen, onClose, accountNumber, bankName }: DepositModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1e293b]">Deposit Funds</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div>
            <p className="text-xs font-semibold text-[#64748b] mb-2">Step 1: Copy Account Number</p>
            <div className="flex items-center gap-2 p-3 bg-[#f1f5f9] rounded-lg border border-[#e2e8f0]">
              <span className="flex-1 font-mono text-sm text-[#1e293b]">{accountNumber}</span>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#10b981]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#1a56db]" />
                )}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <p className="text-xs font-semibold text-[#64748b] mb-2">Step 2: Use Your Bank App</p>
            <div className="p-3 bg-[#f1f5f9] rounded-lg border border-[#e2e8f0]">
              <p className="text-sm text-[#1e293b]">
                Transfer money from any Nigerian bank to the account number above.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <p className="text-xs font-semibold text-[#64748b] mb-2">Step 3: Instant Credit</p>
            <div className="p-3 bg-[#f1f5f9] rounded-lg border border-[#e2e8f0]">
              <p className="text-sm text-[#1e293b]">
                Your wallet will be credited instantly once the payment is received.
              </p>
            </div>
          </div>

          {/* Bank Info */}
          <div className="pt-2 border-t border-[#e2e8f0]">
            <p className="text-xs text-[#64748b] mb-2">Bank Details</p>
            <p className="text-sm font-semibold text-[#1e293b]">{bankName}</p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-2 px-4 bg-[#1a56db] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}
