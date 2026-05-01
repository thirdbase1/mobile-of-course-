'use client'

import { useState, useEffect } from 'react'
import { Save, Trash2 } from 'lucide-react'

interface Template {
  id: string
  name: string
  markupType: 'fixed' | 'percentage'
  markupValue: number
  createdAt: number
}

interface PricingTemplatesTabProps {
  onApplyTemplate: (markupType: 'fixed' | 'percentage', markupValue: number) => void
}

export function PricingTemplatesTab({ onApplyTemplate }: PricingTemplatesTabProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateName, setTemplateName] = useState('')
  const [markupType, setMarkupType] = useState<'fixed' | 'percentage'>('fixed')
  const [markupValue, setMarkupValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('pricingTemplates')
    if (saved) setTemplates(JSON.parse(saved))
  }, [])

  const saveTemplate = () => {
    if (!templateName.trim() || !markupValue) {
      alert('Please enter template name and value')
      return
    }

    setSaving(true)
    setTimeout(() => {
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: templateName,
        markupType,
        markupValue: parseFloat(markupValue),
        createdAt: Date.now(),
      }
      const updated = [...templates, newTemplate]
      setTemplates(updated)
      localStorage.setItem('pricingTemplates', JSON.stringify(updated))
      setTemplateName('')
      setMarkupValue('')
      setSaving(false)
    }, 200)
  }

  const deleteTemplate = (id: string) => {
    if (!confirm('Delete this template?')) return
    const updated = templates.filter((t) => t.id !== id)
    setTemplates(updated)
    localStorage.setItem('pricingTemplates', JSON.stringify(updated))
  }

  return (
    <div>
      {/* Create new template */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3>Create Template</h3>
            <p className="admin-card-subtitle">Save reusable markup presets</p>
          </div>
        </div>

        <div className="form-group">
          <label>Template Name</label>
          <input
            type="text"
            placeholder="e.g. Standard +50, Premium +25%"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setMarkupType('fixed')}
                className={`btn ${markupType === 'fixed' ? '' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                Fixed (₦)
              </button>
              <button
                type="button"
                onClick={() => setMarkupType('percentage')}
                className={`btn ${markupType === 'percentage' ? '' : 'btn-secondary'}`}
                style={{ flex: 1 }}
              >
                Percent (%)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Value</label>
            <input
              type="number"
              placeholder="e.g. 50 or 25"
              value={markupValue}
              onChange={(e) => setMarkupValue(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={saveTemplate}
          disabled={saving || !templateName.trim() || !markupValue}
          className="btn btn-success btn-block"
        >
          {saving ? (
            <>
              <div className="loading-spinner" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Template</span>
            </>
          )}
        </button>
      </div>

      {/* Templates list */}
      {templates.length > 0 ? (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Saved Templates ({templates.length})</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map((template) => (
              <div
                key={template.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 12,
                  background: 'var(--admin-bg-tertiary)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 'var(--radius-md)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 140 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--admin-text)' }}>{template.name}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--admin-text-tertiary)' }}>
                    {template.markupType === 'fixed' ? '+₦' : '+'}
                    {template.markupValue}
                    {template.markupType === 'percentage' ? '%' : ''}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyTemplate(template.markupType, template.markupValue)
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTemplate(template.id)}
                    className="btn btn-ghost btn-sm btn-icon"
                    style={{ color: 'var(--admin-danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No templates yet</h3>
          <p>Create one above to save time on repetitive markups</p>
        </div>
      )}
    </div>
  )
}
