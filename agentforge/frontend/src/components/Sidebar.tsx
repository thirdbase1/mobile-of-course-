'use client'
import { useState } from 'react'
import {
  Plus,
  MessageSquare,
  Settings,
  LogOut,
  Trash2,
  ChevronDown,
  GitPullRequest,
  LayoutGrid,
  Menu,
  ChevronUp,
  Box,
  Terminal,
  Activity,
  Layers,
  Search,
  Code2,
  FolderKanban
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useRouter, usePathname } from 'next/navigation'
import { createSession, deleteSession } from '@/lib/api'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, sessions, upsertSession, removeSession, model } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)

  async function newSession(type: 'blank' | 'github' | 'template') {
    if (type === 'github') {
        router.push('/dashboard/repos')
        setMobileOpen(false)
        setNewChatOpen(false)
        return;
    }
    const s = await createSession({ title: 'New operational session', model })
    upsertSession(s)
    router.push(`/dashboard/session/${s.id}`)
    setMobileOpen(false)
    setNewChatOpen(false)
  }

  async function del(e: React.MouseEvent, id: string) {
    e.preventDefault(); e.stopPropagation()
    await deleteSession(id).catch(() => {})
    removeSession(id)
    if (pathname === `/dashboard/session/${id}`) router.push('/dashboard')
  }

  const navItems = [
    { icon: Search, label: 'Global Search' },
    { icon: Activity, label: 'Active Sessions', active: pathname === '/dashboard', href: '/dashboard' },
    { icon: FolderKanban, label: 'Workspaces', active: pathname === '/dashboard/repos', href: '/dashboard/repos' },
    { icon: Layers, label: 'Architecture Logs' },
    { icon: Terminal, label: 'Sandbox Cluster' },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0c0c0e] text-[#a1a1aa] w-full border-r border-white/[0.05]">
      {/* Product Branding */}
      <div className="px-5 py-6 flex items-center gap-3 font-black text-lg tracking-tighter text-white uppercase border-b border-white/[0.02]">
        <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center">
            <Box className="w-5 h-5" />
        </div>
        GITCODE
      </div>

      {/* New Session Trigger */}
      <div className="px-4 pt-6 mb-4 relative">
        <div className="flex items-stretch rounded-xl overflow-hidden border border-white/5 bg-white/[0.03] hover:border-white/20 transition-all group">
          <button
            onClick={() => newSession('blank')}
            className="flex-1 flex items-center justify-center py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/80 hover:text-white transition-colors"
          >
            New Session
          </button>
          <div className="w-[1px] bg-white/[0.05]" />
          <button
            onClick={() => setNewChatOpen(!newChatOpen)}
            className="px-3 hover:bg-white/10 transition-colors"
          >
            <ChevronDown className={clsx("w-4 h-4 transition-transform", newChatOpen && "rotate-180")} />
          </button>
        </div>

        <AnimatePresence>
          {newChatOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNewChatOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-4 right-4 mt-2 bg-[#121214] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
              >
                <button onClick={() => newSession('blank')} className="w-full flex items-center gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors text-left text-white/60 hover:text-white">
                  <Plus className="w-4 h-4" /> Blank Operational State
                </button>
                <button onClick={() => newSession('github')} className="w-full flex items-center gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors text-left text-white/60 hover:text-white">
                  <GitPullRequest className="w-4 h-4" /> Sync GitHub Repository
                </button>
                <button onClick={() => newSession('template')} className="w-full flex items-center gap-4 px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors text-left text-white/60 hover:text-white">
                  <Code2 className="w-4 h-4" /> Deployment Template
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Main OS Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1 no-scrollbar">
        {navItems.map((item, idx) => (
          <Link
            key={idx}
            href={item.href || '#'}
            className={clsx(
              "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              item.active ? "bg-white/10 text-white shadow-xl" : "text-white/40 hover:bg-white/[0.02] hover:text-white"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}

        <div className="pt-8 pb-3 px-4 text-[9px] font-black uppercase tracking-[0.4em] text-white/10">Active Execution Chains</div>
        <div className="space-y-1">
          {sessions.slice(0, 15).map(s => {
            const active = pathname === `/dashboard/session/${s.id}`
            return (
              <Link
                key={s.id}
                href={`/dashboard/session/${s.id}`}
                className={clsx(
                  "group flex items-center gap-4 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all relative",
                  active ? "bg-white/5 text-white border border-white/5" : "text-white/30 hover:text-white"
                )}
              >
                <div className={clsx("w-1.5 h-1.5 rounded-full", active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-white/10")} />
                <span className="truncate flex-1">{s.title}</span>
                <button
                  onClick={e => del(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* OS Footer */}
      <div className="p-4 border-t border-white/[0.02]">
         <Link href="/dashboard/settings" className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-all border border-white/[0.02] hover:border-white/10">
            <img src={user?.avatar_url} className="w-7 h-7 rounded-lg border border-white/10" />
            <div className="flex-1 text-left">
                <div className="text-[10px] font-black text-white uppercase tracking-widest">{user?.name || user?.login}</div>
                <div className="text-[8px] text-white/20 uppercase tracking-[0.3em]">PRO OPS PLAN</div>
            </div>
         </Link>
      </div>
    </div>
  )

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-[100]">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[110]"
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-80 z-[120] shadow-[50px_0_100px_rgba(0,0,0,0.5)]"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="hidden md:block w-72 shrink-0 h-full">
        <SidebarContent />
      </div>
    </>
  )
}
