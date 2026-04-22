'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Transaction {
  id: string
  paymentReference: string
  transactionReference: string | null
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'CANCELLED'
  accountNumber: string | null
  bankName: string | null
  accountName: string | null
  ussdCode: string | null
  expiresAt: string
  paidAt: string | null
}

interface CheckoutClientProps {
  paymentReference: string
  transaction: Transaction
  onCancel: (ref: string) => Promise<any>
  onVerify: (ref: string) => Promise<any>
}

export function CheckoutClient({
  paymentReference,
  transaction: initialTransaction,
  onCancel,
  onVerify,
}: CheckoutClientProps) {
  const router = useRouter()
  const [transaction, setTransaction] = useState(initialTransaction)
  const [timeLeft, setTimeLeft] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const expiresAtRef = useRef(new Date(initialTransaction.expiresAt).getTime())
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Timer countdown every 1 second
  useEffect(() => {
    if (transaction.status !== 'PENDING') return

    const timerInterval = setInterval(() => {
      const remaining = Math.max(0, expiresAtRef.current - Date.now())
      setTimeLeft(remaining)

      if (remaining <= 0) {
        setTransaction((prev) => ({ ...prev, status: 'EXPIRED' }))
      }
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [transaction.status])

  // Poll for payment every 10 seconds
  useEffect(() => {
    if (transaction.status !== 'PENDING') return

    const graceEndTime = expiresAtRef.current + 5 * 60 * 1000
    if (Date.now() > graceEndTime) return

    const poll = async () => {
      try {
        const response = await fetch(`/api/checkout/${paymentReference}/query`, {
          method: 'POST',
        })
        const data = await response.json()

        if (data.success && data.data?.status && data.data.status !== transaction.status) {
          setTransaction(data.data)
        }
      } catch (error) {
        console.error('[CHECKOUT] Polling error:', error)
      }
    }

    pollTimeoutRef.current = setTimeout(() => {
      poll()
      const pollInterval = setInterval(poll, 10000)
      pollTimeoutRef.current = pollInterval as any
    }, 2000)

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current as any)
        clearTimeout(pollTimeoutRef.current as any)
      }
    }
  }, [transaction.status, paymentReference])

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / 1000 / 60) % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimerClass = () => {
    if (timeLeft <= 120000) return 'timer-val danger'
    if (timeLeft <= 300000) return 'timer-val warn'
    return 'timer-val'
  }

  const getProgressColor = () => {
    if (timeLeft <= 120000) return '#dc2626'
    if (timeLeft <= 300000) return '#f59e0b'
    return '#2563eb'
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 3000)
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    setPendingStatus('Verifying payment...')
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setPendingStatus(data.error || 'Payment verification failed. Please try again.')
        setIsVerifying(false)
        return
      }

      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      setPendingStatus('Error verifying payment. Please try again.')
      setIsVerifying(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure? This payment will be cancelled.')) return
    setIsCancelling(true)
    try {
      const response = await fetch(`/api/checkout/${paymentReference}/cancel`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTransaction((prev) => ({ ...prev, status: 'CANCELLED' }))
      } else {
        setPendingStatus('Failed to cancel payment. Please try again.')
      }
    } catch (error) {
      console.error('[CHECKOUT] Cancel error:', error)
      setPendingStatus('Error cancelling payment. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  const progressPercent = ((initialTransaction.expiresAt ? (expiresAtRef.current - Date.now()) / (expiresAtRef.current - new Date(initialTransaction.expiresAt).getTime() + 1) * 100 : 0) * 100) / 100

  // Success state
  if (transaction.status === 'SUCCESS') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <style>{`
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .success-animation { animation: slideUp 0.4s cubic-bezier(.22,1,.36,1) both; }
        `}</style>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center success-animation">
            <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center text-4xl mx-auto mb-6">
              ✅
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Payment Successful!</h1>
            <p className="text-slate-600 mb-6 text-base">
              Your wallet has been credited with ₦{(transaction.amount - (transaction.processing_fee || 0)).toLocaleString()}.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mb-8 text-left">
              <p className="text-xs text-slate-500 font-semibold mb-2">TRANSACTION REFERENCE</p>
              <p className="text-sm font-mono font-bold text-slate-900 break-all">{transaction.transactionReference || transaction.id}</p>
            </div>
            <Link 
              href="/dashboard" 
              className="inline-block w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Expired state
  if (transaction.status === 'EXPIRED') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center text-4xl mx-auto mb-6">
              ⏱️
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Payment Expired</h1>
            <p className="text-slate-600 mb-8 text-base">
              This payment session has expired. Please start a new transaction.
            </p>
            <Link 
              href="/dashboard" 
              className="inline-block w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Cancelled state
  if (transaction.status === 'CANCELLED') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center text-4xl mx-auto mb-6">
              ❌
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Payment Cancelled</h1>
            <p className="text-slate-600 mb-8 text-base">
              You have cancelled this payment. No charges have been made.
            </p>
            <Link 
              href="/dashboard" 
              className="inline-block w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Pending state
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .card { animation: up 0.4s cubic-bezier(.22,1,.36,1) both; }
        .timer-val.warn { color: #f59e0b; }
        .timer-val.danger { color: #dc2626; animation: pulse 0.8s infinite; }
      `}</style>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden card">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-8 text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-6">
              <svg width="32" height="32" viewBox="0 0 512 512" fill="none">
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b63e8" />
                    <stop offset="100%" stopColor="#1a56db" />
                  </linearGradient>
                </defs>
                <rect width="512" height="512" rx="120" fill="url(#lg)" />
                <rect x="96" y="308" width="44" height="108" rx="14" fill="white" fillOpacity="0.35" />
                <rect x="162" y="244" width="44" height="172" rx="14" fill="white" fillOpacity="0.6" />
                <path d="M236 416L236 192L306 278L376 192L376 416" stroke="white" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <div className="text-xl font-bold">Mozosubz</div>
            </div>
            <div className="text-xs font-semibold text-blue-100 mb-2 tracking-wider">AMOUNT</div>
            <div className="text-5xl font-bold font-mono tracking-tight">
              <span className="text-3xl">₦</span>{(transaction.amount || 0).toLocaleString()}
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6">
            {/* TIMER */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Time Remaining</span>
              <div className={`text-2xl font-mono font-bold ${getTimerClass()}`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mb-6">
              <div 
                style={{
                  width: `${Math.max(0, progressPercent)}%`,
                  backgroundColor: getProgressColor(),
                  transition: 'width 1s linear, background-color 0.3s'
                }}
                className="h-full rounded-full"
              ></div>
            </div>

            {/* BANK DETAILS */}
            {transaction.accountNumber && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Bank</p>
                  <p className="text-base font-bold text-slate-900">{transaction.bankName}</p>
                </div>
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Account Number</p>
                    <p className="text-lg font-mono font-bold text-slate-900 tracking-wider">{transaction.accountNumber}</p>
                  </div>
                  <button
                    className="flex-shrink-0 px-3 py-2 bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => handleCopy(transaction.accountNumber || '', 'account')}
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      {copied === 'account' ? (
                        <polyline points="20 6 9 17 4 12" />
                      ) : (
                        <>
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </>
                      )}
                    </svg>
                    {copied === 'account' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {transaction.accountName && (
                  <div className="px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Account Name</p>
                    <p className="text-base font-bold text-slate-900">{transaction.accountName}</p>
                  </div>
                )}
              </div>
            )}

            {/* PENDING STATUS BANNER */}
            {pendingStatus && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
                <p className="text-sm font-semibold text-yellow-800">{pendingStatus}</p>
              </div>
            )}

            {/* INSTRUCTION */}
            <p className="text-xs text-slate-600 text-center mb-6 leading-relaxed bg-slate-50 p-3 rounded-lg">
              Complete payment in your bank app and click "I Have Paid"
            </p>

            {/* ACTION BUTTONS */}
            <button 
              onClick={handleVerify} 
              disabled={isVerifying}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-lg transition-colors mb-3"
            >
              {isVerifying ? 'Verifying...' : 'I Have Paid'}
            </button>
            <button 
              onClick={handleCancel} 
              disabled={isCancelling}
              className="w-full py-3 px-4 bg-slate-200 hover:bg-slate-300 disabled:opacity-60 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
