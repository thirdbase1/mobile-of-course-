'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
      return <CheckCircle className="text-green-500" size={18} />
    case 'PENDING':
      return <Clock className="text-yellow-500" size={18} />
    case 'EXPIRED':
      return <XCircle className="text-red-500" size={18} />
    default:
      return <Clock size={18} />
  }
}

export function WalletFundingTable({ transactions }: WalletFundingTableProps) {
  const [selectedTx, setSelectedTx] = useState<MonnifyTransaction | null>(null)

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Payment Reference</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Account</th>
              <th>Bank</th>
              <th>Expires At</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="font-mono text-sm">{tx.payment_reference}</td>
                <td className="font-mono font-semibold">₦{tx.amount.toLocaleString()}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tx.status)}
                    <span className={`badge badge-${tx.status.toLowerCase()}`}>
                      {tx.status}
                    </span>
                  </div>
                </td>
                <td className="font-mono text-sm">{tx.account_number}</td>
                <td>{tx.bank_name}</td>
                <td>{new Date(tx.expires_at).toLocaleString()}</td>
                <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <Eye size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
