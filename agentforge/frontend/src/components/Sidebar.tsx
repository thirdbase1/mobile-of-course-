'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { getSessions, createSession, deleteSession } from '@/lib/api'
import clsx from 'clsx'

export default function Sidebar() {
  const { sessions, setSessions, upsertSession, removeSession, sidebarOpen, setSidebar, model } = useStore()
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    getSessions().then(setSessions).catch(() => {})
  }, [])

  async function newSession() {
    const s = await createSession({ title: 'New session', model })
    upsertSession(s)
    router.push(`/dashboard/session/${s.id}`)
  }

  async function del(e: React.MouseEvent, id: string) {
    e.preventDefault(); e.stopPropagation()
    await deleteSession(id).catch(() => {})
    removeSession(id)
    if (pathname === `/dashboard/session/${id}`) router.push('/dashboard')
  }

  if (!sidebarOpen) return (
    <button
      onClick={() => setSidebar(true)}
      className="w-10 shrink-0 flex flex-col items-center pt-4 gap-3 border-r border-border bg-surface-1"
    >
      <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center text-white text-xs font-bold">A</div>
      <span className="text-text-muted text-[10px] writing-mode-vertical" style={{writingMode:'vertical-lr',transform:'rotate(180deg)'}}>Sessions</span>
    </button>
  )

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-surface-1 border-r border-border">
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 bg-brand rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
          <span className="font-semibold text-sm truncate">AgentForge</span>
        </Link>
        <button onClick={() => setSidebar(false)} className="text-text-muted hover:text-text-primary transition-colors ml-1 shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      {/* New session */}
      <div className="p-2.5">
        <button onClick={newSession} className="w-full flex items-center gap-2 px-3 py-2 bg-brand/10 hover:bg-brand/15 border border-brand/25 text-brand rounded-lg text-xs font-medium transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Session
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {sessions.length === 0 ? (
          <p className="text-text-muted text-xs text-center py-6">No sessions yet</p>
        ) : sessions.map(s => {
          const active = pathname === `/dashboard/session/${s.id}`
          return (
            <Link
              key={s.id}
              href={`/dashboard/session/${s.id}`}
              className={clsx(
                'group flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs mb-0.5 transition-colors relative',
                active ? 'bg-brand/10 text-brand' : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
              )}
            >
              {s.status === 'running' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse shrink-0" />
              ) : s.status === 'error' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-red shrink-0" />
              ) : (
                <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', active ? 'bg-brand' : 'bg-surface-4')} />
              )}
              <span className="flex-1 truncate">{s.title}</span>
              {s.repo && <span className="shrink-0 text-text-muted text-[10px]">●</span>}
              <button
                onClick={e => del(e, s.id)}
                className="hidden group-hover:flex shrink-0 text-text-muted hover:text-red transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </Link>
          )
        })}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-border p-2 space-y-0.5">
        {[
          { href: '/dashboard/repos', label: 'Repositories', icon: '⎇' },
          { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors',
              pathname.startsWith(href) ? 'bg-surface-3 text-text-primary' : 'text-text-muted hover:bg-surface-3 hover:text-text-primary'
            )}
          >
            <span className="text-sm">{icon}</span> {label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
