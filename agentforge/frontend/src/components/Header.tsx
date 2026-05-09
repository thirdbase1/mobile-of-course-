'use client'
import { useStore } from '@/lib/store'
import {
  ChevronRight,
  Activity,
  ShieldCheck,
  LayoutGrid,
  Box
} from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSession } from '@/lib/api'
import clsx from 'clsx'

export default function Header() {
  const { id } = useParams()
  const pathname = usePathname()
  const { user } = useStore()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    if (id) getSession(id as string).then(setSession).catch(() => {})
  }, [id])

  const isSettings = pathname === '/dashboard/settings'
  const isRepos = pathname === '/dashboard/repos'

  return (
    <header className="h-14 border-b border-white/[0.05] bg-[#09090b]/80 backdrop-blur-xl px-6 flex items-center justify-between z-[100] sticky top-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                <Link href="/dashboard" className="hover:text-white transition-colors">GITCODE</Link>
                <ChevronRight className="w-3 h-3 opacity-20" />
                <span className="text-white truncate max-w-[200px]">
                    {isSettings ? 'Environment Settings' : isRepos ? 'Workspace Repositories' : (session?.title || 'Operational Session')}
                </span>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            Active Sandbox
        </div>

        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">
            <ShieldCheck className="w-3 h-3 text-white/40" />
            Protected Session
        </div>

        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 group outline-none">
               <img src={user?.avatar_url} alt="Profile" className="w-7 h-7 rounded-lg border border-white/10 group-hover:border-white/40 transition-all shadow-xl" />
            </button>
        </div>
      </div>
    </header>
  )
}
