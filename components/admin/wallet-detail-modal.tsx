'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface WalletDetailModalProps {
  transaction: any
  onClose: () => void
}

export function WalletDetailModal({
  transaction,
  onClose,
}: WalletDetailModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Wallet Funding Details</h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body detail-grid">
          <div className="detail-item">
            <label>User ID</label>
            <p className="font-mono text-sm">{transaction.user_id}</p>
          </div>

          <div className="detail-item">
            <label>Payment Reference</label>
            <p className="font-mono">{transaction.payment_reference}</p>
          </div>

          <div className="detail-item">
            <label>Transaction Reference</label>
            <p className="font-mono text-sm">{transaction.transaction_reference || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Amount</label>
            <p className="text-lg font-semibold">₦{transaction.amount.toLocaleString()}</p>
          </div>

          <div className="detail-item">
            <label>Status</label>
            <p>
              <span className={`badge badge-${transaction.status.toLowerCase()}`}>
                {transaction.status}
              </span>
            </p>
          </div>

          <div className="detail-item">
            <label>Account Number</label>
            <p className="font-mono">{transaction.account_number}</p>
          </div>

          <div className="detail-item">
            <label>Account Name</label>
            <p>{transaction.account_name || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Bank Name</label>
            <p>{transaction.bank_name}</p>
          </div>

          <div className="detail-item">
            <label>Bank Code</label>
            <p className="font-mono">{transaction.bank_code || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>USSD Code</label>
            <p className="font-mono">{transaction.ussd_code || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Created At</label>
            <p>{new Date(transaction.created_at).toLocaleString()}</p>
          </div>

          <div className="detail-item">
            <label>Expires At</label>
            <p>{new Date(transaction.expires_at).toLocaleString()}</p>
          </div>

          {transaction.paid_at && (
            <div className="detail-item">
              <label>Paid At</label>
              <p>{new Date(transaction.paid_at).toLocaleString()}</p>
            </div>
          )}

          <div className="detail-item">
            <label>Settlement Status</label>
            <p>{transaction.settled ? 'Settled' : 'Not Settled'}</p>
          </div>

          {transaction.settlement_amount && (
            <div className="detail-item">
              <label>Settlement Amount</label>
              <p className="font-mono">₦{transaction.settlement_amount.toLocaleString()}</p>
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
