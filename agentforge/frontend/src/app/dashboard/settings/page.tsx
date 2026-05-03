'use client'
import { useState, useEffect } from 'react'
import { getKeys, saveKeys } from '@/lib/api'
import clsx from 'clsx'

const FIELDS = [
  {
    id:    'groq_api_key',
    label: 'Groq API Key',
    hint:  'Required for LLaMA 3.3 70B and Mixtral (fastest models)',
    link:  'https://console.groq.com/keys',
    linkLabel: 'console.groq.com',
    placeholder: 'gsk_…',
    required: true,
  },
  {
    id:    'openrouter_api_key',
    label: 'OpenRouter API Key',
    hint:  'For Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, and 100+ more models',
    link:  'https://openrouter.ai/keys',
    linkLabel: 'openrouter.ai/keys',
    placeholder: 'sk-or-…',
  },
  {
    id:    'xai_api_key',
    label: 'xAI (Grok) API Key',
    hint:  'For Grok-2 with web and X search capabilities',
    link:  'https://console.x.ai',
    linkLabel: 'console.x.ai',
    placeholder: 'xai-…',
  },
  {
    id:    'judge0_api_key',
    label: 'Judge0 API Key (RapidAPI)',
    hint:  'Enables sandboxed code execution in 40+ languages. Free tier: 100 req/day',
    link:  'https://rapidapi.com/judge0-official/api/judge0-ce',
    linkLabel: 'rapidapi.com → Judge0 CE',
    placeholder: 'RapidAPI key…',
  },
]

export default function SettingsPage() {
  const [values,  setValues]  = useState<Record<string, string>>({})
  const [show,    setShow]    = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    getKeys().then(v => { setValues(v); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      await saveKeys(values)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
    setSaving(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-text-primary">API Keys</h1>
          <p className="text-text-muted text-xs mt-0.5">Keys are stored in the database. You only need to provide AI provider keys — GitHub is already connected via OAuth.</p>
        </div>

        <div className="space-y-4 mb-6">
          {FIELDS.map(f => (
            <div key={f.id} className="bg-surface-2 border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-text-primary">{f.label}</label>
                    {f.required && <span className="text-[10px] text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded font-medium">required</span>}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{f.hint}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 flex bg-surface-1 border border-border rounded-lg overflow-hidden focus-within:border-brand/50 transition-colors">
                  <input
                    type={show[f.id] ? 'text' : 'password'}
                    value={values[f.id] || ''}
                    onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                    placeholder={loading ? '…' : f.placeholder}
                    disabled={loading}
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none font-mono"
                  />
                  <button
                    onClick={() => setShow(s => ({ ...s, [f.id]: !s[f.id] }))}
                    className="px-3 text-text-muted hover:text-text-primary transition-colors shrink-0"
                    tabIndex={-1}
                  >
                    {show[f.id]
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {values[f.id] && (
                  <button
                    onClick={() => setValues(v => ({ ...v, [f.id]: '' }))}
                    className="text-text-muted hover:text-red transition-colors px-2"
                    title="Clear"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
              <a href={f.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-brand hover:underline mt-1.5 inline-block">
                Get key → {f.linkLabel}
              </a>
            </div>
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className={clsx(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
            saved
              ? 'bg-green/15 text-green border border-green/25'
              : 'bg-brand hover:opacity-90 text-white disabled:opacity-50'
          )}
        >
          {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Keys'}
        </button>

        {/* GitHub OAuth info */}
        <div className="mt-8 bg-surface-2 border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">GitHub OAuth Setup</h3>
          <p className="text-xs text-text-muted mb-3 leading-relaxed">
            These are set as <strong className="text-text-secondary">environment variables</strong> on your backend (not here). Create a GitHub OAuth App and set these on pxxl:
          </p>
          <div className="space-y-2">
            {[
              ['GITHUB_CLIENT_ID',     'Your OAuth App client ID'],
              ['GITHUB_CLIENT_SECRET', 'Your OAuth App client secret'],
              ['FRONTEND_URL',         'Your frontend URL, e.g. https://agentforge.pxxl.app'],
              ['SECRET_KEY',           'Any random 64-char string (JWT signing)'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 text-xs">
                <code className="text-brand font-mono shrink-0">{k}</code>
                <span className="text-text-muted">{v}</span>
              </div>
            ))}
          </div>
          <a href="https://github.com/settings/developers" target="_blank" className="text-[11px] text-brand hover:underline mt-3 inline-block">
            Create OAuth App → github.com/settings/developers
          </a>
        </div>
      </div>
    </div>
  )
}
