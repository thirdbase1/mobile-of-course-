'use client'

import { X, Receipt, Copy } from 'lucide-react'

interface WalletDetailModalProps {
  transaction: any
  onClose: () => void
}

function DetailRow({
  label,
  value,
  mono,
  copyable,
  highlight,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  copyable?: boolean
  highlight?: boolean
}) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span
        className={`detail-row-value ${mono ? 'mono' : ''}`}
        style={{
          color: highlight ? 'var(--admin-success)' : 'var(--admin-text)',
          fontWeight: highlight ? 700 : 500,
        }}
      >
        {value}
        {copyable && typeof value === 'string' && (
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(value)}
            className="btn btn-ghost btn-icon btn-sm"
            style={{ marginLeft: 6 }}
            title="Copy"
          >
            <Copy size={12} />
          </button>
        )}
      </span>
    </div>
  )
}

export function WalletDetailModal({ transaction, onClose }: WalletDetailModalProps) {
  const status = transaction.status?.toLowerCase() || 'pending'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Receipt size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: '-3px' }} />
            Wallet Funding Details
          </h2>
          <button onClick={onClose} className="modal-close" type="button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Hero amount */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.04))',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              borderRadius: 12,
              padding: 20,
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--admin-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Amount
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--admin-text)',
                fontFamily: 'var(--font-mono)',
                marginBottom: 10,
              }}
            >
              ₦{transaction.amount.toLocaleString()}
            </div>
            <span className={`badge badge-${status}`} style={{ textTransform: 'uppercase' }}>
              {transaction.status}
            </span>
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">Payment Information</h4>
            <DetailRow label="Payment Reference" value={transaction.payment_reference} mono copyable />
            <DetailRow
              label="Transaction Reference"
              value={transaction.transaction_reference || 'N/A'}
              mono
            />
            <DetailRow label="User ID" value={transaction.user_id} mono copyable />
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">Bank Account</h4>
            <DetailRow label="Account Number" value={transaction.account_number} mono copyable />
            <DetailRow label="Account Name" value={transaction.account_name || 'N/A'} />
            <DetailRow label="Bank" value={transaction.bank_name} />
            {transaction.bank_code && (
              <DetailRow label="Bank Code" value={transaction.bank_code} mono />
            )}
            {transaction.ussd_code && (
              <DetailRow label="USSD Code" value={transaction.ussd_code} mono />
            )}
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">Timeline</h4>
            <DetailRow label="Created" value={new Date(transaction.created_at).toLocaleString()} />
            <DetailRow label="Expires" value={new Date(transaction.expires_at).toLocaleString()} />
            {transaction.paid_at && (
              <DetailRow label="Paid" value={new Date(transaction.paid_at).toLocaleString()} highlight />
            )}
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">Settlement</h4>
            <DetailRow
              label="Status"
              value={
                <span className={`badge ${transaction.settled ? 'badge-success' : 'badge-pending'}`}>
                  {transaction.settled ? 'Settled' : 'Not Settled'}
                </span>
              }
            />
            {transaction.settlement_amount && (
              <DetailRow
                label="Amount"
                value={`₦${transaction.settlement_amount.toLocaleString()}`}
                mono
                highlight
              />
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
