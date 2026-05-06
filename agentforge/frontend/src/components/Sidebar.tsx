'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { getSessions, createSession, deleteSession } from '@/lib/api'
import {
  Plus,
  MessageSquare,
  Settings,
  GitBranch,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  LayoutDashboard
} from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar() {
  const { sessions, setSessions, upsertSession, removeSession, sidebarOpen, setSidebar, model } = useStore()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    getSessions().then(setSessions).catch(() => {})
  }, [])

  async function newSession() {
    const s = await createSession({ title: 'New session', model })
    upsertSession(s)
    router.push(`/dashboard/session/${s.id}`)
    setMobileOpen(false)
  }

  async function del(e: React.MouseEvent, id: string) {
    e.preventDefault(); e.stopPropagation()
    await deleteSession(id).catch(() => {})
    removeSession(id)
    if (pathname === `/dashboard/session/${id}`) router.push('/dashboard')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border w-64">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            <Plus className="w-5 h-5 rotate-45" />
          </div>
          <span>AgentForge</span>
        </Link>
        <button
          onClick={() => setSidebar(!sidebarOpen)}
          className="hidden md:block text-muted-foreground hover:text-foreground transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* New Session Button */}
      <div className="px-4 mb-4">
        <button
          onClick={newSession}
          className="w-full flex items-center gap-2 justify-center py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Nav Sections */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 no-scrollbar">
        {/* Main Nav */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </div>
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/dashboard" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/repos"
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname.startsWith("/dashboard/repos") ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <GitBranch className="w-4 h-4" />
              Repositories
            </Link>
          </div>
        </div>

        {/* Recent Chats */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Chats</span>
            <History className="w-3 h-3 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            {sessions.slice(0, 15).map(s => {
              const active = pathname === `/dashboard/session/${s.id}`
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/session/${s.id}`}
                  className={clsx(
                    "group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all relative",
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{s.title}</span>
                  <button
                    onClick={e => del(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Link>
              )
            })}
            {sessions.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground italic">No chats yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Link
          href="/dashboard/settings"
          className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname.startsWith("/dashboard/settings") ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight">
           <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            <Plus className="w-4 h-4 rotate-45" />
          </div>
          <span>AgentForge</span>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="p-2 -mr-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-[70] md:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className={clsx(
        "hidden md:block transition-all duration-300 ease-in-out shrink-0",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <SidebarContent />
      </div>

      {!sidebarOpen && (
        <div className="hidden md:flex flex-col items-center py-4 w-14 border-r border-border bg-card shrink-0 gap-4">
           <button onClick={() => setSidebar(true)} className="p-2 text-muted-foreground hover:text-foreground">
            <PanelLeftOpen className="w-5 h-5" />
          </button>
          <div className="h-px w-8 bg-border" />
          <button onClick={newSession} className="p-2 bg-primary text-primary-foreground rounded-lg shadow-sm">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  )
}
