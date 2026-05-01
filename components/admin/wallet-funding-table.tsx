'use client'

import { useState } from 'react'
import { Eye, CheckCircle, Clock, XCircle } from 'lucide-react'
import { WalletDetailModal } from './wallet-detail-modal'

interface MonnifyTransaction {
  id: string
  user_id: string
  payment_reference: string
  amount: number
  status: string
  account_number: string
  bank_name: string
  expires_at: string
  created_at: string
}

interface WalletFundingTableProps {
  transactions: MonnifyTransaction[]
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle size={14} style={{ color: 'var(--admin-success)' }} />
    case 'PENDING':
      return <Clock size={14} style={{ color: 'var(--admin-warning)' }} />
    case 'EXPIRED':
      return <XCircle size={14} style={{ color: 'var(--admin-danger)' }} />
    default:
      return <Clock size={14} />
  }
}

export function WalletFundingTable({ transactions }: WalletFundingTableProps) {
  const [selectedTx, setSelectedTx] = useState<MonnifyTransaction | null>(null)

  return (
    <>
      <div className="table-container">
        {/* Desktop table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Account</th>
                <th>Bank</th>
                <th>Expires</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="text-mono" style={{ fontSize: 12 }}>
                    {tx.payment_reference}
                  </td>
                  <td className="text-mono" style={{ fontWeight: 700 }}>
                    ₦{tx.amount.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge badge-${tx.status.toLowerCase()}`}>
                      {getStatusIcon(tx.status)}
                      {tx.status}
                    </span>
                  </td>
                  <td className="text-mono" style={{ fontSize: 13 }}>
                    {tx.account_number}
                  </td>
                  <td style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>
                    {tx.bank_name}
                  </td>
                  <td style={{ color: 'var(--admin-text-secondary)', fontSize: 12 }}>
                    {new Date(tx.expires_at).toLocaleString()}
                  </td>
                  <td style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => setSelectedTx(tx)}
                      type="button"
                      title="View details"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="data-list" style={{ padding: 12 }}>
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="data-card"
              onClick={() => setSelectedTx(tx)}
              style={{ cursor: 'pointer' }}
            >
              <div className="data-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="data-card-title">{tx.bank_name}</h3>
                  <p className="data-card-subtitle text-mono" style={{ fontSize: 11 }}>
                    {tx.payment_reference}
                  </p>
                </div>
                <span className="data-card-amount">
                  ₦{tx.amount.toLocaleString()}
                </span>
              </div>

              <div className="data-card-grid">
                <div className="data-card-field">
                  <span className="data-card-label">Status</span>
                  <span className={`badge badge-${tx.status.toLowerCase()}`} style={{ width: 'fit-content' }}>
                    {getStatusIcon(tx.status)}
                    {tx.status}
                  </span>
                </div>
                <div className="data-card-field">
                  <span className="data-card-label">Account</span>
                  <span className="data-card-value mono">{tx.account_number}</span>
                </div>
                <div className="data-card-field">
                  <span className="data-card-label">Created</span>
                  <span className="data-card-value">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="data-card-field">
                  <span className="data-card-label">Expires</span>
                  <span className="data-card-value">
                    {new Date(tx.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTx && (
        <WalletDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </>
  )
}
