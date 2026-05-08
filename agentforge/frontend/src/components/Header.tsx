'use client'
import { useStore } from '@/lib/store'
import {
  GitBranch,
  Terminal,
  Settings,
  ChevronRight,
  Menu,
  Home,
  LogOut,
  FolderKanban
} from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSession } from '@/lib/api'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const { id } = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useStore()
  const [session, setSession] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (id) getSession(id as string).then(setSession).catch(() => {})
  }, [id])

  const logout = () => {
    localStorage.removeItem('af_token')
    router.push('/')
  }

  const isSettings = pathname === '/dashboard/settings'
  const isRepos = pathname === '/dashboard/repos'

  return (
    <header className="h-14 border-b border-white/5 bg-[#09090b]/90 backdrop-blur-xl px-4 flex items-center justify-between z-[100] sticky top-0">
      <div className="flex items-center gap-4">
        <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-white/5 rounded-lg text-white md:hidden"
        >
            <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Link href="/dashboard" className="hover:text-white transition-colors">AgentForge</Link>
                <ChevronRight className="w-3 h-3 opacity-20" />
                <span className="text-white truncate max-w-[200px]">
                    {isSettings ? 'Settings' : isRepos ? 'Repositories' : (session?.title || 'Engineer')}
                </span>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Sandbox Cluster Active
        </div>

        <div className="h-4 w-[1px] bg-white/10 hidden md:block" />

        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 group">
               <div className="text-right hidden md:block">
                  <div className="text-[10px] font-bold text-white leading-none mb-0.5">{user?.name || user?.login}</div>
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Authorized Engineer</div>
               </div>
               <img src={user?.avatar_url} alt="Profile" className="w-8 h-8 rounded-lg border border-white/10 group-hover:border-primary/40 transition-all shadow-lg" />
            </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[#09090b] border-r border-white/5 z-[120] p-6 flex flex-col shadow-2xl"
            >
               <div className="flex items-center gap-3 mb-10">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                      <Terminal className="w-5 h-5" />
                  </div>
                  <span className="font-black text-xl tracking-tighter text-white">AgentForge</span>
               </div>

               <nav className="flex-1 space-y-1">
                  {[
                    { icon: Home, label: 'Dashboard', href: '/dashboard' },
                    { icon: FolderKanban, label: 'Repositories', href: '/dashboard/repos' },
                    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={clsx(
                        "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                        pathname === item.href ? "bg-white/5 text-white shadow-inner" : "text-muted-foreground hover:bg-white/[0.02] hover:text-white"
                      )}
                    >
                      <item.icon className={clsx("w-5 h-5", pathname === item.href ? "text-primary" : "opacity-40")} />
                      {item.label}
                    </Link>
                  ))}
               </nav>

               <button
                onClick={logout}
                className="flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/5 transition-all mt-auto border border-white/5"
               >
                  <LogOut className="w-5 h-5 opacity-40" />
                  Sign Out
               </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
