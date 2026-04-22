'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Trash2, ToggleRight } from 'lucide-react'

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
    if (!confirm('Are you sure you want to delete this rule?')) return

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

  return (
    <div className="table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Rule Type</th>
            <th>Value</th>
            <th>Min Amount</th>
            <th>Max Amount</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id}>
              <td className="font-semibold capitalize">{rule.service_type}</td>
              <td>
                <span className="badge badge-category">
                  {rule.rule_type === 'FIXED' ? '₦' : '%'}
                </span>
              </td>
              <td className="font-mono">
                {rule.rule_type === 'FIXED'
                  ? `₦${rule.value.toLocaleString()}`
                  : `${rule.value}%`}
              </td>
              <td className="text-sm">
                {rule.min_amount ? `₦${rule.min_amount.toLocaleString()}` : '-'}
              </td>
              <td className="text-sm">
                {rule.max_amount ? `₦${rule.max_amount.toLocaleString()}` : '-'}
              </td>
              <td>
                <span
                  className={`badge ${rule.is_active ? 'badge-success' : 'badge-inactive'}`}
                >
                  {rule.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="text-sm">{new Date(rule.created_at).toLocaleDateString()}</td>
              <td>
                <div className="action-buttons">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(rule.id, rule.is_active)}
                    disabled={toggling === rule.id}
                  >
                    <ToggleRight size={16} />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(rule.id)}
                    disabled={deleting === rule.id}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
