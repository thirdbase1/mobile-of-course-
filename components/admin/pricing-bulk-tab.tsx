'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createPricingRule, updatePricingRule, deletePricingRule } from '@/lib/actions/pricing'
import { Plus, Loader2, Edit2, Trash2, Save, X } from 'lucide-react'

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
  // State for creating new rules
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set())
  const [bulkFormData, setBulkFormData] = useState({
    markupType: 'fixed' as const,
    markupValue: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // State for editing rules
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set())
  const [bulkEditMarkupType, setBulkEditMarkupType] = useState<'fixed' | 'percentage'>('fixed')
  const [bulkEditMarkupValue, setBulkEditMarkupValue] = useState('')

  // Toggle individual plan selection
  const togglePlanSelect = (planValue: string) => {
    const newSelected = new Set(selectedPlans)
    if (newSelected.has(planValue)) {
      newSelected.delete(planValue)
    } else {
      newSelected.add(planValue)
    }
    setSelectedPlans(newSelected)
  }

  // Toggle all plans
  const toggleSelectAllPlans = () => {
    if (selectedPlans.size === gsubzPlans.length) {
      setSelectedPlans(new Set())
    } else {
      setSelectedPlans(new Set(gsubzPlans.map(p => p.value)))
    }
  }

  // Toggle individual rule selection
  const toggleRuleSelect = (ruleId: string) => {
    const newSelected = new Set(selectedRules)
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId)
    } else {
      newSelected.add(ruleId)
    }
    setSelectedRules(newSelected)
  }

  // Toggle all rules
  const toggleSelectAllRules = () => {
    if (selectedRules.size === rules.length) {
      setSelectedRules(new Set())
    } else {
      setSelectedRules(new Set(rules.map(r => r.id)))
    }
  }

  // Create multiple rules in parallel
  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedPlans.size === 0) {
      alert('Please select at least one plan')
      return
    }

    if (!bulkFormData.markupValue) {
      alert('Please enter a markup value')
      return
    }

    if (!confirm(`Create ${selectedPlans.size} pricing rule(s)?`)) {
      return
    }

    setSubmitting(true)

    const plansToCreate = Array.from(selectedPlans)
      .map(value => gsubzPlans.find(p => p.value === value))
      .filter(Boolean) as GsubzPlan[]

    // Create all rules in parallel
    const promises = plansToCreate.map(plan =>
      createPricingRule(
        serviceId,
        plan.displayName,
        parseFloat(plan.price),
        bulkFormData.markupType,
        parseFloat(bulkFormData.markupValue)
      )
    )

    try {
      const results = await Promise.all(promises)
      const successful = results.filter(r => r.success).length
      alert(`Created ${successful}/${plansToCreate.length} rules`)
      
      if (successful === plansToCreate.length) {
        setSelectedPlans(new Set())
        setBulkFormData({
          markupType: 'fixed',
          markupValue: '',
        })
        onSuccess()
      }
    } catch (error) {
      alert('Error creating rules: ' + String(error))
    }

    setSubmitting(false)
  }

  // Bulk update rules
  const handleBulkUpdate = async () => {
    if (selectedRules.size === 0) {
      alert('Please select at least one rule')
      return
    }

    if (!bulkEditMarkupValue) {
      alert('Please enter a markup value')
      return
    }

    if (!confirm(`Update markup for ${selectedRules.size} rule(s)?`)) {
      return
    }

    setSubmitting(true)

    // Update all selected rules in parallel
    const promises = Array.from(selectedRules).map(ruleId => {
      const rule = rules.find(r => r.id === ruleId)
      if (!rule) return Promise.resolve({ success: false })

      return updatePricingRule(
        ruleId,
        rule.plan_name,
        rule.base_price,
        bulkEditMarkupType,
        parseFloat(bulkEditMarkupValue)
      )
    })

    try {
      const results = await Promise.all(promises)
      const successful = results.filter(r => r.success).length
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

  // Bulk delete rules
  const handleBulkDelete = async () => {
    if (selectedRules.size === 0) {
      alert('Please select at least one rule')
      return
    }

    if (!confirm(`Delete ${selectedRules.size} rule(s)? This cannot be undone.`)) {
      return
    }

    setSubmitting(true)

    // Delete all selected rules in parallel
    const promises = Array.from(selectedRules).map(ruleId =>
      deletePricingRule(ruleId)
    )

    try {
      const results = await Promise.all(promises)
      const successful = results.filter(r => r.success).length
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
    <div className="space-y-8">
      {/* CREATE RULES SECTION - Same as Individual */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Available Plans */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden sticky top-6 h-fit">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Available Plans</h3>
              <p className="text-xs text-slate-600 mt-1">Select multiple to bulk create</p>
            </div>

            <div className="p-2 border-b border-slate-200">
              <button
                onClick={toggleSelectAllPlans}
                className="w-full text-left px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
              >
                {selectedPlans.size === gsubzPlans.length ? 'Deselect All' : 'Select All'} ({selectedPlans.size}/{gsubzPlans.length})
              </button>
            </div>

            <div className="overflow-y-auto max-h-[600px]">
              <div className="divide-y divide-slate-200">
                {gsubzPlans.map(plan => (
                  <div
                    key={plan.value}
                    onClick={() => togglePlanSelect(plan.value)}
                    className={`p-3 cursor-pointer hover:bg-slate-50 flex items-start gap-2 ${
                      selectedPlans.has(plan.value) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlans.has(plan.value)}
                      onChange={() => {}}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{plan.displayName}</p>
                      <p className="text-xs text-slate-500">₦{Number(plan.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Create Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Bulk Create Markup Rules</h3>
            <p className="text-sm text-slate-600 mb-6">{selectedPlans.size} plan(s) selected</p>

            <form onSubmit={handleBulkCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Markup Type</label>
                  <select
                    value={bulkFormData.markupType}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, markupType: e.target.value as any })}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed Amount (₦)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Markup Value</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={bulkFormData.markupValue}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, markupValue: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Preview selected plans - SHOW ALL */}
              {selectedPlans.size > 0 && bulkFormData.markupValue && (
                <div className="mt-4 p-4 bg-slate-50 rounded border border-slate-200 max-h-72 overflow-y-auto">
                  <p className="text-xs font-medium text-slate-700 mb-3 sticky top-0 bg-slate-50">Preview (All {selectedPlans.size} selected):</p>
                  <div className="space-y-2">
                    {Array.from(selectedPlans)
                      .map(value => {
                        const plan = gsubzPlans.find(p => p.value === value)
                        if (!plan) return null
                        const basePrice = parseFloat(plan.price)
                        const markup = parseFloat(bulkFormData.markupValue)
                        const finalPrice = bulkFormData.markupType === 'fixed' 
                          ? basePrice + markup 
                          : basePrice * (1 + markup / 100)
                        return (
                          <div key={plan.value} className="flex justify-between text-xs">
                            <span className="text-slate-600">{plan.displayName}</span>
                            <span className="font-mono text-slate-900">
                              ₦{basePrice.toLocaleString()} {`>`} ₦{(Math.round(finalPrice * 100) / 100).toLocaleString()}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || selectedPlans.size === 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Creating {selectedPlans.size} rules...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Create {selectedPlans.size} Rules
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* EDIT/DELETE RULES SECTION */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Bulk Edit/Delete Rules</h3>
            <p className="text-sm text-slate-600">Select multiple rules to update or delete</p>
          </div>
          <div className="flex gap-2">
            {selectedRules.size > 0 && (
              <>
                <Button
                  onClick={handleBulkUpdate}
                  disabled={submitting || !bulkEditMarkupValue}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1" />
                      Updating...
                    </>
                  ) : (
                    `Update ${selectedRules.size}`
                  )}
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  disabled={submitting}
                  variant="destructive"
                  size="sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1" />
                      Deleting...
                    </>
                  ) : (
                    `Delete ${selectedRules.size}`
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bulk Edit Controls */}
        {selectedRules.size > 0 && (
          <div className="bg-blue-50 border-b border-slate-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Markup Type</label>
                <select
                  value={bulkEditMarkupType}
                  onChange={(e) => setBulkEditMarkupType(e.target.value as any)}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fixed">Fixed Amount (₦)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Markup Value</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={bulkEditMarkupValue}
                  onChange={(e) => setBulkEditMarkupValue(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <Button
                onClick={() => {
                  setSelectedRules(new Set())
                  setBulkEditMarkupValue('')
                }}
                variant="outline"
                disabled={submitting}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRules.size === rules.length && rules.length > 0}
                    onChange={toggleSelectAllRules}
                    title={selectedRules.size === rules.length ? 'Deselect all' : 'Select all'}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Plan</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Base Price</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Markup</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Final Price</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-600">
                    No pricing rules yet
                  </td>
                </tr>
              ) : (
                rules.map(rule => (
                  <tr
                    key={rule.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                      selectedRules.has(rule.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRules.has(rule.id)}
                        onChange={() => toggleRuleSelect(rule.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{rule.plan_name}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">₦{rule.base_price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {rule.markup_type === 'fixed' ? '+₦' : '+'}
                      {rule.markup_value}
                      {rule.markup_type === 'percentage' ? '%' : ''}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      ₦{calculateFinalPrice(rule).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
