'use client'

import { useState, useEffect } from 'react'
import { getDepositRules } from '@/lib/actions/deposit-rules'
import { calculateDepositFee, type DepositRules } from '@/lib/utils/deposit-fee'

export default function DepositPage() {
  const [amount, setAmount] = useState('')
  const [rules, setRules] = useState<DepositRules | null>(null)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  const MIN = 100
  const MAX = 100000

  // Load deposit rules on mount. We DON'T gate the page on this — the form
  // renders instantly and the "you will receive" line shows a tiny dash
  // until rules arrive (usually <300ms). This avoids the "page stuck on
  // skeleton" issue when the network is slow.
  useEffect(() => {
    let cancelled = false

    const loadRules = async () => {
      try {
        const data = await getDepositRules()
        if (!cancelled && data) setRules(data)
      } catch (err) {
        console.error('[v0] Failed to load deposit rules:', err)
      }
    }

    loadRules()

    // Periodically refresh to pick up admin changes (real-time updates).
    const interval = setInterval(loadRules, 10_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const numAmount = amount ? parseFloat(amount) : 0
  const calculation = rules && numAmount > 0 ? calculateDepositFee(numAmount, rules) : null

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString())
    setError('')
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    setError('')

    if (!value) return

    const num = parseFloat(value)
    if (num < MIN) {
      setError(`Minimum deposit is ₦${MIN.toLocaleString()}`)
    } else if (num > MAX) {
      setError(`Maximum deposit is ₦${MAX.toLocaleString()}`)
    }
  }

  const handleContinue = async () => {
    if (!calculation || calculation.depositAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/deposit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: calculation.depositAmount,
          processingFee: calculation.processingFee,
          netAmount: calculation.netAmount,
          description: 'Wallet deposit',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Deposit failed')
      }

      const data = await response.json()
      window.location.href = data.checkoutUrl || data.paymentUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process deposit')
      setProcessing(false)
    }
  }

  const quickAmounts = [500, 1000, 2000, 5000]
  const rulesLoaded = !!rules
  const showReceiveBox = numAmount > 0 && !error

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-gray-200 rounded-2xl p-6 shadow-sm">

        {/* Header */}
        <h1 className="text-xl font-semibold mb-1">Add Funds</h1>
        <p className="text-sm text-gray-500 mb-6">Fund your wallet securely</p>

        {/* Amount Input */}
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-900">Enter Amount</label>
          <input
            type="number"
            placeholder="₦1000"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            disabled={processing}
            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black/10 disabled:bg-gray-50"
          />
        </div>

        {/* Quick Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => handleQuickAmount(quickAmount)}
              disabled={processing}
              className={`rounded-xl py-2 text-sm font-medium transition-all ${
                amount === quickAmount.toString()
                  ? 'bg-black text-white'
                  : 'border border-gray-200 text-gray-900 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              {quickAmount >= 1000 ? `₦${quickAmount / 1000}k` : `₦${quickAmount}`}
            </button>
          ))}
        </div>

        {/* Min / Max Info */}
        <p className="text-xs text-gray-400 mb-4">
          Minimum: ₦{MIN.toLocaleString()} • Maximum: ₦{MAX.toLocaleString()}
        </p>

        {/* You Will Receive — only when an amount is typed and there's no error.
            If rules haven't loaded yet, show a thin inline indicator instead of
            blocking the entire page. */}
        {showReceiveBox && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-600">
              You will receive{' '}
              {calculation ? (
                <span className="font-semibold text-black">
                  ₦{calculation.netAmount.toLocaleString()}
                </span>
              ) : (
                <span className="inline-block align-middle h-4 w-20 bg-gray-200 rounded animate-pulse" />
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">Final amount after processing</p>
          </div>
        )}

        {/* Error Message */}
        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={
            !rulesLoaded ||
            !calculation ||
            calculation.depositAmount <= 0 ||
            processing ||
            !!error
          }
          className="w-full bg-black text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : !rulesLoaded ? 'Loading...' : 'Continue'}
        </button>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Secure payments powered by Monnify
        </p>
      </div>
    </div>
  )
}
