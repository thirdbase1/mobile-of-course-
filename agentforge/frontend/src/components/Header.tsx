'use client'
import { useStore } from '@/lib/store'
import {
  GitBranch,
  Terminal,
  Settings,
  Cpu
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSession } from '@/lib/api'

export default function Header() {
  const { id } = useParams()
  const { model, user } = useStore()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    if (id) getSession(id as string).then(setSession).catch(() => {})
  }, [id])

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-md px-4 flex items-center justify-between z-40">
      <div className="flex items-center gap-6 overflow-hidden">
        <Link href="/dashboard" className="font-bold tracking-tighter text-lg shrink-0">AgentForge</Link>

        {id && session && (
          <div className="hidden md:flex items-center gap-4 text-xs font-medium border-l border-border pl-6 overflow-hidden">
             <div className="flex items-center gap-2 px-2 py-1 rounded bg-secondary/50 border border-border shrink-0">
               <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
               <span className="truncate max-w-[120px]">{session.repo?.full_name || 'No Repo'}</span>
             </div>

             <div className="flex items-center gap-2 px-2 py-1 rounded bg-secondary/50 border border-border shrink-0">
               <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
               <span>Sandbox: active</span>
             </div>

             <div className="flex items-center gap-2 px-2 py-1 rounded bg-secondary/50 border border-border shrink-0">
               <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
               <span>{model.split('/')[1]}</span>
             </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings"
          className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-4.5 h-4.5" />
        </Link>
        <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-secondary shrink-0">
          <img src={user?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  )
}
