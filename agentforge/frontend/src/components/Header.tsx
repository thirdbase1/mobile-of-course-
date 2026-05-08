'use client'
import { useStore } from '@/lib/store'
import {
  ChevronRight,
  Settings,
  Terminal,
  LogOut,
  Home,
  FolderKanban
} from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSession } from '@/lib/api'
import clsx from 'clsx'

export default function Header() {
  const { id } = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useStore()
  const [session, setSession] = useState<any>(null)

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
            Sandbox Active
        </div>

        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 group">
               <img src={user?.avatar_url} alt="Profile" className="w-8 h-8 rounded-lg border border-white/10 group-hover:border-primary/40 transition-all shadow-lg" />
            </button>
        </div>
      </div>
    </header>
  )
}
