'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertCircle, Copy, Check, Download } from 'lucide-react'
import Link from 'next/link'
import { getWalletBalance } from '@/lib/actions/wallet'
import { ConfirmSheet } from '@/components/confirm-sheet'
import { SuccessOverlay } from '@/components/success-overlay'
import { ProcessingOverlay } from '@/components/processing-overlay'
import { NetworkLogo } from '@/lib/utils/network-logo'

const networks = ['MTN', 'Glo', 'Airtel', '9mobile']

const PIN_VALUES = [
  { value: 100, min: 10, max: 50 },
  { value: 200, min: 10, max: 25 },
  { value: 400, min: 10, max: 15 },
  { value: 500, min: 10, max: 10 },
]

export default function RechargePinsPage() {
  const router = useRouter()
  const [network, setNetwork] = useState('MTN')
  const [pinValue, setPinValue] = useState('')
  const [quantity, setQuantity] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [successData, setSuccessData] = useState<{
    pins: Array<{ pin: string }>
    network: string
    value: number
    quantity: number
    totalCost: number
    transactionId: string
  } | null>(null)
  const [copiedPinIndex, setCopiedPinIndex] = useState<number | null>(null)

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const walletData = await getWalletBalance()
        setBalance(walletData?.balance || 0)
      } catch (err) {
        setError('Failed to load wallet balance. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    loadBalance()
  }, [])

  const pinConfig = PIN_VALUES.find(p => p.value === parseInt(pinValue))
  const quantityNum = parseInt(quantity) || 0
  const totalCost = pinValue ? parseInt(pinValue) * quantityNum : 0
  const networkId = network.toLowerCase() === '9mobile' ? '9mobile' : network.toLowerCase()

  // Validation
  let quantityError = ''
  if (pinValue && quantity) {
    if (quantityNum < pinConfig?.min!) {
      quantityError = `Minimum ${pinConfig?.min} pins required`
    } else if (quantityNum > pinConfig?.max!) {
      quantityError = `Maximum ${pinConfig?.max} pins allowed`
    }
  }

  const isValid = pinValue && !quantityError && totalCost > 0 && balance !== null && balance >= totalCost

  const handleContinue = () => {
    setError('')
    if (!pinValue) {
      setError('Please select a pin value')
      return
    }
    if (!quantity) {
      setError('Please enter quantity')
      return
    }
    if (quantityError) {
      setError(quantityError)
      return
    }
    if (totalCost > balance!) {
      setError('Insufficient wallet balance')
      return
    }
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    const balanceBefore = balance
    setProcessing(true)

    try {
      const res = await fetch('/api/gsubz/recharge-pins/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: networkId,
          value: pinValue,
          number: quantity
        })
      })

      if (res.status === 429) {
        setError('Too many requests. Maximum 5 per minute. Please wait before trying again.')
        setShowConfirm(false)
        setProcessing(false)
        return
      }

      const data = await res.json()
      setResult(data)
      setShowConfirm(false)

      if (data.success) {
        const newBal = await getWalletBalance()
        setSuccessData({
          pins: data.pins || [],
          network,
          value: parseInt(pinValue),
          quantity: quantityNum,
          totalCost,
          transactionId: data.transactionId || ''
        })
        setShowSuccess(true)
        setPinValue('')
        setQuantity('')
        setBalance(newBal?.balance || 0)
      } else {
        setError(data.error || data.message || 'Transaction failed. Please try again.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleCopyPin = (pin: string, index: number) => {
    navigator.clipboard.writeText(pin)
    setCopiedPinIndex(index)
    setTimeout(() => setCopiedPinIndex(null), 2000)
  }

  const handleDownloadPins = () => {
    if (!successData?.pins) return
    
    const pinsText = successData.pins
      .map((p, i) => `${i + 1}. ${p.pin}`)
      .join('\n')
    
    const content = `${successData.network.toUpperCase()} Recharge Pins
Transaction ID: ${successData.transactionId}
Date: ${new Date().toLocaleString()}
Pin Value: ₦${successData.value}
Quantity: ${successData.quantity}
Total: ₦${successData.totalCost}

${pinsText}

Keep this safe. Do not share these pins with anyone.`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${networkId}-pins-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] overflow-y-auto flex flex-col">
      {/* Top Bar */}
      <div className="topbar">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft style={{ width: 18, height: 18, color: 'var(--text-1)' }} />
          <span className="topbar-title">Recharge Pins</span>
        </Link>
      </div>

      <div className="flex-1 px-4 overflow-y-auto flex flex-col pb-32">
        {/* Network Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {networks.map((n) => (
            <button 
              key={n} 
              className={`net-tab ${network === n ? 'active' : ''}`} 
              onClick={() => {
                setNetwork(n)
                setError('')
              }}
            >
              <NetworkLogo network={n} size="tab" active={network === n} page="recharge" />
              <span>{n}</span>
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex gap-2.5 p-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-sm mb-4 flex-shrink-0">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Pin Value Selection */}
        <div className="form-group">
          <label className="form-label">Pin Value</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {PIN_VALUES.map((pv) => (
              <button
                key={pv.value}
                onClick={() => {
                  setPinValue(pv.value.toString())
                  setQuantity('')
                  setError('')
                }}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  pinValue === pv.value.toString()
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] text-[var(--text-1)] border border-[var(--border)]'
                }`}
              >
                ₦{pv.value}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Input */}
        {pinValue && (
          <div className="form-group">
            <label className="form-label">
              Quantity (Min: {pinConfig?.min}, Max: {pinConfig?.max})
            </label>
            <input
              type="number"
              className={`form-input ${quantityError ? 'border-[#fca5a5]' : ''}`}
              placeholder={`Enter quantity (${pinConfig?.min}-${pinConfig?.max})`}
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                setError('')
              }}
              min={pinConfig?.min}
              max={pinConfig?.max}
            />
            {quantityError && (
              <p className="text-xs text-[#dc2626] mt-1">{quantityError}</p>
            )}
          </div>
        )}

        {/* Total & Balance */}
        {pinValue && quantity && !quantityError && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-2)]">Unit Price:</span>
              <span className="font-semibold text-[var(--text-1)]">₦{parseInt(pinValue).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-2)]">Total:</span>
              <span className="font-bold text-lg text-[var(--primary)]">₦{totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-[var(--border)]">
              <span className="text-[var(--text-2)]">Your Balance:</span>
              <span className={`font-semibold ${balance! >= totalCost ? 'text-[#10b981]' : 'text-[#dc2626]'}`}>
                ₦{(balance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!isValid || loading}
          className="form-submit"
          style={{ opacity: !isValid || loading ? 0.6 : 1 }}
        >
          {loading ? (
            <>
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              <span>Loading...</span>
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>

      {/* Confirm Sheet */}
      {showConfirm && (
        <ConfirmSheet
          onClose={() => {
            setShowConfirm(false)
            setProcessing(false)
          }}
          onConfirm={handleConfirm}
          isProcessing={processing}
          network={network}
          title={`Confirm Purchase`}
          details={[
            { label: 'Network', value: network },
            { label: 'Pin Value', value: `₦${pinValue}` },
            { label: 'Quantity', value: `${quantity} pins` },
            { label: 'Total Amount', value: `₦${totalCost.toLocaleString()}` },
          ]}
        />
      )}

      {/* Processing Overlay */}
      {processing && <ProcessingOverlay />}

      {/* Success Overlay */}
      {showSuccess && successData && (
        <SuccessOverlay
          onClose={() => {
            setShowSuccess(false)
            setResult(null)
            setSuccessData(null)
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#dbeafe] flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#bfdbfe] flex items-center justify-center">
                <div style={{ width: 24, height: 24, color: '#1e40af' }}>✓</div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-1)]">Success!</h2>
            <p className="text-sm text-[var(--text-2)] text-center">
              Your {successData.quantity} {network} recharge pin{successData.quantity > 1 ? 's have' : ' has'} been generated
            </p>

            {/* Pins List */}
            <div className="w-full bg-[var(--surface)] rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="text-xs font-semibold text-[var(--text-2)] mb-3">YOUR PINS</div>
              <div className="space-y-2">
                {successData.pins.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleCopyPin(p.pin, i)}
                    className="w-full flex items-center justify-between bg-[var(--bg)] p-3 rounded-lg hover:bg-[#f5f5f5] transition group"
                  >
                    <div className="text-left">
                      <div className="text-xs text-[var(--text-2)]">Pin {i + 1}</div>
                      <div className="font-mono font-semibold text-[var(--text-1)]">{p.pin}</div>
                    </div>
                    {copiedPinIndex === i ? (
                      <Check style={{ width: 16, height: 16, color: '#10b981' }} />
                    ) : (
                      <Copy style={{ width: 16, height: 16, color: 'var(--text-2)', opacity: 0.5, groupHover: { opacity: 1 } }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction ID */}
            <div className="w-full bg-[var(--surface)] rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--text-2)] mb-1">Transaction ID</div>
              <div className="font-mono font-semibold text-sm text-[var(--text-1)]">{successData.transactionId}</div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full">
              <button
                onClick={handleDownloadPins}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition"
              >
                <Download style={{ width: 16, height: 16 }} />
                Download
              </button>
              <button
                onClick={() => {
                  setShowSuccess(false)
                  setResult(null)
                  setSuccessData(null)
                }}
                className="flex-1 px-4 py-2 bg-[var(--surface)] text-[var(--text-1)] rounded-lg font-semibold text-sm border border-[var(--border)] hover:bg-[#f5f5f5] transition"
              >
                Done
              </button>
            </div>
          </div>
        </SuccessOverlay>
      )}
    </div>
  )
}
