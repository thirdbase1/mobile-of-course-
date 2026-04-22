'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Copy, Check, Clock, Copy as CopyIcon } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const amount = searchParams?.get('amount') || '0'
  const paymentRef = searchParams?.get('paymentRef') || ''

  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [ussdCode, setUssdCode] = useState('')
  const [accountName, setAccountName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    // First initialize transaction to get valid transactionReference from Monnify
    // Then use that to initialize payment
    const initPayment = async () => {
      try {
        // Step 1: Call initTransaction to get valid transaction reference from Monnify
        // userId will be fetched server-side from the authenticated session
        const initTxResponse = await fetch('/api/monnify/init-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(amount),
            description: `Deposit - ${paymentRef}`,
            paymentReference: paymentRef,
          }),
        })

        const initTxData = await initTxResponse.json()

        if (!initTxResponse.ok) {
          setError(initTxData.error || 'Failed to initialize transaction')
          setLoading(false)
          return
        }

        const monnifyTransactionRef = initTxData.transactionReference

        // Step 2: Use the Monnify transactionReference to initialize payment
        const initPayResponse = await fetch('/api/monnify/init-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionReference: monnifyTransactionRef,
            amount: parseFloat(amount),
          }),
        })

        const initPayData = await initPayResponse.json()

        if (!initPayResponse.ok) {
          setError(initPayData.error || 'Failed to initialize payment')
          setLoading(false)
          return
        }

        setAccountNumber(initPayData.accountNumber)
        setBankName(initPayData.bankName)
        setUssdCode(initPayData.ussdCode)
        setAccountName(initPayData.accountName)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setLoading(false)
      }
    }

    if (paymentRef && amount) {
      initPayment()
    }
  }, [paymentRef, amount])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isExpired = timeLeft <= 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#e2e8f0] border-t-[#1a56db] animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Generating payment details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md border border-[#e2e8f0]">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 bg-[#1a56db] text-white rounded-lg hover:bg-[#1e40af] transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Timer Banner */}
      {!isExpired && (
        <div className={`${timeLeft < 60 ? 'bg-red-50 border-red-200' : 'bg-[#eff6ff] border-[#bfdbfe]'} border-b`}>
          <div className="w-full px-4 md:px-6 lg:px-8 py-3 flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`} />
            <p className={`text-sm font-semibold ${timeLeft < 60 ? 'text-red-600' : 'text-[#1e40af]'}`}>
              Payment expires in {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="w-full px-4 md:px-6 lg:px-8 py-3">
            <p className="text-sm font-semibold text-red-600">Payment link expired. Please initiate a new deposit.</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 max-w-4xl md:mx-auto">
        {/* Amount Summary */}
        <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] mb-6">
          <p className="text-sm text-[#64748b] mb-2">Amount to Deposit</p>
          <p className="text-4xl font-bold text-[#1a56db]">₦{parseFloat(amount).toLocaleString()}</p>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] mb-6">
          <h2 className="text-lg font-bold text-[#1e293b] mb-4">Payment Details</h2>

          {/* Account Number */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#64748b] mb-2">Account Number</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={accountNumber}
                readOnly
                className="flex-1 px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm font-mono font-bold text-[#1e293b]"
              />
              <button
                onClick={() => copyToClipboard(accountNumber, 'account')}
                className="p-3 hover:bg-[#f1f5f9] rounded-lg transition-colors"
              >
                {copiedField === 'account' ? (
                  <Check className="w-5 h-5 text-[#10b981]" />
                ) : (
                  <CopyIcon className="w-5 h-5 text-[#64748b]" />
                )}
              </button>
            </div>
          </div>

          {/* Bank Name */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#64748b] mb-2">Bank Name</label>
            <div className="px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#1e293b]">
              {bankName}
            </div>
          </div>

          {/* Account Name */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#64748b] mb-2">Account Name</label>
            <div className="px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#1e293b]">
              {accountName}
            </div>
          </div>

          {/* USSD Code */}
          {ussdCode && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#64748b] mb-2">USSD Code (for Mobile)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ussdCode}
                  readOnly
                  className="flex-1 px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm font-mono font-bold text-[#1a56db]"
                />
                <button
                  onClick={() => copyToClipboard(ussdCode, 'ussd')}
                  className="p-3 hover:bg-[#f1f5f9] rounded-lg transition-colors"
                >
                  {copiedField === 'ussd' ? (
                    <Check className="w-5 h-5 text-[#10b981]" />
                  ) : (
                    <CopyIcon className="w-5 h-5 text-[#64748b]" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-[#1e40af] mb-2">How to Pay:</h3>
          <ol className="text-xs text-[#1e40af] space-y-2">
            <li>1. Transfer ₦{parseFloat(amount).toLocaleString()} to the account above</li>
            <li>2. Use the account number or USSD code</li>
            <li>3. Funds appear instantly after payment</li>
          </ol>
        </div>

        {/* Back Button */}
        <Link
          href="/dashboard"
          className="block w-full py-3 px-4 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] font-semibold rounded-xl transition-colors text-center"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
