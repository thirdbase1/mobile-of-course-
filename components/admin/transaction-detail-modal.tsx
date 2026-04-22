'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface TransactionDetailModalProps {
  transaction: any
  onClose: () => void
}

export function TransactionDetailModal({
  transaction,
  onClose,
}: TransactionDetailModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transaction Details</h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body detail-grid">
          {/* Basic Info */}
          <div className="detail-item">
            <label>Transaction ID</label>
            <p className="font-mono text-sm">{transaction.id}</p>
          </div>

          <div className="detail-item">
            <label>User ID</label>
            <p className="font-mono text-sm">{transaction.user_id}</p>
          </div>

          <div className="detail-item">
            <label>Payment Reference</label>
            <p className="font-mono text-sm">{transaction.payment_reference || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Status</label>
            <p>
              <span className={`badge badge-${transaction.status.toLowerCase()}`}>
                {transaction.status}
              </span>
            </p>
          </div>

          {/* Amount Info */}
          <div className="detail-item">
            <label>Amount</label>
            <p className="text-lg font-semibold">₦{transaction.amount.toLocaleString()}</p>
          </div>

          <div className="detail-item">
            <label>Balance Before</label>
            <p className="font-mono">₦{transaction.balance_before?.toLocaleString() || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Balance After</label>
            <p className="font-mono">₦{transaction.balance_after?.toLocaleString() || 'N/A'}</p>
          </div>

          {/* Service Info */}
          <div className="detail-item">
            <label>Category / Service</label>
            <p>{transaction.category || transaction.service_name || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Phone Number</label>
            <p className="font-mono">{transaction.phone || 'N/A'}</p>
          </div>

          {/* Bank Info */}
          <div className="detail-item">
            <label>Bank Name</label>
            <p>{transaction.monnify_bank_name || transaction.bank_name || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Account Number</label>
            <p className="font-mono">{transaction.account_number || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Account Name</label>
            <p>{transaction.account_name || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Bank Code</label>
            <p className="font-mono">{transaction.bank_code || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>USSD Code</label>
            <p className="font-mono">{transaction.ussd_code || 'N/A'}</p>
          </div>

          {/* Monnify Info */}
          <div className="detail-item">
            <label>Monnify Transaction Reference</label>
            <p className="font-mono text-sm">{transaction.transaction_reference || 'N/A'}</p>
          </div>

          {/* Timestamps */}
          <div className="detail-item">
            <label>Created At</label>
            <p>{transaction.created_at ? new Date(transaction.created_at).toLocaleString() : 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Updated At</label>
            <p>{transaction.updated_at ? new Date(transaction.updated_at).toLocaleString() : 'N/A'}</p>
          </div>

          {transaction.expires_at && (
            <div className="detail-item">
              <label>Expires At</label>
              <p>{new Date(transaction.expires_at).toLocaleString()}</p>
            </div>
          )}

          {transaction.paid_at && (
            <div className="detail-item">
              <label>Paid At</label>
              <p>{new Date(transaction.paid_at).toLocaleString()}</p>
            </div>
          )}

          {transaction.settlement_amount && (
            <div className="detail-item">
              <label>Settlement Amount</label>
              <p className="font-semibold">₦{transaction.settlement_amount.toLocaleString()}</p>
            </div>
          )}

          <div className="detail-item">
            <label>Settlement Status</label>
            <p>{transaction.settled ? 'Settled' : 'Not Settled'}</p>
          </div>

          {/* API Response */}
          {transaction.api_response && (
            <div className="detail-item full-width">
              <label>API Response</label>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(transaction.api_response, null, 2)}
              </pre>
            </div>
          )}

          {transaction.monnify_response && (
            <div className="detail-item full-width">
              <label>Monnify Response</label>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(transaction.monnify_response, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
