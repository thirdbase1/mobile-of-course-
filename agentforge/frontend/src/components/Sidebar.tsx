'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { getSessions, createSession, deleteSession } from '@/lib/api'
import {
  Plus,
  MessageSquare,
  Trash2,
  History,
  Menu,
  X
} from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar() {
  const { sessions, setSessions, upsertSession, removeSession, model } = useStore()
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
    <div className="flex flex-col h-full bg-card border-r border-border w-64 pt-4">
      <div className="px-4 mb-6">
        <button
          onClick={newSession}
          className="w-full flex items-center gap-2 justify-center py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-6 no-scrollbar pb-6">
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">History</span>
            <History className="w-3 h-3 text-muted-foreground opacity-40" />
          </div>
          <div className="space-y-0.5">
            {sessions.slice(0, 30).map(s => {
              const active = pathname === `/dashboard/session/${s.id}`
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/session/${s.id}`}
                  className={clsx(
                    "group flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-all relative",
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
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
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="md:hidden fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-[70]"
            >
               <div className="absolute right-4 top-4 z-50">
                 <button onClick={() => setMobileOpen(false)} className="p-2 bg-secondary rounded-full">
                   <X className="w-4 h-4" />
                 </button>
               </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="hidden md:block shrink-0">
        <SidebarContent />
      </div>
    </>
  )
}
