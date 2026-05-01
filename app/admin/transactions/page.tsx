'use client'

import { useState, useEffect } from 'react'
import { getTransactions } from '@/lib/actions/admin'
import { TransactionTable } from '@/components/admin/transaction-table'
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      const result = await getTransactions(page, 20, statusFilter || undefined)
      if (!result.error) {
        setTransactions(result.transactions)
        setTotalPages(result.totalPages)
      }
      setLoading(false)
    }
    fetchTransactions()
  }, [page, statusFilter])

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-row">
          <div>
            <h1>Transactions</h1>
            <p>View and manage all platform transactions</p>
          </div>
        </div>
      </div>

      <div className="filter-chips">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`filter-chip ${statusFilter === f.value ? 'active' : ''}`}
            onClick={() => {
              setStatusFilter(f.value)
              setPage(1)
            }}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <span>Loading transactions...</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CreditCard size={32} />
          </div>
          <h3>No transactions found</h3>
          <p>
            {statusFilter
              ? `No ${statusFilter.toLowerCase()} transactions yet`
              : 'No transactions have been recorded'}
          </p>
        </div>
      ) : (
        <>
          <TransactionTable transactions={transactions} />
          <div className="pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              type="button"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              type="button"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
