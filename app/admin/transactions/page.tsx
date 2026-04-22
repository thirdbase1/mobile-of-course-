'use client'

import { useState, useEffect } from 'react'
import { getTransactions } from '@/lib/actions/admin'
import { TransactionTable } from '@/components/admin/transaction-table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
        <h1>Transaction Management</h1>
        <p>View and manage all platform transactions</p>
      </div>

      <div className="filter-bar">
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value === 'all' ? '' : value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">No transactions found</div>
      ) : (
        <>
          <TransactionTable transactions={transactions} />
          <div className="pagination">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
