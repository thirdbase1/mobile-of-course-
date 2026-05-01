'use client'

import { X, FileText } from 'lucide-react'

interface LogDetailModalProps {
  log: any
  onClose: () => void
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <span
        className={`detail-row-value ${mono ? 'mono' : ''}`}
        style={{ color: 'var(--admin-text)', fontWeight: 500 }}
      >
        {value}
      </span>
    </div>
  )
}

export function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <FileText size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: '-3px' }} />
            Action Details
          </h2>
          <button onClick={onClose} className="modal-close" type="button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h4 className="detail-section-title">Action</h4>
            <DetailRow label="Type" value={<span className="badge badge-info">{log.action}</span>} />
            <DetailRow
              label="Amount"
              value={log.amount ? `₦${log.amount.toLocaleString()}` : 'N/A'}
              mono
            />
            <DetailRow label="Timestamp" value={new Date(log.created_at).toLocaleString()} />
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">Identifiers</h4>
            <DetailRow label="Log ID" value={log.id} mono />
            <DetailRow label="Admin ID" value={log.admin_id} mono />
            <DetailRow label="Target User" value={log.target_user || 'N/A'} mono />
          </div>

          {log.details && (
            <div className="detail-section">
              <h4 className="detail-section-title">Raw Details</h4>
              <pre
                style={{
                  background: 'var(--admin-bg-tertiary)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 11,
                  color: 'var(--admin-text-secondary)',
                  overflow: 'auto',
                  maxHeight: 240,
                  fontFamily: 'var(--font-mono)',
                  margin: 0,
                }}
              >
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
