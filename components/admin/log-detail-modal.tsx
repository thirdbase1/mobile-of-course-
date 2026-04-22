'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface LogDetailModalProps {
  log: any
  onClose: () => void
}

export function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Admin Action Details</h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body detail-grid">
          <div className="detail-item">
            <label>Log ID</label>
            <p className="font-mono text-sm">{log.id}</p>
          </div>

          <div className="detail-item">
            <label>Admin ID</label>
            <p className="font-mono text-sm">{log.admin_id}</p>
          </div>

          <div className="detail-item">
            <label>Action</label>
            <p className="font-semibold">{log.action}</p>
          </div>

          <div className="detail-item">
            <label>Target User</label>
            <p className="font-mono text-sm">{log.target_user || 'N/A'}</p>
          </div>

          <div className="detail-item">
            <label>Amount</label>
            <p className="font-mono">
              {log.amount ? `₦${log.amount.toLocaleString()}` : 'N/A'}
            </p>
          </div>

          <div className="detail-item">
            <label>Timestamp</label>
            <p>{new Date(log.created_at).toLocaleString()}</p>
          </div>

          {log.details && (
            <div className="detail-item full-width">
              <label>Details</label>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
