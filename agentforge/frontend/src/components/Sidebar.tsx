'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore, MODELS } from '@/lib/store'
import { getSessions, createSession, deleteSession } from '@/lib/api'
import {
  Plus,
  MessageSquare,
  Trash2,
  Search,
  Home,
  Briefcase,
  LayoutGrid,
  Palette,
  FileText,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  GitPullRequest,
  Zap,
  ChevronUp,
  X,
  Menu,
} from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar() {
  const { sessions, setSessions, upsertSession, removeSession, model, user } = useStore()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)

  useEffect(() => {
    getSessions().then(setSessions).catch(() => {})
  }, [])

  async function newSession(type: 'blank' | 'github' | 'template' = 'blank') {
    if (type === 'github') {
        router.push('/dashboard/repos')
        setMobileOpen(false)
        setNewChatOpen(false)
        return;
    }
    const s = await createSession({ title: 'New session', model })
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
    { icon: Search, label: 'Search' },
    { icon: Home, label: 'Home', active: pathname === '/dashboard', href: '/dashboard' },
    { icon: Briefcase, label: 'Projects', active: pathname === '/dashboard/repos', href: '/dashboard/repos' },
    { icon: MessageSquare, label: 'Chats' },
    { icon: LayoutGrid, label: 'Design Systems' },
    { icon: FileText, label: 'Templates' },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#09090b] text-[#a1a1aa] w-full border-r border-border/50">
      {/* Workspace Switcher */}
      <div className="px-3 pt-4 mb-2">
        <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
              {user?.name?.[0] || 'P'}
            </div>
            <span className="text-sm font-medium text-white">Personal</span>
          </div>
          <div className="flex flex-col gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
            <ChevronUp className="w-3 h-3" />
            <ChevronDown className="w-3 h-3 -mt-1.5" />
          </div>
        </button>
      </div>

      {/* New Chat Group */}
      <div className="px-3 mb-6 relative">
        <div className="flex items-stretch rounded-lg overflow-hidden border border-border/50 bg-[#18181b]">
          <button
            onClick={() => newSession('blank')}
            className="flex-1 flex items-center justify-center py-2 text-sm font-medium text-white hover:bg-white/5 transition-colors"
          >
            New Chat
          </button>
          <div className="w-[1px] bg-border/50" />
          <button
            onClick={() => setNewChatOpen(!newChatOpen)}
            className="px-2 hover:bg-white/5 transition-colors"
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
                className="absolute top-full left-3 right-3 mt-1 bg-[#18181b] border border-border/50 rounded-lg shadow-xl z-20 overflow-hidden"
              >
                <button onClick={() => newSession('blank')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left">
                  <Plus className="w-4 h-4" /> Blank Chat
                </button>
                <button onClick={() => newSession('github')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left">
                  <GitPullRequest className="w-4 h-4" /> Import from GitHub
                </button>
                <button onClick={() => newSession('template')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left">
                  <LayoutGrid className="w-4 h-4" /> Start from Template
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 no-scrollbar">
        {navItems.map((item, idx) => (
          <Link
            key={idx}
            href={item.href || '#'}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              item.active ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}

        <div className="pt-6 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Favorites</div>
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/5 group">
           <span className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
             Starred Projects
           </span>
           <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <div className="pt-6 pb-2 px-3 flex items-center justify-between">
           <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Recent Chats</span>
           <ChevronDown className="w-3 h-3 text-muted-foreground/30" />
        </div>

        <div className="space-y-0.5">
          {sessions.slice(0, 15).map(s => {
            const active = pathname === `/dashboard/session/${s.id}`
            return (
              <Link
                key={s.id}
                href={`/dashboard/session/${s.id}`}
                className={clsx(
                  "group flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors relative",
                  active ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center text-muted-foreground/40 group-hover:text-white/40">
                    <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span className="truncate flex-1">{s.title}</span>
                <button
                  onClick={e => del(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Link>
            )
          })}
          {sessions.length > 15 && (
            <button className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs hover:bg-white/5 text-muted-foreground/50 transition-colors">
              <MoreHorizontal className="w-3.5 h-3.5" /> More
            </button>
          )}
        </div>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-border/50">
         <Link href="/dashboard/settings" className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <img src={user?.avatar_url} className="w-6 h-6 rounded-full border border-white/10" />
            <div className="flex-1 text-left">
                <div className="text-xs font-medium text-white truncate">{user?.name || user?.login}</div>
                <div className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">Pro Plan</div>
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
          className="p-2 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-white"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-[120] shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="hidden md:block w-64 shrink-0 h-full">
        <SidebarContent />
      </div>
    </>
  )
}
