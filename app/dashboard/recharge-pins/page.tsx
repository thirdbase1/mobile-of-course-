'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Copy, Check, Download, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ConfirmSheet } from '@/components/confirm-sheet'
import { ProcessingOverlay } from '@/components/processing-overlay'
import { generateRechargePins } from '@/lib/actions/recharge-pins'
import { getWalletBalance } from '@/lib/actions/wallet'
import { NetworkLogo } from '@/lib/utils/network-logo'

const NETWORKS = [
  { id: 'mtn', name: 'MTN' },
  { id: 'glo', name: 'Glo' },
  { id: 'airtel', name: 'Airtel' },
  { id: '9mobile', name: '9mobile' },
]

const PIN_VALUES = [
  { value: 100, min: 10, max: 50 },
  { value: 200, min: 10, max: 25 },
  { value: 400, min: 10, max: 15 },
  { value: 500, min: 10, max: 10 },
]

export default function RechargePinsPage() {
  const router = useRouter()

  // Form state
  const [selectedNetwork, setSelectedNetwork] = useState('mtn')
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const [quantity, setQuantity] = useState('')
  const [balance, setBalance] = useState<number | null>(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Success state
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<{
    pins: Array<{ pin: string }>
    network: string
    value: number
    quantity: number
    totalCost: number
    transactionId: string
  } | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const walletData = await getWalletBalance()
        if (walletData?.balance === 0) {
          // Still loading, don't show error yet
          if (loading) return
        }
        setBalance(walletData?.balance || 0)
      } catch (err) {
        // Only show error if balance fails to load
        setError('Failed to load wallet balance. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    loadBalance()
  }, [])

  const selectedNetworkName = NETWORKS.find(n => n.id === selectedNetwork)?.name || ''
  const selectedPinConfig = PIN_VALUES.find(p => p.value === selectedValue)
  const quantityNum = parseInt(quantity) || 0
  const totalCost = selectedValue ? selectedValue * quantityNum : 0

  // Validation
  const hasValidQuantity = selectedPinConfig && quantityNum >= selectedPinConfig.min && quantityNum <= selectedPinConfig.max
  const hasValidBalance = balance !== null && balance >= totalCost && totalCost > 0
  const canSubmit = selectedValue && hasValidQuantity && hasValidBalance && !loading && !submitting

  // Error messages for quantity
  let quantityError = ''
  if (selectedValue && quantity !== '') {
    if (quantityNum < selectedPinConfig?.min!) {
      quantityError = `Minimum ${selectedPinConfig?.min} pins required`
    } else if (quantityNum > selectedPinConfig?.max!) {
      quantityError = `Maximum ${selectedPinConfig?.max} pins allowed`
    }
  }

  const handleContinue = () => {
    setError(null)
    if (!selectedValue) {
      setError('Please select a pin value')
      return
    }
    if (!quantity || quantityNum === 0) {
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
    setProcessing(true)
    setSubmitting(true)
    setError(null)

    try {
      const result = await generateRechargePins({
        network: selectedNetwork,
        value: String(selectedValue),
        number: quantity,
      })

      if (!result.success) {
        setError(result.error || 'Failed to generate pins. Please try again.')
        setShowConfirm(false)
        return
      }

      setSuccessData({
        pins: result.pins || [],
        network: selectedNetworkName,
        value: selectedValue,
        quantity: quantityNum,
        totalCost,
        transactionId: result.transactionId,
      })
      setShowSuccess(true)
      setSelectedValue(null)
      setQuantity('')
      
      // Refresh balance
      const newBalance = await getWalletBalance()
      setBalance(newBalance?.balance || 0)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setProcessing(false)
      setSubmitting(false)
      setShowConfirm(false)
    }
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
    a.download = `${selectedNetwork}-pins-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyPin = (pin: string, index: number) => {
    navigator.clipboard.writeText(pin)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
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

      <div className="flex-1 px-3 sm:px-4 overflow-y-auto flex flex-col pb-32">
        {/* Network Tabs - Compact */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-2 -mx-3 px-3 sm:-mx-4 sm:px-4">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setSelectedNetwork(n.id)
                setError(null)
              }}
              className={`flex-shrink-0 px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition ${
                selectedNetwork === n.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)]'
              }`}
            >
              <NetworkLogo network={n.name} size="small" active={selectedNetwork === n.id} page="recharge" />
              <span>{n.name}</span>
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex gap-2.5 p-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-sm mb-4 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Pin Value Selection */}
        <div className="form-group mb-4">
          <label className="form-label text-xs">Pin Value</label>
          <Select value={selectedValue?.toString() || ''} onValueChange={(val) => {
            setSelectedValue(parseInt(val))
            setQuantity('')
            setError(null)
          }}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Select pin value" />
            </SelectTrigger>
            <SelectContent>
              {PIN_VALUES.map((pv) => (
                <SelectItem key={pv.value} value={pv.value.toString()}>
                  ₦{pv.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity Input */}
        {selectedValue && (
          <div className="form-group mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="form-label text-xs">Quantity</label>
              <span className="text-[11px] text-[var(--text-3)]">Min: {selectedPinConfig?.min}, Max: {selectedPinConfig?.max}</span>
            </div>
            <input
              type="number"
              className="form-input h-10 text-sm"
              placeholder={`Between ${selectedPinConfig?.min} and ${selectedPinConfig?.max}`}
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                setError(null)
              }}
              min={selectedPinConfig?.min}
              max={selectedPinConfig?.max}
            />
            {quantityError && <p className="text-[11px] text-[#dc2626] mt-1">{quantityError}</p>}
          </div>
        )}

        {/* Summary Card */}
        {selectedValue && quantity && (
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-3 mb-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-3)]">Per Pin</span>
              <span className="font-semibold">₦{selectedValue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-3)]">Quantity</span>
              <span className="font-semibold">{quantityNum} pins</span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 flex justify-between">
              <span className="text-[var(--text-3)]">Total Cost</span>
              <span className="font-bold text-[var(--primary)]">₦{totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--border)]">
              <span className="text-[var(--text-3)]">Balance</span>
              <span className={`font-semibold ${totalCost > (balance || 0) ? 'text-[#dc2626]' : 'text-[var(--text-1)]'}`}>
                ₦{(balance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!canSubmit}
          className="btn-primary h-10 text-sm"
        >
          {loading ? 'Loading...' : submitting ? 'Processing...' : 'Continue'}
        </button>
      </div>

      {/* Confirmation Sheet */}
      <ConfirmSheet
        show={showConfirm}
        title="Confirm Recharge Pins"
        network={selectedNetworkName}
        page="recharge-pins"
        details={[
          { label: 'Pin Value', value: `₦${selectedValue}` },
          { label: 'Quantity', value: `${quantityNum} pins` },
          { label: 'Total Cost', value: `₦${totalCost.toLocaleString()}` },
          { label: 'Balance After', value: `₦${((balance || 0) - totalCost).toLocaleString()}` },
        ]}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        loading={processing}
      />

      {/* Success Overlay */}
      {showSuccess && successData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="w-full sm:w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Pins Generated Successfully!</h2>
              <button onClick={() => setShowSuccess(false)} className="text-2xl leading-none">✕</button>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-3)]">Network</span>
                <span className="font-semibold">{successData.network}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-3)]">Pin Value</span>
                <span className="font-semibold">₦{successData.value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-3)]">Quantity</span>
                <span className="font-semibold">{successData.quantity} pins</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="text-[var(--text-3)]">Total Charged</span>
                <span className="font-bold text-blue-600">₦{successData.totalCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Transaction ID */}
            <div className="bg-[var(--surface)] rounded-lg p-3 text-xs">
              <p className="text-[var(--text-3)] mb-1">Transaction ID</p>
              <p className="font-mono font-bold text-[var(--text-1)] break-all">{successData.transactionId}</p>
            </div>

            {/* Pins List */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--text-3)]">YOUR PINS ({successData.pins.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {successData.pins.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 bg-[var(--surface)] p-2.5 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[var(--text-3)] font-semibold flex-shrink-0">{i + 1}.</span>
                      <span className="font-mono font-bold text-[var(--text-1)] break-all">{p.pin}</span>
                    </div>
                    <button
                      onClick={() => handleCopyPin(p.pin, i)}
                      className={`flex-shrink-0 p-1.5 rounded transition text-xs font-semibold ${
                        copiedIndex === i
                          ? 'bg-green-100 text-green-700'
                          : 'bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20'
                      }`}
                    >
                      {copiedIndex === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadPins}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <Download className="w-4 h-4" />
                Download Pins
              </button>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] font-semibold text-sm hover:bg-[var(--surface)] transition"
              >
                Done
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-3)] text-center pt-2">Keep this safe. Do not share these pins with anyone.</p>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      <ProcessingOverlay isVisible={processing} />
    </div>
  )
}
