'use client'

import { useState } from 'react'
import { createPricingRule, updatePricingRule, deletePricingRule } from '@/lib/actions/pricing'
import { Plus, Trash2 } from 'lucide-react'

interface PricingRule {
  id: string
  plan_name: string
  base_price: number
  markup_type: 'fixed' | 'percentage'
  markup_value: number
}

interface GsubzPlan {
  value: string
  displayName: string
  price: string
}

interface PricingBulkTabProps {
  rules: PricingRule[]
  gsubzPlans: GsubzPlan[]
  serviceId: string
  calculateFinalPrice: (rule: PricingRule) => number
  onSuccess: () => void
}

export function PricingBulkTab({
  rules,
  gsubzPlans,
  serviceId,
  calculateFinalPrice,
  onSuccess,
}: PricingBulkTabProps) {
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set())
  const [bulkFormData, setBulkFormData] = useState({
    markupType: 'fixed' as 'fixed' | 'percentage',
    markupValue: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set())
  const [bulkEditMarkupType, setBulkEditMarkupType] = useState<'fixed' | 'percentage'>('fixed')
  const [bulkEditMarkupValue, setBulkEditMarkupValue] = useState('')

  const togglePlanSelect = (planValue: string) => {
    const next = new Set(selectedPlans)
    next.has(planValue) ? next.delete(planValue) : next.add(planValue)
    setSelectedPlans(next)
  }

  const toggleSelectAllPlans = () => {
    setSelectedPlans(
      selectedPlans.size === gsubzPlans.length ? new Set() : new Set(gsubzPlans.map((p) => p.value))
    )
  }

  const toggleRuleSelect = (ruleId: string) => {
    const next = new Set(selectedRules)
    next.has(ruleId) ? next.delete(ruleId) : next.add(ruleId)
    setSelectedRules(next)
  }

  const toggleSelectAllRules = () => {
    setSelectedRules(
      selectedRules.size === rules.length ? new Set() : new Set(rules.map((r) => r.id))
    )
  }

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPlans.size === 0) return alert('Please select at least one plan')
    if (!bulkFormData.markupValue) return alert('Please enter a markup value')
    if (!confirm(`Create ${selectedPlans.size} pricing rule(s)?`)) return

    setSubmitting(true)
    const plansToCreate = Array.from(selectedPlans)
      .map((value) => gsubzPlans.find((p) => p.value === value))
      .filter(Boolean) as GsubzPlan[]

    try {
      const results = await Promise.all(
        plansToCreate.map((plan) =>
          createPricingRule(
            serviceId,
            plan.displayName,
            parseFloat(plan.price),
            bulkFormData.markupType,
            parseFloat(bulkFormData.markupValue)
          )
        )
      )
      const successful = results.filter((r) => r.success).length
      alert(`Created ${successful}/${plansToCreate.length} rules`)
      if (successful === plansToCreate.length) {
        setSelectedPlans(new Set())
        setBulkFormData({ markupType: 'fixed', markupValue: '' })
        onSuccess()
      }
    } catch (error) {
      alert('Error creating rules: ' + String(error))
    }
    setSubmitting(false)
  }

  const handleBulkUpdate = async () => {
    if (selectedRules.size === 0) return alert('Please select at least one rule')
    if (!bulkEditMarkupValue) return alert('Please enter a markup value')
    if (!confirm(`Update markup for ${selectedRules.size} rule(s)?`)) return

    setSubmitting(true)
    try {
      const results = await Promise.all(
        Array.from(selectedRules).map((ruleId) => {
          const rule = rules.find((r) => r.id === ruleId)
          if (!rule) return Promise.resolve({ success: false })
          return updatePricingRule(
            ruleId,
            rule.plan_name,
            rule.base_price,
            bulkEditMarkupType,
            parseFloat(bulkEditMarkupValue)
          )
        })
      )
      const successful = results.filter((r) => r.success).length
      alert(`Updated ${successful}/${selectedRules.size} rules`)
      if (successful === selectedRules.size) {
        setSelectedRules(new Set())
        setBulkEditMarkupValue('')
        onSuccess()
      }
    } catch (error) {
      alert('Error updating rules: ' + String(error))
    }
    setSubmitting(false)
  }

  const handleBulkDelete = async () => {
    if (selectedRules.size === 0) return alert('Please select at least one rule')
    if (!confirm(`Delete ${selectedRules.size} rule(s)? This cannot be undone.`)) return

    setSubmitting(true)
    try {
      const results = await Promise.all(
        Array.from(selectedRules).map((ruleId) => deletePricingRule(ruleId))
      )
      const successful = results.filter((r) => r.success).length
      alert(`Deleted ${successful}/${selectedRules.size} rules`)
      if (successful === selectedRules.size) {
        setSelectedRules(new Set())
        onSuccess()
      }
    } catch (error) {
      alert('Error deleting rules: ' + String(error))
    }
    setSubmitting(false)
  }

  return (
    <div>
      {/* CREATE RULES — Plan selector */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3>Bulk Create Markup Rules</h3>
            <p className="admin-card-subtitle">{selectedPlans.size} plan(s) selected</p>
          </div>
          <button
            type="button"
            onClick={toggleSelectAllPlans}
            className="btn btn-secondary btn-sm"
            disabled={gsubzPlans.length === 0}
          >
            {selectedPlans.size === gsubzPlans.length && gsubzPlans.length > 0
              ? 'Deselect All'
              : 'Select All'}
          </button>
        </div>

        {/* Plans list */}
        <div
          style={{
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--radius-md)',
            maxHeight: 280,
            overflowY: 'auto',
            marginBottom: 14,
            background: 'var(--admin-bg)',
          }}
        >
          {gsubzPlans.length === 0 ? (
            <p style={{ padding: 16, textAlign: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13 }}>
              No plans available
            </p>
          ) : (
            gsubzPlans.map((plan) => (
              <label
                key={plan.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--admin-border)',
                  cursor: 'pointer',
                  background: selectedPlans.has(plan.value) ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedPlans.has(plan.value)}
                  onChange={() => togglePlanSelect(plan.value)}
                  style={{ flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>
                    {plan.displayName}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--admin-text-tertiary)' }}>
                    ₦{Number(plan.price).toLocaleString()}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        <form onSubmit={handleBulkCreate}>
          <div className="form-row">
            <div className="form-group">
              <label>Markup Type</label>
              <select
                value={bulkFormData.markupType}
                onChange={(e) =>
                  setBulkFormData({ ...bulkFormData, markupType: e.target.value as 'fixed' | 'percentage' })
                }
                disabled={submitting}
              >
                <option value="fixed">Fixed Amount (₦)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Markup Value</label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={bulkFormData.markupValue}
                onChange={(e) => setBulkFormData({ ...bulkFormData, markupValue: e.target.value })}
                disabled={submitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || selectedPlans.size === 0}
            className="btn btn-block"
          >
            {submitting ? (
              <>
                <div className="loading-spinner" />
                <span>Creating {selectedPlans.size}...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Create {selectedPlans.size} Rules</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* EDIT/DELETE RULES SECTION */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3>Bulk Edit / Delete</h3>
            <p className="admin-card-subtitle">Select rules to update or delete in bulk</p>
          </div>
          {selectedRules.size > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleBulkUpdate}
                disabled={submitting || !bulkEditMarkupValue}
                className="btn btn-success btn-sm"
              >
                Update {selectedRules.size}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={submitting}
                className="btn btn-danger btn-sm"
              >
                Delete {selectedRules.size}
              </button>
            </div>
          )}
        </div>

        {selectedRules.size > 0 && (
          <div
            style={{
              padding: 14,
              background: 'var(--admin-info-bg)',
              border: '1px solid var(--admin-info-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 14,
            }}
          >
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>New Markup Type</label>
                <select
                  value={bulkEditMarkupType}
                  onChange={(e) => setBulkEditMarkupType(e.target.value as 'fixed' | 'percentage')}
                  disabled={submitting}
                >
                  <option value="fixed">Fixed Amount (₦)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>New Markup Value</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={bulkEditMarkupValue}
                  onChange={(e) => setBulkEditMarkupValue(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        )}

        {/* Rules list */}
        {rules.length === 0 ? (
          <div className="empty-state">
            <h3>No rules yet</h3>
            <p>Create some pricing rules to manage them in bulk</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={selectedRules.size === rules.length}
                onChange={toggleSelectAllRules}
              />
              <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)', fontWeight: 500 }}>
                Select all ({selectedRules.size}/{rules.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rules.map((rule) => {
                const checked = selectedRules.has(rule.id)
                const finalPrice = calculateFinalPrice(rule)
                return (
                  <label
                    key={rule.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: checked ? 'rgba(14, 165, 233, 0.08)' : 'var(--admin-bg-tertiary)',
                      border: `1px solid ${checked ? 'var(--admin-secondary)' : 'var(--admin-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRuleSelect(rule.id)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--admin-text)' }}>
                        {rule.plan_name}
                      </p>
                      <p
                        style={{
                          margin: '4px 0 0 0',
                          fontSize: 12,
                          color: 'var(--admin-text-tertiary)',
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>Base: ₦{rule.base_price.toLocaleString()}</span>
                        <span>·</span>
                        <span>
                          Markup: {rule.markup_type === 'fixed' ? '+₦' : '+'}
                          {rule.markup_value}
                          {rule.markup_type === 'percentage' ? '%' : ''}
                        </span>
                      </p>
                    </div>
                    <div
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontWeight: 700,
                        color: 'var(--admin-success)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ₦{finalPrice.toLocaleString()}
                    </div>
                  </label>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
