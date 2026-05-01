'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { createPricingRule, deletePricingRule, updatePricingRule } from '@/lib/actions/pricing'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { PricingBulkTab } from '@/components/admin/pricing-bulk-tab'
import { PricingTemplatesTab } from '@/components/admin/pricing-templates-tab'

interface GsubzPlan {
  displayName: string
  value: string
  price: string
}

interface PricingRule {
  id: string
  service_id: string
  plan_name: string
  base_price: number
  markup_type: 'fixed' | 'percentage'
  markup_value: number
  is_active: boolean
}

interface EditingRule {
  id: string
  planName: string
  basePrice: number
  markupType: 'fixed' | 'percentage'
  markupValue: number
}

const NETWORKS = [
  {
    name: 'MTN',
    types: [
      { value: 'mtn_sme', label: 'SME' },
      { value: 'mtn_datashare', label: 'Share' },
      { value: 'mtn_gifting', label: 'Gifting' },
      { value: 'mtn_awoof', label: 'AWOOF' },
    ],
  },
  {
    name: 'Glo',
    types: [
      { value: 'glo_data', label: 'Data' },
      { value: 'glo_sme', label: 'SME' },
    ],
  },
  {
    name: 'Airtel',
    types: [
      { value: 'airtel_sme', label: 'SME' },
      { value: 'airtel_gifting', label: 'Gifting' },
    ],
  },
  {
    name: '9mobile',
    types: [{ value: 'etisalat_data', label: '9mobile Data' }],
  },
]

const CABLE_SERVICES = [
  { id: 'dstv', name: 'DSTV' },
  { id: 'gotv', name: 'GOTV' },
  { id: 'startimes', name: 'Startimes' },
]

export default function PricingPage() {
  const [activeService, setActiveService] = useState<'data' | 'cable'>('data')
  const [activeNetwork, setActiveNetwork] = useState('MTN')
  const [activePlanType, setActivePlanType] = useState('mtn_sme')
  const [activeCableService, setActiveCableService] = useState('dstv')

  const [gsubzPlans, setGsubzPlans] = useState<GsubzPlan[]>([])
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGsubz, setLoadingGsubz] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingRule, setEditingRule] = useState<EditingRule | null>(null)
  const [formData, setFormData] = useState({
    planName: '',
    basePrice: '',
    markupType: 'fixed' as 'fixed' | 'percentage',
    markupValue: '',
  })
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk' | 'templates'>('individual')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const currentNetwork = NETWORKS.find((n) => n.name === activeNetwork)
  const currentCableService = CABLE_SERVICES.find((s) => s.id === activeCableService)

  const getPricingServiceId = useCallback((planTypeOrService: string) => {
    const serviceMap: Record<string, string> = {
      mtn_sme: 'mtn',
      mtn_datashare: 'mtn',
      mtn_gifting: 'mtn',
      mtn_awoof: 'mtn',
      glo_data: 'glo',
      glo_sme: 'glo',
      airtel_sme: 'airtel',
      airtel_gifting: 'airtel',
      etisalat_data: 'etisalat',
      dstv: 'dstv',
      gotv: 'gotv',
      startimes: 'startimes',
    }
    return serviceMap[planTypeOrService] || planTypeOrService
  }, [])

  const fetchGsubzPlans = useCallback(
    async (planTypeOrService: string) => {
      setLoadingGsubz(true)
      try {
        const type = activeService === 'data' ? 'DATA' : 'CABLE'
        const response = await fetch(`/api/gsubz/plans?service=${planTypeOrService}&type=${type}`)
        const data = await response.json()
        setGsubzPlans(data.plans || [])
      } catch (error) {
        console.error('[v0] Error fetching gsubz plans:', error)
        setGsubzPlans([])
      } finally {
        setLoadingGsubz(false)
      }
    },
    [activeService]
  )

  const fetchRules = useCallback(async () => {
    setLoading(true)
    try {
      const serviceId =
        activeService === 'data' ? getPricingServiceId(activePlanType) : getPricingServiceId(activeCableService)
      const { data } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      setRules(data || [])
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setLoading(false)
    }
  }, [activeService, activePlanType, activeCableService, getPricingServiceId, supabase])

  useEffect(() => {
    const planTypeOrService = activeService === 'data' ? activePlanType : activeCableService
    fetchGsubzPlans(planTypeOrService)
    fetchRules()
  }, [activeService, activePlanType, activeCableService, fetchGsubzPlans, fetchRules])

  useEffect(() => {
    if (currentNetwork && currentNetwork.types.length > 0) {
      setActivePlanType(currentNetwork.types[0].value)
    }
  }, [activeNetwork, currentNetwork])

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.planName || !formData.basePrice || formData.markupValue === '') {
      alert('Please fill in all fields')
      return
    }

    setSubmitting(true)
    const serviceId =
      activeService === 'data' ? getPricingServiceId(activePlanType) : getPricingServiceId(activeCableService)

    const result = await createPricingRule(
      serviceId,
      formData.planName,
      parseFloat(formData.basePrice),
      formData.markupType,
      parseFloat(formData.markupValue)
    )

    if (result.success) {
      setFormData({ planName: '', basePrice: '', markupType: 'fixed', markupValue: '' })
      fetchRules()
    } else {
      alert('Error: ' + result.error)
    }
    setSubmitting(false)
  }

  const handleUpdateRule = async () => {
    if (!editingRule) return
    setSubmitting(true)
    const result = await updatePricingRule(editingRule.id, {
      basePrice: editingRule.basePrice,
      markupType: editingRule.markupType,
      markupValue: editingRule.markupValue,
    })
    if (result.success) {
      setEditingRule(null)
      fetchRules()
    } else {
      alert('Error: ' + result.error)
    }
    setSubmitting(false)
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this pricing rule?')) return
    const result = await deletePricingRule(ruleId)
    if (result.success) {
      fetchRules()
    } else {
      alert('Error: ' + result.error)
    }
  }

  const calculateFinalPrice = (rule: PricingRule) => {
    return rule.markup_type === 'fixed'
      ? rule.base_price + rule.markup_value
      : rule.base_price * (1 + rule.markup_value / 100)
  }

  const handleSelectGsubzPlan = (plan: GsubzPlan) => {
    setFormData({
      planName: plan.displayName,
      basePrice: plan.price,
      markupType: 'fixed',
      markupValue: '0',
    })
  }

  const getServiceLabel = () => {
    if (activeService === 'data') {
      const planTypeLabel = currentNetwork?.types.find((t) => t.value === activePlanType)?.label || ''
      return `${activeNetwork} ${planTypeLabel}`
    }
    return currentCableService?.name || ''
  }

  const handleApplyTemplate = (markupType: 'fixed' | 'percentage', markupValue: number) => {
    setFormData((prev) => ({ ...prev, markupType, markupValue: String(markupValue) }))
    setActiveTab('individual')
  }

  const serviceId =
    activeService === 'data' ? getPricingServiceId(activePlanType) : getPricingServiceId(activeCableService)

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-row">
          <div>
            <h1>Pricing Management</h1>
            <p>Manage markup rules for data and cable services. Plans are fetched live from Gsubz.</p>
          </div>
        </div>
      </div>

      {/* Service type selector */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeService === 'data' ? 'active' : ''}`}
          onClick={() => setActiveService('data')}
        >
          Data Plans
        </button>
        <button
          type="button"
          className={`admin-tab ${activeService === 'cable' ? 'active' : ''}`}
          onClick={() => setActiveService('cable')}
        >
          Cable Plans
        </button>
      </div>

      {/* Network or cable service selector */}
      {activeService === 'data' ? (
        <>
          <div className="filter-chips">
            {NETWORKS.map((network) => (
              <button
                type="button"
                key={network.name}
                className={`filter-chip ${activeNetwork === network.name ? 'active' : ''}`}
                onClick={() => setActiveNetwork(network.name)}
              >
                {network.name}
              </button>
            ))}
          </div>

          {currentNetwork && currentNetwork.types.length > 1 && (
            <div className="filter-chips">
              {currentNetwork.types.map((type) => (
                <button
                  type="button"
                  key={type.value}
                  className={`filter-chip ${activePlanType === type.value ? 'active' : ''}`}
                  onClick={() => setActivePlanType(type.value)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="filter-chips">
          {CABLE_SERVICES.map((service) => (
            <button
              type="button"
              key={service.id}
              className={`filter-chip ${activeCableService === service.id ? 'active' : ''}`}
              onClick={() => setActiveCableService(service.id)}
            >
              {service.name}
            </button>
          ))}
        </div>
      )}

      {/* Service label */}
      <div
        style={{
          background: 'var(--admin-bg-secondary)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
          Editing: <strong style={{ color: 'var(--admin-text)' }}>{getServiceLabel()}</strong>
        </span>
        <span style={{ fontSize: 12, color: 'var(--admin-text-tertiary)' }}>
          {rules.length} rule{rules.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Action tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === 'individual' ? 'active' : ''}`}
          onClick={() => setActiveTab('individual')}
        >
          Individual
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          Bulk
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'individual' && (
        <>
          {/* Available Plans (collapsed/drawer style on mobile) */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3>Available Plans</h3>
                <p className="admin-card-subtitle">Tap to auto-fill the form</p>
              </div>
            </div>

            {loadingGsubz ? (
              <div className="loading-container" style={{ padding: 30 }}>
                <div className="loading-spinner" />
                <span>Loading plans...</span>
              </div>
            ) : gsubzPlans.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13, padding: 16 }}>
                No plans available for {getServiceLabel()}
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 8,
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {gsubzPlans.map((plan) => (
                  <button
                    type="button"
                    key={plan.value}
                    onClick={() => handleSelectGsubzPlan(plan)}
                    style={{
                      padding: 10,
                      background: 'var(--admin-bg-tertiary)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--admin-text)',
                      transition: 'all 150ms',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-secondary)'
                      e.currentTarget.style.background = 'var(--admin-bg-elevated)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)'
                      e.currentTarget.style.background = 'var(--admin-bg-tertiary)'
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{plan.displayName}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--admin-success)', fontWeight: 600 }}>
                      ₦{Number(plan.price).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add new rule form */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Add Markup Rule</h3>
            </div>
            <form onSubmit={handleAddRule}>
              <div className="form-row">
                <div className="form-group">
                  <label>Plan Name</label>
                  <input
                    type="text"
                    placeholder="e.g., 1GB Daily"
                    value={formData.planName}
                    onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label>Base Price (₦)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label>Markup Type</label>
                  <select
                    value={formData.markupType}
                    onChange={(e) => setFormData({ ...formData, markupType: e.target.value as 'fixed' | 'percentage' })}
                    disabled={submitting}
                  >
                    <option value="fixed">Fixed (₦)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Markup Value</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.markupValue}
                    onChange={(e) => setFormData({ ...formData, markupValue: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn btn-block">
                {submitting ? (
                  <>
                    <div className="loading-spinner" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Add Rule</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Existing rules */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h3>{getServiceLabel()} Rules</h3>
                <p className="admin-card-subtitle">{rules.length} active rules</p>
              </div>
            </div>

            {loading ? (
              <div className="loading-container" style={{ padding: 30 }}>
                <div className="loading-spinner" />
                <span>Loading rules...</span>
              </div>
            ) : rules.length === 0 ? (
              <div className="empty-state">
                <h3>No rules yet</h3>
                <p>Create one above to get started</p>
              </div>
            ) : (
              <div className="table-container">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Base Price</th>
                        <th>Markup</th>
                        <th>Final Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => (
                        <tr key={rule.id}>
                          <td style={{ fontWeight: 600 }}>{rule.plan_name}</td>
                          <td className="text-mono">₦{rule.base_price.toLocaleString()}</td>
                          <td>
                            {!editingRule || editingRule.id !== rule.id ? (
                              <span style={{ color: 'var(--admin-text-secondary)' }}>
                                {rule.markup_type === 'fixed' ? '+₦' : '+'}
                                {rule.markup_value}
                                {rule.markup_type === 'percentage' ? '%' : ''}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                value={editingRule.markupValue}
                                onChange={(e) =>
                                  setEditingRule({
                                    ...editingRule,
                                    markupValue: parseFloat(e.target.value) || 0,
                                  })
                                }
                                style={{
                                  width: 100,
                                  height: 32,
                                  padding: '0 8px',
                                  background: 'var(--admin-bg)',
                                  border: '1px solid var(--admin-secondary)',
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--admin-text)',
                                  fontSize: 13,
                                }}
                              />
                            )}
                          </td>
                          <td className="text-mono" style={{ fontWeight: 700, color: 'var(--admin-success)' }}>
                            ₦{calculateFinalPrice(rule).toLocaleString()}
                          </td>
                          <td>
                            <div className="action-buttons">
                              {!editingRule || editingRule.id !== rule.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingRule({
                                        id: rule.id,
                                        planName: rule.plan_name,
                                        basePrice: rule.base_price,
                                        markupType: rule.markup_type,
                                        markupValue: rule.markup_value,
                                      })
                                    }
                                    className="btn btn-ghost btn-icon"
                                    title="Edit"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="btn btn-ghost btn-icon"
                                    style={{ color: 'var(--admin-danger)' }}
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleUpdateRule}
                                    disabled={submitting}
                                    className="btn btn-success btn-sm btn-icon"
                                    title="Save"
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingRule(null)}
                                    disabled={submitting}
                                    className="btn btn-ghost btn-icon"
                                    title="Cancel"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="data-list" style={{ padding: 12 }}>
                  {rules.map((rule) => {
                    const isEditing = editingRule && editingRule.id === rule.id
                    return (
                      <div key={rule.id} className="data-card">
                        <div className="data-card-header">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 className="data-card-title">{rule.plan_name}</h3>
                            <p className="data-card-subtitle">Base: ₦{rule.base_price.toLocaleString()}</p>
                          </div>
                          <span
                            className="data-card-amount"
                            style={{ color: 'var(--admin-success)', fontSize: 16 }}
                          >
                            ₦{calculateFinalPrice(rule).toLocaleString()}
                          </span>
                        </div>

                        <div className="data-card-grid">
                          <div className="data-card-field">
                            <span className="data-card-label">Markup</span>
                            {!isEditing ? (
                              <span className="data-card-value">
                                {rule.markup_type === 'fixed' ? '+₦' : '+'}
                                {rule.markup_value}
                                {rule.markup_type === 'percentage' ? '%' : ''}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                value={editingRule.markupValue}
                                onChange={(e) =>
                                  setEditingRule({
                                    ...editingRule,
                                    markupValue: parseFloat(e.target.value) || 0,
                                  })
                                }
                                style={{
                                  height: 32,
                                  padding: '0 8px',
                                  background: 'var(--admin-bg)',
                                  border: '1px solid var(--admin-secondary)',
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--admin-text)',
                                  fontSize: 13,
                                  width: '100%',
                                }}
                              />
                            )}
                          </div>
                          <div className="data-card-field">
                            <span className="data-card-label">Type</span>
                            <span className="data-card-value">{rule.markup_type}</span>
                          </div>
                        </div>

                        <div className="data-card-actions">
                          {!isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingRule({
                                    id: rule.id,
                                    planName: rule.plan_name,
                                    basePrice: rule.base_price,
                                    markupType: rule.markup_type,
                                    markupValue: rule.markup_value,
                                  })
                                }
                                className="btn btn-secondary btn-sm"
                                style={{ flex: 1 }}
                              >
                                <Edit2 size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="btn btn-danger btn-sm btn-icon"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={handleUpdateRule}
                                disabled={submitting}
                                className="btn btn-success btn-sm"
                                style={{ flex: 1 }}
                              >
                                <Save size={14} />
                                <span>Save</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingRule(null)}
                                disabled={submitting}
                                className="btn btn-secondary btn-sm btn-icon"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'bulk' && (
        <PricingBulkTab
          rules={rules}
          gsubzPlans={gsubzPlans}
          serviceId={serviceId}
          calculateFinalPrice={calculateFinalPrice}
          onSuccess={fetchRules}
        />
      )}

      {activeTab === 'templates' && <PricingTemplatesTab onApplyTemplate={handleApplyTemplate} />}
    </div>
  )
}
