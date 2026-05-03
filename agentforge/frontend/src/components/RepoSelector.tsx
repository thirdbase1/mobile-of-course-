'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import clsx from 'clsx'

interface Props {
  value?:    string
  onChange:  (id: string | undefined) => void
  compact?:  boolean
}

export default function RepoSelector({ value, onChange, compact }: Props) {
  const { repos } = useStore()
  const [open, setOpen] = useState(false)
  const selected = repos.find(r => r.id === value)

  if (repos.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex items-center gap-2 bg-surface-3 border border-border hover:border-brand/40 rounded-lg text-xs transition-colors',
          compact ? 'px-2 py-1.5' : 'px-3 py-1.5'
        )}
      >
        <span className="text-text-muted text-sm">⎇</span>
        <span className={selected ? 'text-text-primary font-medium' : 'text-text-muted'}>
          {selected ? selected.name : 'No repo'}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-text-muted">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-surface-2 border border-border rounded-xl shadow-2xl min-w-52 py-1 animate-fade-up">
            <button
              onClick={() => { onChange(undefined); setOpen(false) }}
              className={clsx('w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-3 transition-colors', !value ? 'text-brand' : 'text-text-secondary')}
            >
              {!value ? '✓' : <span className="w-3"/>}
              <span>No repo</span>
            </button>
            <div className="border-t border-border my-1" />
            {repos.map(r => (
              <button
                key={r.id}
                onClick={() => { onChange(r.id); setOpen(false) }}
                className={clsx('w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-3 transition-colors', value === r.id ? 'text-brand' : 'text-text-primary')}
              >
                {value === r.id ? '✓' : <span className="w-3"/>}
                <span className="font-medium truncate">{r.name}</span>
                {r.private && <span className="text-text-muted text-[10px] ml-auto">private</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
