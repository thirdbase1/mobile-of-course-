'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Trash2, Loader2 } from 'lucide-react'

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

  // Load templates from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pricingTemplates')
    if (saved) {
      setTemplates(JSON.parse(saved))
    }
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
      alert('Template saved!')
    }, 300)
  }

  const deleteTemplate = (id: string) => {
    if (!confirm('Delete this template?')) return
    const updated = templates.filter(t => t.id !== id)
    setTemplates(updated)
    localStorage.setItem('pricingTemplates', JSON.stringify(updated))
  }

  return (
    <div className="space-y-6">
      {/* Save New Template */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Create New Template</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Template Name</label>
            <Input
              placeholder="e.g. Standard +50, Premium +25%"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMarkupType('fixed')}
                  className={`flex-1 py-2 px-3 rounded border font-medium transition ${
                    markupType === 'fixed'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                >
                  Fixed
                </button>
                <button
                  onClick={() => setMarkupType('percentage')}
                  className={`flex-1 py-2 px-3 rounded border font-medium transition ${
                    markupType === 'percentage'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Value</label>
              <Input
                type="number"
                placeholder="e.g. 50 or 25"
                value={markupValue}
                onChange={(e) => setMarkupValue(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={saveTemplate}
            disabled={saving || !templateName.trim() || !markupValue}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Templates List */}
      {templates.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Saved Templates ({templates.length})</h3>
          <div className="grid gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{template.name}</p>
                  <p className="text-sm text-slate-500">
                    {template.markupType === 'fixed' ? '₦' : ''}{template.markupValue}
                    {template.markupType === 'percentage' ? '%' : ''}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onApplyTemplate(template.markupType, template.markupValue)
                      alert('Template settings applied to bulk form')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Use
                  </Button>
                  <Button
                    onClick={() => deleteTemplate(template.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-slate-600">No templates yet. Create one above to save time on repetitive markups!</p>
        </div>
      )}
    </div>
  )
}
