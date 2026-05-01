'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Trash2, Power } from 'lucide-react'

interface PricingRule {
  id: string
  network: string
  service_type: string
  rule_type: 'FIXED' | 'PERCENT'
  value: number
  min_amount: number | null
  max_amount: number | null
  is_active: boolean
  created_at: string
}

interface PricingRuleTableProps {
  rules: PricingRule[]
  onRuleUpdated: () => void
}

export function PricingRuleTable({ rules, onRuleUpdated }: PricingRuleTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Delete this rule?')) return
    setDeleting(ruleId)
    try {
      await supabase.from('pricing_rules').delete().eq('id', ruleId)
      onRuleUpdated()
    } finally {
      setDeleting(null)
    }
  }

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    setToggling(ruleId)
    try {
      await supabase
        .from('pricing_rules')
        .update({ is_active: !currentStatus })
        .eq('id', ruleId)
      onRuleUpdated()
    } finally {
      setToggling(null)
    }
  }

  if (!rules || rules.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Power />
        </div>
        <h3 className="empty-state-title">No pricing rules yet</h3>
        <p className="empty-state-text">
          Create your first rule using the form above
        </p>
      </div>
    )
  }

  return (
    <div className="table-container">
      {/* Desktop */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min</th>
              <th>Max</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {rule.service_type}
                </td>
                <td>
                  <span className="badge badge-info">
                    {rule.rule_type === 'FIXED' ? '₦ Fixed' : '% Percent'}
                  </span>
                </td>
                <td className="text-mono" style={{ fontWeight: 600 }}>
                  {rule.rule_type === 'FIXED'
                    ? `₦${rule.value.toLocaleString()}`
                    : `${rule.value}%`}
                </td>
                <td className="text-mono" style={{ fontSize: 13 }}>
                  {rule.min_amount ? `₦${rule.min_amount.toLocaleString()}` : '—'}
                </td>
                <td className="text-mono" style={{ fontSize: 13 }}>
                  {rule.max_amount ? `₦${rule.max_amount.toLocaleString()}` : '—'}
                </td>
                <td>
                  <span
                    className={`badge ${rule.is_active ? 'badge-success' : 'badge-inactive'}`}
                  >
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>
                  {new Date(rule.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className={`btn btn-ghost btn-icon`}
                      onClick={() => handleToggle(rule.id, rule.is_active)}
                      disabled={toggling === rule.id}
                      title={rule.is_active ? 'Deactivate' : 'Activate'}
                      type="button"
                    >
                      <Power size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-icon"
                      onClick={() => handleDelete(rule.id)}
                      disabled={deleting === rule.id}
                      title="Delete rule"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="data-list" style={{ padding: 12 }}>
        {rules.map((rule) => (
          <div key={rule.id} className="data-card">
            <div className="data-card-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="data-card-title" style={{ textTransform: 'capitalize' }}>
                  {rule.service_type}
                </h3>
                <p className="data-card-subtitle">
                  {rule.rule_type === 'FIXED' ? 'Fixed amount' : 'Percentage'}
                </p>
              </div>
              <span
                className={`badge ${rule.is_active ? 'badge-success' : 'badge-inactive'}`}
              >
                {rule.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="data-card-grid">
              <div className="data-card-field">
                <span className="data-card-label">Value</span>
                <span className="data-card-value mono" style={{ fontWeight: 700, color: 'var(--admin-secondary-light)' }}>
                  {rule.rule_type === 'FIXED'
                    ? `₦${rule.value.toLocaleString()}`
                    : `${rule.value}%`}
                </span>
              </div>
              <div className="data-card-field">
                <span className="data-card-label">Min — Max</span>
                <span className="data-card-value mono" style={{ fontSize: 12 }}>
                  {rule.min_amount ? `₦${rule.min_amount.toLocaleString()}` : '—'}
                  {' — '}
                  {rule.max_amount ? `₦${rule.max_amount.toLocaleString()}` : '∞'}
                </span>
              </div>
            </div>

            <div className="data-card-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleToggle(rule.id, rule.is_active)}
                disabled={toggling === rule.id}
                type="button"
                style={{ flex: 1 }}
              >
                <Power size={14} />
                <span>{rule.is_active ? 'Deactivate' : 'Activate'}</span>
              </button>
              <button
                className="btn btn-danger btn-sm btn-icon"
                onClick={() => handleDelete(rule.id)}
                disabled={deleting === rule.id}
                type="button"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
