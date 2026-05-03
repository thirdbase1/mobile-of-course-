'use client'

import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff, Check } from 'lucide-react'
import { api } from '@/lib/api'

interface KeyField { id: string; label: string; provider: string; placeholder: string; required: boolean }

const KEY_FIELDS: KeyField[] = [
  { id: 'groq_api_key',        label: 'Groq API Key',        provider: 'groq.com',          placeholder: 'gsk_…',   required: true },
  { id: 'openrouter_api_key',  label: 'OpenRouter API Key',  provider: 'openrouter.ai',      placeholder: 'sk-or-…', required: false },
  { id: 'xai_api_key',         label: 'xAI / Grok API Key',  provider: 'x.ai',               placeholder: 'xai-…',   required: false },
  { id: 'judge0_api_key',      label: 'Judge0 API Key',      provider: 'judge0.com (RapidAPI)', placeholder: 'Rapid API key', required: false },
  { id: 'github_client_id',    label: 'GitHub OAuth Client ID',     provider: 'GitHub OAuth App', placeholder: 'Oauth2 Client ID', required: true },
  { id: 'github_client_secret',label: 'GitHub OAuth Client Secret', provider: 'GitHub OAuth App', placeholder: 'Client secret',   required: true },
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [show, setShow]     = useState<Record<string, boolean>>({})
  const [saved, setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/settings/keys').then(r => {
      setValues(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function save() {
    await api.post('/settings/keys', values)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">API keys are stored encrypted in the database, never in plain text.</p>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-xl divide-y divide-bg-border mb-4">
          {KEY_FIELDS.map(f => (
            <div key={f.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <label className="text-sm font-medium">{f.label}</label>
                  <p className="text-xs text-slate-500">{f.provider} {f.required && <span className="text-accent-red">· required</span>}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 flex bg-bg-base border border-bg-border rounded-lg overflow-hidden focus-within:border-brand transition-colors">
                  <input
                    type={show[f.id] ? 'text' : 'password'}
                    value={values[f.id] || ''}
                    onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                    placeholder={loading ? '…' : f.placeholder}
                    className="flex-1 bg-transparent px-3 py-2 text-sm outline-none font-mono"
                  />
                  <button
                    onClick={() => setShow(s => ({ ...s, [f.id]: !s[f.id] }))}
                    className="px-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {show[f.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={save}
          className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Keys</>}
        </button>

        <div className="mt-8 bg-bg-surface border border-bg-border rounded-xl p-4">
          <p className="text-sm font-medium mb-2">Where to get these keys</p>
          <ul className="space-y-1.5 text-sm text-slate-400">
            <li>• <strong className="text-slate-200">Groq</strong> — <a href="https://console.groq.com" target="_blank" className="text-brand hover:underline">console.groq.com</a> → API Keys → Create key (free tier available)</li>
            <li>• <strong className="text-slate-200">OpenRouter</strong> — <a href="https://openrouter.ai/keys" target="_blank" className="text-brand hover:underline">openrouter.ai/keys</a> → create key, add credits</li>
            <li>• <strong className="text-slate-200">xAI Grok</strong> — <a href="https://console.x.ai" target="_blank" className="text-brand hover:underline">console.x.ai</a> → API Keys</li>
            <li>• <strong className="text-slate-200">Judge0</strong> — <a href="https://rapidapi.com/judge0-official/api/judge0-ce" target="_blank" className="text-brand hover:underline">RapidAPI Judge0 CE</a> → Subscribe (free tier)</li>
            <li>• <strong className="text-slate-200">GitHub OAuth</strong> — GitHub → Settings → Developer Settings → OAuth Apps → New App (callback: <code className="bg-bg-base px-1 rounded text-xs">{typeof window !== 'undefined' ? window.location.origin : 'https://your-app.pxxl.app'}/auth/callback</code>)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
