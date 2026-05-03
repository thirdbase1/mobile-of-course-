'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, Plus, MessageSquare, GitBranch, Settings, ChevronLeft, Trash2, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { getSessions, createSession, deleteSession } from '@/lib/api'
import clsx from 'clsx'

export default function Sidebar() {
  const { sessions, setSessions, activeSession, setActiveSession, sidebarOpen, setSidebarOpen, selectedModel } = useStore()
  const pathname = usePathname()

  useEffect(() => {
    getSessions().then(setSessions).catch(() => {})
  }, [])

  async function newSession() {
    try {
      const s = await createSession({ title: 'New session', model: selectedModel })
      setSessions([s, ...sessions])
      setActiveSession(s)
      window.location.href = `/dashboard/session/${s.id}`
    } catch {}
  }

  async function removeSession(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    await deleteSession(id).catch(() => {})
    setSessions(sessions.filter(s => s.id !== id))
    if (activeSession?.id === id) setActiveSession(null)
  }

  if (!sidebarOpen) return (
    <button
      onClick={() => setSidebarOpen(true)}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-20 bg-bg-panel border border-bg-border rounded-r-lg p-2 hover:border-brand transition-colors"
    >
      <Bot size={18} className="text-brand" />
    </button>
  )

  return (
    <aside className="w-60 bg-bg-surface border-r border-bg-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-bg-border flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center">
            <Bot size={15} className="text-white" />
          </div>
          <span className="font-bold text-sm">AgentForge</span>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* New session */}
      <div className="p-3">
        <button onClick={newSession} className="w-full flex items-center gap-2 bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand px-3 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} /> New Session
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <p className="text-xs text-slate-500 px-2 py-1 uppercase tracking-wider">Recent</p>
        {sessions.map(s => (
          <Link
            key={s.id}
            href={`/dashboard/session/${s.id}`}
            className={clsx(
              'group flex items-center gap-2 px-2 py-2 rounded-lg text-sm mb-0.5 transition-colors',
              pathname === `/dashboard/session/${s.id}`
                ? 'bg-brand/10 text-brand'
                : 'text-slate-300 hover:bg-bg-panel'
            )}
          >
            <MessageSquare size={14} className="shrink-0" />
            <span className="flex-1 truncate">{s.title}</span>
            {s.status === 'running' && <Loader2 size={12} className="animate-spin text-brand shrink-0" />}
            <button
              onClick={e => removeSession(e, s.id)}
              className="hidden group-hover:flex text-slate-500 hover:text-accent-red transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </Link>
        ))}
        {sessions.length === 0 && (
          <p className="text-slate-500 text-xs px-2 py-4 text-center">No sessions yet</p>
        )}
      </div>

      {/* Nav bottom */}
      <div className="border-t border-bg-border p-2 space-y-0.5">
        <Link href="/dashboard/repos" className={clsx('flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors', pathname.startsWith('/dashboard/repos') ? 'bg-brand/10 text-brand' : 'text-slate-400 hover:bg-bg-panel hover:text-slate-200')}>
          <GitBranch size={15} /> Repositories
        </Link>
        <Link href="/dashboard/settings" className={clsx('flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors', pathname === '/dashboard/settings' ? 'bg-brand/10 text-brand' : 'text-slate-400 hover:bg-bg-panel hover:text-slate-200')}>
          <Settings size={15} /> Settings
        </Link>
      </div>
    </aside>
  )
}
