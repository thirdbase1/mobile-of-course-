'use client'

import { History, CheckCircle, Clock, XCircle } from 'lucide-react'

interface UserTransactionsCardProps {
  transactions: any[]
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle className="text-green-500" size={16} />
    case 'PENDING':
      return <Clock className="text-yellow-500" size={16} />
    case 'FAILED':
      return <XCircle className="text-red-500" size={16} />
    default:
      return <Clock size={16} />
  }
}

export function UserTransactionsCard({ transactions }: UserTransactionsCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <History size={24} />
        <h2>Recent Transactions</h2>
      </div>

      <div className="card-content">
        {transactions && transactions.length > 0 ? (
          <div className="transactions-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-service">
                    <span className="service-name">{tx.service_name || tx.category}</span>
                    <span className="service-phone text-sm">{tx.phone}</span>
                  </div>
                  <div className="transaction-date">{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>

                <div className="transaction-amount">
                  <span className="amount-value">-₦{tx.amount.toLocaleString()}</span>
                  <div className="status-badge">
                    {getStatusIcon(tx.status)}
                    <span className="status-text">{tx.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No transactions found</div>
        )}
      </div>
    </div>
  )
}

const styles = `
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(14, 165, 233, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(14, 165, 233, 0.1);
  transition: all 0.2s;
}

.transaction-item:hover {
  background: rgba(14, 165, 233, 0.1);
  border-color: rgba(14, 165, 233, 0.2);
}

.transaction-info {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex: 1;
}

.transaction-service {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.service-name {
  font-weight: 600;
  color: var(--admin-text);
  font-size: 14px;
}

.service-phone {
  color: var(--admin-text-secondary);
}

.transaction-date {
  color: var(--admin-text-secondary);
  font-size: 13px;
  white-space: nowrap;
}

.transaction-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.amount-value {
  font-weight: 700;
  color: var(--admin-danger);
  font-size: 14px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--admin-text-secondary);
}

.status-text {
  font-weight: 600;
}
`

export function UserTransactionsCardStyles() {
  return <style>{styles}</style>
}
