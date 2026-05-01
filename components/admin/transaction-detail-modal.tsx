'use client'

import { X, Receipt, Copy } from 'lucide-react'

interface TransactionDetailModalProps {
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
        {copyable && typeof value === 'string' && value !== 'N/A' && (
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

export function TransactionDetailModal({
  transaction,
  onClose,
}: TransactionDetailModalProps) {
  const status = transaction.status?.toLowerCase() || 'pending'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Receipt size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: '-3px' }} />
            Transaction Details
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
              {transaction.category || 'Transaction'} — Amount
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--admin-text)',
                fontFamily: 'var(--font-mono)',
                marginBottom: 10,
                wordBreak: 'break-word',
              }}
            >
              ₦{transaction.amount.toLocaleString()}
            </div>
            <span className={`badge badge-${status}`} style={{ textTransform: 'uppercase' }}>
              {transaction.status}
            </span>
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">Reference</h4>
            <DetailRow label="Transaction ID" value={transaction.id} mono copyable />
            <DetailRow label="User ID" value={transaction.user_id} mono copyable />
            <DetailRow
              label="Payment Reference"
              value={transaction.payment_reference || 'N/A'}
              mono
              copyable
            />
            {transaction.transaction_reference && (
              <DetailRow
                label="Monnify Reference"
                value={transaction.transaction_reference}
                mono
                copyable
              />
            )}
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">Service</h4>
            <DetailRow
              label="Category"
              value={transaction.category || transaction.service_name || 'N/A'}
            />
            {transaction.phone && (
              <DetailRow label="Phone" value={transaction.phone} mono />
            )}
            {transaction.balance_before !== undefined && transaction.balance_before !== null && (
              <DetailRow
                label="Balance Before"
                value={`₦${transaction.balance_before.toLocaleString()}`}
                mono
              />
            )}
            {transaction.balance_after !== undefined && transaction.balance_after !== null && (
              <DetailRow
                label="Balance After"
                value={`₦${transaction.balance_after.toLocaleString()}`}
                mono
                highlight
              />
            )}
          </div>

          {(transaction.account_number ||
            transaction.bank_name ||
            transaction.monnify_bank_name) && (
            <div className="detail-section">
              <h4 className="detail-section-title">Bank</h4>
              <DetailRow
                label="Bank"
                value={transaction.monnify_bank_name || transaction.bank_name || 'N/A'}
              />
              {transaction.account_number && (
                <DetailRow label="Account Number" value={transaction.account_number} mono />
              )}
              {transaction.account_name && (
                <DetailRow label="Account Name" value={transaction.account_name} />
              )}
              {transaction.bank_code && (
                <DetailRow label="Bank Code" value={transaction.bank_code} mono />
              )}
            </div>
          )}

          <div className="detail-section">
            <h4 className="detail-section-title">Timeline</h4>
            {transaction.created_at && (
              <DetailRow label="Created" value={new Date(transaction.created_at).toLocaleString()} />
            )}
            {transaction.updated_at && (
              <DetailRow label="Updated" value={new Date(transaction.updated_at).toLocaleString()} />
            )}
            {transaction.expires_at && (
              <DetailRow label="Expires" value={new Date(transaction.expires_at).toLocaleString()} />
            )}
            {transaction.paid_at && (
              <DetailRow label="Paid" value={new Date(transaction.paid_at).toLocaleString()} highlight />
            )}
          </div>

          {(transaction.settled !== undefined || transaction.settlement_amount) && (
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
          )}

          {(transaction.api_response || transaction.monnify_response) && (
            <div className="detail-section">
              <h4 className="detail-section-title">Raw Response</h4>
              {transaction.api_response && (
                <pre
                  style={{
                    background: 'var(--admin-bg-tertiary)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 11,
                    color: 'var(--admin-text-secondary)',
                    overflow: 'auto',
                    maxHeight: 200,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {JSON.stringify(transaction.api_response, null, 2)}
                </pre>
              )}
              {transaction.monnify_response && (
                <pre
                  style={{
                    background: 'var(--admin-bg-tertiary)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 11,
                    color: 'var(--admin-text-secondary)',
                    overflow: 'auto',
                    maxHeight: 200,
                    fontFamily: 'var(--font-mono)',
                    marginTop: 8,
                  }}
                >
                  {JSON.stringify(transaction.monnify_response, null, 2)}
                </pre>
              )}
            </div>
          )}
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
