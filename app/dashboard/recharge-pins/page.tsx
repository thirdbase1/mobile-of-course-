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
import { ArrowLeft, Copy, Check, Download } from 'lucide-react'
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
  { value: 100, max: 50 },
  { value: 200, max: 25 },
  { value: 400, max: 15 },
  { value: 500, max: 10 },
]

export default function RechargePinsPage() {
  const router = useRouter()

  // Form state
  const [selectedNetwork, setSelectedNetwork] = useState('mtn')
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const [quantity, setQuantity] = useState('1')
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
        setBalance(walletData?.balance || 0)
      } catch (err) {
        setError('Failed to load wallet balance')
      } finally {
        setLoading(false)
      }
    }
    loadBalance()
  }, [])

  const selectedNetworkName = NETWORKS.find(n => n.id === selectedNetwork)?.name || ''
  const totalCost = selectedValue ? selectedValue * parseInt(quantity || '1') : 0
  const canSubmit = selectedValue && quantity && balance && balance >= totalCost && !loading

  const handleContinue = () => {
    if (!canSubmit) return
    setError(null)
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setProcessing(true)
    setSubmitting(true)
    try {
      const result = await generateRechargePins({
        network: selectedNetwork,
        value: String(selectedValue),
        number: quantity,
      })

      if (result.success) {
        setSuccessData({
          pins: result.pins || [],
          network: selectedNetworkName,
          value: selectedValue,
          quantity: parseInt(quantity),
          totalCost,
          transactionId: result.transactionId || '',
        })
        setShowSuccess(true)
      } else {
        setError(result.error || 'Failed to generate pins')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate pins')
    } finally {
      setProcessing(false)
      setSubmitting(false)
      setShowConfirm(false)
    }
  }

  const handleCopyPin = (pin: string, index: number) => {
    navigator.clipboard.writeText(pin)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleDownloadPins = () => {
    if (!successData) return
    const text = successData.pins.map((p, i) => `${i + 1}. ${p.pin}`).join('\n')
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', `${selectedNetworkName}-pins-${Date.now()}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Success view
  if (showSuccess && successData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Recharge Pins Generated</h1>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-24">
          {/* Success icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {successData.quantity} {successData.network} Pins Ready
            </h2>
            <p className="text-sm text-slate-600">
              Amount charged: <span className="font-semibold">₦{successData.totalCost.toLocaleString()}</span>
            </p>
          </div>

          {/* Summary card */}
          <div className="bg-muted rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Network</span>
              <span className="font-semibold">{successData.network}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Per Pin</span>
              <span className="font-semibold">₦{successData.value}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Quantity</span>
              <span className="font-semibold">{successData.quantity} pins</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-slate-600 font-semibold">Total</span>
              <span className="font-bold text-base">₦{successData.totalCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Pins list */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">Your Pins ({successData.pins.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {successData.pins.map((p, i) => (
                <div
                  key={i}
                  className="bg-white border rounded-lg p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <span className="text-xs text-slate-500 block">Pin {i + 1}</span>
                    <code className="font-mono text-sm font-semibold text-slate-900">{p.pin}</code>
                  </div>
                  <button
                    onClick={() => handleCopyPin(p.pin, i)}
                    className={`p-2 rounded-lg transition-colors ${
                      copiedIndex === i
                        ? 'bg-green-100 text-green-600'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {copiedIndex === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction ID */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-slate-600 mb-1">Transaction ID</p>
            <code className="text-xs font-mono font-semibold text-slate-900 break-all">{successData.transactionId}</code>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 sm:px-6 py-3 flex gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadPins}
            className="flex-1 gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            Done
          </Button>
        </div>
      </div>
    )
  }

  // Form view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Recharge Pins</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-24">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Network selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-4">Select Network</label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {NETWORKS.map((network) => (
              <button
                key={network.id}
                onClick={() => setSelectedNetwork(network.id)}
                className={`flex flex-col items-center gap-2 pb-3 px-4 rounded-lg transition-all flex-shrink-0 ${
                  selectedNetwork === network.id
                    ? 'border-b-2 border-primary'
                    : 'border-b-2 border-transparent'
                }`}
              >
                <NetworkLogo network={network.name} size="tab" page="airtime" />
              </button>
            ))}
          </div>
        </div>

        {/* Pin value */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Pin Value</label>
          <Select value={selectedValue?.toString() || ''} onValueChange={(val) => setSelectedValue(Number(val))}>
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Select pin value" />
            </SelectTrigger>
            <SelectContent>
              {PIN_VALUES.map((pin) => (
                <SelectItem key={`pin-${pin.value}`} value={pin.value.toString()}>
                  ₦{pin.value} (Max {pin.max})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Quantity</label>
          <Input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            type="number"
            min="1"
            max={PIN_VALUES.find(p => p.value === selectedValue)?.max.toString()}
            placeholder="1"
            className="h-12 rounded-xl"
          />
        </div>

        {/* Total cost */}
        {selectedValue && (
          <div className="bg-slate-50 rounded-xl p-4 mb-8">
            <p className="text-xs text-slate-600 mb-1">Total Cost</p>
            <p className="text-2xl font-bold">₦{totalCost.toLocaleString()}</p>
          </div>
        )}

        {/* Continue button */}
        <Button
          onClick={handleContinue}
          disabled={!canSubmit}
          className="w-full h-12 rounded-xl"
        >
          Continue
        </Button>
      </div>

      {/* Confirm sheet */}
      <ConfirmSheet
        show={showConfirm}
        title="Confirm Recharge Pins Purchase"
        page="recharge-pins"
        details={[
          { label: 'Network', value: selectedNetworkName },
          { label: 'Pin Value', value: `₦${selectedValue}` },
          { label: 'Quantity', value: `${quantity} pins` },
          { label: 'Total', value: `₦${totalCost.toLocaleString()}` },
          { label: 'Balance After', value: `₦${(balance! - totalCost).toLocaleString()}` },
        ]}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        loading={submitting}
      />

      {/* Processing overlay */}
      <ProcessingOverlay isVisible={processing} />
    </div>
  )
}
