'use client'

import { useState } from 'react'
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

const actionBadge = (action: string) => {
  switch (action) {
    case 'CREDIT_WALLET':
      return 'badge-success'
    case 'DEBIT_WALLET':
      return 'badge-danger'
    case 'TOGGLE_ADMIN':
      return 'badge-warning'
    case 'CREATE_PRICING_RULE':
      return 'badge-info'
    default:
      return 'badge-user'
  }
}

export function AdminLogsTable({ logs }: AdminLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null)

  if (!logs || logs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Eye />
        </div>
        <h3 className="empty-state-title">No activity yet</h3>
        <p className="empty-state-text">Admin actions will be logged here</p>
      </div>
    )
  }

  return (
    <>
      <div className="table-container">
        {/* Desktop */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-mono" style={{ fontSize: 13 }}>
                    {log.admin_id.slice(0, 8)}…
                  </td>
                  <td>
                    <span className={`badge ${actionBadge(log.action)}`}>{log.action}</span>
                  </td>
                  <td className="text-mono" style={{ fontSize: 13 }}>
                    {log.target_user ? log.target_user.slice(0, 8) + '…' : '—'}
                  </td>
                  <td className="text-mono" style={{ fontWeight: 600 }}>
                    {log.amount ? `₦${log.amount.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => setSelectedLog(log)}
                      type="button"
                      title="View details"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="data-list" style={{ padding: 12 }}>
          {logs.map((log) => (
            <button
              key={log.id}
              className="data-card"
              onClick={() => setSelectedLog(log)}
              type="button"
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                width: '100%',
                appearance: 'none',
                font: 'inherit',
                color: 'inherit',
              }}
            >
              <div className="data-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className={`badge ${actionBadge(log.action)}`}>{log.action}</span>
                  <p
                    className="data-card-subtitle"
                    style={{ marginTop: 6, fontSize: 12 }}
                  >
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
                {log.amount && (
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--admin-text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                    }}
                  >
                    ₦{log.amount.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="data-card-grid">
                <div className="data-card-field">
                  <span className="data-card-label">Admin</span>
                  <span className="data-card-value mono" style={{ fontSize: 12 }}>
                    {log.admin_id.slice(0, 12)}…
                  </span>
                </div>
                {log.target_user && (
                  <div className="data-card-field">
                    <span className="data-card-label">Target</span>
                    <span className="data-card-value mono" style={{ fontSize: 12 }}>
                      {log.target_user.slice(0, 12)}…
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </>
  )
}
