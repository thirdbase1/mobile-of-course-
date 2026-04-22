'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { LogDetailModal } from './log-detail-modal'

interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_user: string | null
  amount: number | null
  details: Record<string, any> | null
  created_at: string
}

interface AdminLogsTableProps {
  logs: AdminLog[]
}

const getActionColor = (action: string) => {
  switch (action) {
    case 'CREDIT_WALLET':
      return 'action-credit'
    case 'DEBIT_WALLET':
      return 'action-debit'
    case 'TOGGLE_ADMIN':
      return 'action-admin'
    case 'CREATE_PRICING_RULE':
      return 'action-pricing'
    default:
      return 'action-default'
  }
}

export function AdminLogsTable({ logs }: AdminLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null)

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Admin ID</th>
              <th>Action</th>
              <th>Target User</th>
              <th>Amount</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="font-mono text-sm">{log.admin_id.slice(0, 8)}...</td>
                <td>
                  <span className={`badge ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="font-mono text-sm">
                  {log.target_user ? log.target_user.slice(0, 8) + '...' : '-'}
                </td>
                <td className="font-mono">
                  {log.amount ? `₦${log.amount.toLocaleString()}` : '-'}
                </td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Eye size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </>
  )
}
