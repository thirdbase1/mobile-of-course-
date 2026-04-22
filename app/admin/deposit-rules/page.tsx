'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
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

  // Load current rules
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

  // Example calculations for preview
  const examples = [
    { amount: 1000 },
    { amount: 2500 },
    { amount: 5000 },
    { amount: 10000 },
    { amount: 50000 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Deposit Rules</h1>
          <p className="text-slate-600 mt-2">Configure processing fees for user deposits</p>
          {rules && (
            <p className="text-xs text-slate-500 mt-2">
              Last updated: {new Date(rules.updated_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Message Alert */}
        {message && (
          <Alert className={message.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-emerald-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration Card */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">Fee Configuration</CardTitle>
              <CardDescription>Set up deposit processing fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Base Fee (₦)</label>
                <Input
                  type="number"
                  placeholder="50"
                  step="0.01"
                  value={formData.base_fee}
                  onChange={(e) => setFormData({ ...formData, base_fee: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">Flat fee applied to all deposits</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Percentage Fee (%)</label>
                <Input
                  type="number"
                  placeholder="1.5"
                  step="0.01"
                  value={formData.percentage_fee}
                  onChange={(e) => setFormData({ ...formData, percentage_fee: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">Applied to deposits above threshold</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Threshold Amount (₦)</label>
                <Input
                  type="number"
                  placeholder="2500"
                  step="1"
                  value={formData.threshold_amount}
                  onChange={(e) => setFormData({ ...formData, threshold_amount: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">Percentage fee applies when deposit exceeds this</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Fee (₦) - Optional</label>
                <Input
                  type="number"
                  placeholder="Leave empty for no cap"
                  step="0.01"
                  value={formData.max_fee}
                  onChange={(e) => setFormData({ ...formData, max_fee: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">Optional cap on total processing fee</p>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Rules
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Examples */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">Fee Preview</CardTitle>
              <CardDescription>Live preview with your current settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {examples.map((example) => {
                  // Always use CURRENT form values for live preview
                  const previewRules = {
                    base_fee: parseFloat(formData.base_fee || '50'),
                    percentage_fee: parseFloat(formData.percentage_fee || '1.5'),
                    threshold_amount: parseFloat(formData.threshold_amount || '2500'),
                    max_fee: formData.max_fee ? parseFloat(formData.max_fee) : null,
                  }

                  const calc = calculateDepositFee(example.amount, previewRules as DepositRules)

                  return (
                    <div key={example.amount} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-slate-900">Deposit: ₦{example.amount.toLocaleString()}</span>
                        <span className="text-sm font-semibold text-blue-600">Fee: ₦{calc.processingFee.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-slate-600 mb-1">{calc.breakdown}</div>
                      <div className="text-xs font-semibold text-emerald-700">
                        User receives: ₦{calc.netAmount.toLocaleString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Changes to these rules will be applied in real-time to all user deposit calculations.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
