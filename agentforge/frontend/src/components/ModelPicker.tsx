'use client'

import { useState } from 'react'
import { Zap, ChevronDown } from 'lucide-react'
import { useStore, MODELS, Model } from '@/lib/store'
import clsx from 'clsx'

export default function ModelPicker() {
  const { selectedModel, setSelectedModel } = useStore()
  const [open, setOpen] = useState(false)
  const current = MODELS.find(m => m.id === selectedModel)!

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-bg-panel border border-bg-border hover:border-brand px-3 py-1.5 rounded-lg text-sm transition-colors"
      >
        {current.fast && <Zap size={12} className="text-accent-yellow" />}
        <span className="text-slate-200">{current.label}</span>
        <span className="text-slate-500 text-xs">{current.provider}</span>
        <ChevronDown size={13} className="text-slate-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-bg-panel border border-bg-border rounded-xl shadow-xl w-56 py-1 animate-slide-up">
            {MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedModel(m.id as Model); setOpen(false) }}
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-bg-surface transition-colors',
                  selectedModel === m.id ? 'text-brand' : 'text-slate-300'
                )}
              >
                <span className="flex items-center gap-2">
                  {m.fast && <Zap size={11} className="text-accent-yellow" />}
                  {m.label}
                </span>
                <span className="text-xs text-slate-500">{m.provider}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
