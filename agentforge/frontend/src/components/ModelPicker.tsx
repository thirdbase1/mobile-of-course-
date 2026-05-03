'use client'
import { useState } from 'react'
import { useStore, MODELS } from '@/lib/store'
import clsx from 'clsx'

const PROVIDER_COLORS: Record<string, string> = {
  Groq:       'text-yellow',
  OpenRouter: 'text-blue',
  xAI:        'text-text-secondary',
}

export default function ModelPicker() {
  const { model, setModel } = useStore()
  const [open, setOpen] = useState(false)
  const cur = MODELS.find(m => m.id === model) ?? MODELS[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-surface-3 border border-border hover:border-brand/40 px-3 py-1.5 rounded-lg text-xs transition-colors"
      >
        <span className={clsx('font-medium text-[10px] px-1.5 py-0.5 rounded font-mono', PROVIDER_COLORS[cur.provider] || 'text-text-muted')}>
          {cur.provider.toUpperCase()}
        </span>
        <span className="text-text-primary font-medium">{cur.label}</span>
        <span className="text-text-muted text-[10px] bg-surface-4 px-1.5 py-0.5 rounded">{cur.badge}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-text-muted">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-surface-2 border border-border rounded-xl shadow-2xl w-64 py-1.5 animate-fade-up">
            {Object.entries(
              MODELS.reduce((acc, m) => {
                if (!acc[m.provider]) acc[m.provider] = []
                acc[m.provider].push(m)
                return acc
              }, {} as Record<string, typeof MODELS>)
            ).map(([provider, models]) => (
              <div key={provider}>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{provider}</div>
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setModel(m.id); setOpen(false) }}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-surface-3 transition-colors',
                      model === m.id ? 'text-brand' : 'text-text-primary'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {model === m.id && <span className="text-brand">✓</span>}
                      {model !== m.id && <span className="w-3" />}
                      <span className="font-medium">{m.label}</span>
                      {!m.tools && <span className="text-[9px] text-orange bg-orange/10 px-1.5 rounded">no tools</span>}
                    </div>
                    <span className="text-[10px] text-text-muted bg-surface-4 px-1.5 py-0.5 rounded">{m.badge}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
