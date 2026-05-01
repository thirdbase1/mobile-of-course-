'use client'

import { useState } from 'react'
import { Eye, CheckCircle, Clock, XCircle } from 'lucide-react'
import { TransactionDetailModal } from './transaction-detail-modal'

interface Transaction {
  id: string
  user_id: string
  amount: number
  category: string
  status: string
  service_name: string
  phone: string
  created_at: string
  payment_reference: string
  monnify_bank_name: string
}

interface TransactionTableProps {
  transactions: Transaction[]
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle size={14} style={{ color: 'var(--admin-success)' }} />
    case 'PENDING':
      return <Clock size={14} style={{ color: 'var(--admin-warning)' }} />
    case 'FAILED':
      return <XCircle size={14} style={{ color: 'var(--admin-danger)' }} />
    default:
      return <Clock size={14} />
  }
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  return (
    <>
      <div className="table-container">
        {/* Desktop table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Bank</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="text-mono" style={{ fontSize: 12 }}>
                    {tx.payment_reference || tx.id.slice(0, 8)}
                  </td>
                  <td>
                    <span className="badge badge-category">
                      {tx.category || tx.service_name}
                    </span>
                  </td>
                  <td className="text-mono" style={{ fontSize: 13 }}>
                    {tx.phone || 'N/A'}
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
                  <td style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>
                    {tx.monnify_bank_name || 'N/A'}
                  </td>
                  <td style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => setSelectedTransaction(tx)}
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
              onClick={() => setSelectedTransaction(tx)}
              style={{ cursor: 'pointer' }}
            >
              <div className="data-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="data-card-title">
                    {tx.category || tx.service_name || 'Transaction'}
                  </h3>
                  <p className="data-card-subtitle text-mono" style={{ fontSize: 11 }}>
                    {tx.payment_reference || tx.id.slice(0, 16)}
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
                  <span className="data-card-label">Phone</span>
                  <span className="data-card-value mono">{tx.phone || 'N/A'}</span>
                </div>
                <div className="data-card-field">
                  <span className="data-card-label">Bank</span>
                  <span className="data-card-value">{tx.monnify_bank_name || 'N/A'}</span>
                </div>
                <div className="data-card-field">
                  <span className="data-card-label">Date</span>
                  <span className="data-card-value">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </>
  )
}
