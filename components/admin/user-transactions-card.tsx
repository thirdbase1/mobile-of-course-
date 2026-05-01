'use client'

import { History, CheckCircle, Clock, XCircle } from 'lucide-react'

interface UserTransactionsCardProps {
  transactions: any[]
}

const getStatusIcon = (status: string) => {
  const s = status?.toUpperCase()
  if (s === 'SUCCESS') return <CheckCircle size={14} style={{ color: 'var(--admin-success)' }} />
  if (s === 'PENDING') return <Clock size={14} style={{ color: 'var(--admin-warning)' }} />
  if (s === 'FAILED') return <XCircle size={14} style={{ color: 'var(--admin-danger)' }} />
  return <Clock size={14} />
}

export function UserTransactionsCard({ transactions }: UserTransactionsCardProps) {
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-icon">
          <History size={18} />
        </div>
        <h2 className="admin-card-title">Recent Transactions</h2>
      </div>

      <div className="admin-card-body">
        {transactions && transactions.length > 0 ? (
          <div className="data-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="data-card">
                <div className="data-card-row">
                  <div className="data-card-label">Service</div>
                  <div className="data-card-value">{tx.service_name || tx.category}</div>
                </div>
                {tx.phone && (
                  <div className="data-card-row">
                    <div className="data-card-label">Phone</div>
                    <div className="data-card-value text-mono">{tx.phone}</div>
                  </div>
                )}
                <div className="data-card-row">
                  <div className="data-card-label">Amount</div>
                  <div className="data-card-value" style={{ color: 'var(--admin-danger)', fontWeight: 700 }}>
                    -₦{Number(tx.amount).toLocaleString()}
                  </div>
                </div>
                <div className="data-card-row">
                  <div className="data-card-label">Status</div>
                  <div className="data-card-value">
                    <span className="badge-with-icon">
                      {getStatusIcon(tx.status)}
                      <span>{tx.status}</span>
                    </span>
                  </div>
                </div>
                <div className="data-card-row">
                  <div className="data-card-label">Date</div>
                  <div className="data-card-value">{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No transactions found</p>
          </div>
        )}
      </div>
    </div>
  )
}
