'use client'

import { useState, useEffect } from 'react'
import { Save, AlertCircle, CheckCircle2, Banknote, Info } from 'lucide-react'
import { getDepositRules, updateDepositRules } from '@/lib/actions/deposit-rules'
import { calculateDepositFee, type DepositRules } from '@/lib/utils/deposit-fee'

export default function DepositRulesPage() {
  const [rules, setRules] = useState<DepositRules | null>(null)
  const [formData, setFormData] = useState({
    base_fee: '',
    percentage_fee: '',
    threshold_amount: '',
    max_fee: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const loadRules = async () => {
      const data = await getDepositRules()
      if (data) {
        setRules(data)
        setFormData({
          base_fee: data.base_fee.toString(),
          percentage_fee: data.percentage_fee.toString(),
          threshold_amount: data.threshold_amount.toString(),
          max_fee: data.max_fee?.toString() || '',
        })
      }
      setLoading(false)
    }
    loadRules()
  }, [])

  // Auto-clear message after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const result = await updateDepositRules({
      base_fee: parseFloat(formData.base_fee),
      percentage_fee: parseFloat(formData.percentage_fee),
      threshold_amount: parseFloat(formData.threshold_amount),
      max_fee: formData.max_fee ? parseFloat(formData.max_fee) : null,
    })

    if (result.success && result.data) {
      setRules(result.data)
      setMessage({ type: 'success', text: 'Deposit rules updated successfully' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update rules' })
    }

    setSaving(false)
  }

  const examples = [{ amount: 1000 }, { amount: 2500 }, { amount: 5000 }, { amount: 10000 }, { amount: 50000 }]

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <span>Loading deposit rules...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-row">
          <div>
            <h1>Deposit Rules</h1>
            <p>Configure processing fees for user deposits</p>
            {rules && (
              <p style={{ fontSize: 11, color: 'var(--admin-text-tertiary)', marginTop: 6 }}>
                Last updated: {new Date(rules.updated_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'} style={{ marginBottom: 16 }}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Configuration Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>
                <Banknote size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Fee Configuration
              </h2>
              <p className="admin-card-subtitle">Set up deposit processing fees</p>
            </div>
          </div>

          <div className="form-group">
            <label>Base Fee (₦)</label>
            <input
              type="number"
              placeholder="50"
              step="0.01"
              value={formData.base_fee}
              onChange={(e) => setFormData({ ...formData, base_fee: e.target.value })}
            />
            <p className="form-help">Flat fee applied to all deposits</p>
          </div>

          <div className="form-group">
            <label>Percentage Fee (%)</label>
            <input
              type="number"
              placeholder="1.5"
              step="0.01"
              value={formData.percentage_fee}
              onChange={(e) => setFormData({ ...formData, percentage_fee: e.target.value })}
            />
            <p className="form-help">Applied to deposits above threshold</p>
          </div>

          <div className="form-group">
            <label>Threshold Amount (₦)</label>
            <input
              type="number"
              placeholder="2500"
              step="1"
              value={formData.threshold_amount}
              onChange={(e) => setFormData({ ...formData, threshold_amount: e.target.value })}
            />
            <p className="form-help">Percentage fee applies when deposit exceeds this</p>
          </div>

          <div className="form-group">
            <label>Maximum Fee (₦) — Optional</label>
            <input
              type="number"
              placeholder="Leave empty for no cap"
              step="0.01"
              value={formData.max_fee}
              onChange={(e) => setFormData({ ...formData, max_fee: e.target.value })}
            />
            <p className="form-help">Optional cap on total processing fee</p>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn btn-block" type="button" style={{ marginTop: 8 }}>
            {saving ? (
              <>
                <div className="loading-spinner" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Rules</span>
              </>
            )}
          </button>
        </div>

        {/* Preview */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Live Preview</h2>
              <p className="admin-card-subtitle">Calculated fees with current settings</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {examples.map((example) => {
              const previewRules = {
                base_fee: parseFloat(formData.base_fee || '50'),
                percentage_fee: parseFloat(formData.percentage_fee || '1.5'),
                threshold_amount: parseFloat(formData.threshold_amount || '2500'),
                max_fee: formData.max_fee ? parseFloat(formData.max_fee) : null,
              }
              const calc = calculateDepositFee(example.amount, previewRules as DepositRules)

              return (
                <div
                  key={example.amount}
                  style={{
                    background: 'var(--admin-bg-tertiary)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>
                      Deposit: ₦{example.amount.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-secondary)' }}>
                      Fee: ₦{calc.processingFee.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>
                    {calc.breakdown}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-success)' }}>
                    User receives: ₦{calc.netAmount.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--admin-info-bg)',
          border: '1px solid var(--admin-info-border)',
          color: '#93c5fd',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>Changes to these rules will be applied in real-time to all user deposit calculations.</span>
      </div>
    </div>
  )
}
