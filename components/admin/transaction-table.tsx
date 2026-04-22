'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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
      return <CheckCircle className="text-green-500" size={18} />
    case 'PENDING':
      return <Clock className="text-yellow-500" size={18} />
    case 'FAILED':
      return <XCircle className="text-red-500" size={18} />
    default:
      return <Clock size={18} />
  }
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  return (
    <>
      <div className="table-container">
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="font-mono text-sm">{tx.payment_reference || tx.id.slice(0, 8)}</td>
                <td>
                  <span className="badge badge-category">{tx.category || tx.service_name}</span>
                </td>
                <td>{tx.phone}</td>
                <td className="font-mono font-semibold">₦{tx.amount.toLocaleString()}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tx.status)}
                    <span className={`badge badge-${tx.status.toLowerCase()}`}>
                      {tx.status}
                    </span>
                  </div>
                </td>
                <td>{tx.monnify_bank_name || 'N/A'}</td>
                <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTransaction(tx)}
                  >
                    <Eye size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
