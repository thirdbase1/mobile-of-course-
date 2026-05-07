'use client'
import { useStore } from '@/lib/store'
import {
  GitBranch,
  Shield,
  Terminal,
  Settings,
  Cpu,
  ChevronDown,
  Monitor,
  Cloud,
  ChevronRight,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSession } from '@/lib/api'
import clsx from 'clsx'

export default function Header() {
  const { id } = useParams()
  const pathname = usePathname()
  const { model, user } = useStore()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    if (id) getSession(id as string).then(setSession).catch(() => {})
  }, [id])

  // Don't show header on some pages or use a minimal version
  const isSettings = pathname === '/dashboard/settings'

  return (
    <header className="h-12 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md px-4 flex items-center justify-between z-40 sticky top-0">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Link href="/dashboard" className="hover:text-white transition-colors">Personal</Link>
            <ChevronRight className="w-3 h-3 opacity-30" />
            <span className="text-white truncate max-w-[150px]">
                {isSettings ? 'Settings' : (session?.title || 'New Chat')}
            </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Sandbox Active
        </div>

        <Link
          href="/dashboard/settings"
          className={clsx(
            "p-1.5 rounded-lg transition-colors",
            isSettings ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="w-4 h-4" />
        </Link>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        <button className="flex items-center gap-2 group">
           <img src={user?.avatar_url} alt="Profile" className="w-6 h-6 rounded-full border border-white/10 group-hover:border-white/30 transition-colors" />
        </button>
      </div>
    </header>
  )
}
