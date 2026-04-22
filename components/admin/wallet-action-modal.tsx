'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

interface WalletActionModalProps {
  user: {
    id: string
    full_name: string
    wallet_balance: number
  }
  action: 'credit' | 'debit'
  onClose: () => void
  onAction: (userId: string, amount: number, reason: string) => Promise<any>
}

export function WalletActionModal({
  user,
  action,
  onClose,
  onAction,
}: WalletActionModalProps) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [newBalance, setNewBalance] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setNewBalance(null)
    setLoading(true)

    try {
      const amountNum = parseFloat(amount)
      if (!amountNum || amountNum <= 0) {
        setError('Please enter a valid amount')
        setLoading(false)
        return
      }

      // Reason is optional, use a default if not provided
      const finalReason = reason.trim() || `Manual ${action} by admin`

      const result = await onAction(user.id, amountNum, finalReason)

      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        setSuccess(true)
        setNewBalance(result.newBalance)
        setAmount('')
        setReason('')
        setLoading(false)
        // Wait 2 seconds before closing so user can see the success message
        setTimeout(() => {
          onClose()
          window.location.reload()
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {action === 'credit' ? 'Credit' : 'Debit'} Wallet
          </h2>
          <button onClick={onClose} className="modal-close" disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {!success ? (
            <>
              <div className="form-group">
                <label>User: {user.full_name}</label>
                <p className="text-sm text-gray-500">Current Balance: ₦{user.wallet_balance.toLocaleString()}</p>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount (₦) *</label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reason">Reason (Optional)</label>
                <Input
                  id="reason"
                  type="text"
                  placeholder="e.g., Refund, Bonus, Error correction"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-actions">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className={action === 'credit' ? 'btn-success' : 'btn-danger'}
                >
                  {loading ? 'Processing...' : `${action === 'credit' ? 'Credit' : 'Debit'} Wallet`}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <CheckCircle size={48} className="text-green-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {action === 'credit' ? 'Credit' : 'Debit'} Successful!
                </h3>
                <p className="text-gray-600 mt-2">
                  Amount: ₦{amount}
                </p>
                <p className="text-gray-600">
                  New Balance: ₦{newBalance?.toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Closing in 2 seconds...
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
