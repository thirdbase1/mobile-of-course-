'use client'

import { useState } from 'react'
import { X, CheckCircle, AlertCircle, Wallet } from 'lucide-react'

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

  const isCredit = action === 'credit'

  const quickAmounts = [500, 1000, 2000, 5000, 10000]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setNewBalance(null)
    setLoading(true)

    try {
      const amountNum = parseFloat(amount)
      if (!amountNum || amountNum <= 0) {
        setError('Please enter a valid amount greater than 0')
        setLoading(false)
        return
      }

      if (!isCredit && amountNum > user.wallet_balance) {
        setError(`Cannot debit more than current balance (₦${user.wallet_balance.toLocaleString()})`)
        setLoading(false)
        return
      }

      const finalReason = reason.trim() || `Manual ${action} by admin`
      const result = await onAction(user.id, amountNum, finalReason)

      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        setSuccess(true)
        setNewBalance(result.newBalance)
        setLoading(false)
        setTimeout(() => {
          onClose()
          window.location.reload()
        }, 1800)
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
            <Wallet size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: '-3px' }} />
            {isCredit ? 'Credit' : 'Debit'} Wallet
          </h2>
          <button onClick={onClose} className="modal-close" disabled={loading} type="button">
            <X size={20} />
          </button>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="modal-body">
            {/* User info card */}
            <div
              style={{
                background: 'rgba(14, 165, 233, 0.06)',
                border: '1px solid rgba(14, 165, 233, 0.18)',
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--admin-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                User
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>
                {user.full_name || 'Unnamed user'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                  Current Balance
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--admin-success)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  ₦{user.wallet_balance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="amount" className="form-label">
                Amount <span style={{ color: 'var(--admin-danger)' }}>*</span>
              </label>
              <input
                id="amount"
                className="form-input"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                required
                disabled={loading}
                inputMode="decimal"
              />
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    disabled={loading}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                  >
                    ₦{q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="reason" className="form-label">
                Reason <span style={{ color: 'var(--admin-text-tertiary)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="reason"
                className="form-input"
                type="text"
                placeholder="e.g. Refund, Bonus, Error correction"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: 12,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 8,
                  color: '#fca5a5',
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${isCredit ? 'btn-success' : 'btn-danger'}`}
                disabled={loading}
              >
                {loading ? 'Processing…' : isCredit ? 'Credit Wallet' : 'Debit Wallet'}
              </button>
            </div>
          </form>
        ) : (
          <div
            className="modal-body"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              padding: '36px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={36} style={{ color: 'var(--admin-success)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
                {isCredit ? 'Credit' : 'Debit'} successful
              </h3>
              <p style={{ fontSize: 13, color: 'var(--admin-text-secondary)', margin: '6px 0 0 0' }}>
                Amount: ₦{parseFloat(amount).toLocaleString()}
              </p>
              <p style={{ fontSize: 13, color: 'var(--admin-text-secondary)', margin: '2px 0 0 0' }}>
                New balance:{' '}
                <strong style={{ color: 'var(--admin-success)' }}>
                  ₦{newBalance?.toLocaleString()}
                </strong>
              </p>
            </div>
            <p style={{ fontSize: 12, color: 'var(--admin-text-tertiary)', margin: 0 }}>
              Closing automatically…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
