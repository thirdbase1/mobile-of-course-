'use client'
import { useState, useEffect } from 'react'
import { getGithubRepos, importRepo, deleteRepo, createSession } from '@/lib/api'
import { useStore } from '@/lib/store'
import {
  GitBranch,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  Globe,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Terminal,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

export default function ReposPage() {
  const router = useRouter()
  const { repos, setRepos, upsertSession, model } = useStore()
  const [ghRepos, setGhRepos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState<string | null>(null)

  useEffect(() => {
    getGithubRepos()
      .then(setGhRepos)
      .finally(() => setLoading(false))
  }, [])

  async function handleImport(full_name: string) {
    setImporting(full_name)
    try {
      const r = await importRepo({ full_name })
      setRepos([...repos, r])
    } catch (err) {
      console.error(err)
    } finally {
      setImporting(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this repository?')) return
    await deleteRepo(id)
    setRepos(repos.filter(r => r.id !== id))
  }

  async function startChatWithRepo(repoId: string, repoName: string) {
    const s = await createSession({
        title: `Engineering: ${repoName}`,
        model,
        repo_id: repoId
    })
    upsertSession(s)
    router.push(`/dashboard/session/${s.id}`)
  }

  const filtered = ghRepos.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto bg-[#09090b]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-4">
                <Terminal className="w-3 h-3" />
                Infrastructure
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white mb-2">Repositories</h1>
            <p className="text-muted-foreground text-sm">Connect and manage your GitHub projects for AI-driven engineering.</p>
          </div>
        </div>

        {/* Import List */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl shadow-2xl mb-16 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your GitHub repositories..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-white placeholder:text-muted-foreground/30 font-medium"
            />
          </div>

          <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin mb-6 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Syncing with GitHub API...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-30">
                No matching repositories found.
              </div>
            ) : filtered.map(r => {
              const imported = repos.find(ir => ir.full_name === r.full_name)
              return (
                <div key={r.id} className="p-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors group">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                      <GitBranch className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <span className="font-bold text-sm text-white truncate">{r.full_name}</span>
                        {r.private ? <Lock className="w-3 h-3 text-muted-foreground/40" /> : <Globe className="w-3 h-3 text-muted-foreground/40" />}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground/50 flex items-center gap-2 uppercase tracking-widest">
                        <span>{r.language || 'Markdown'}</span>
                        <span className="opacity-20">•</span>
                        <span>Updated {new Date(r.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {imported ? (
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg bg-primary/5 border border-primary/10">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Imported
                    </div>
                  ) : (
                    <button
                      disabled={importing === r.full_name}
                      onClick={() => handleImport(r.full_name)}
                      className="px-5 py-2 bg-white text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-20 flex items-center gap-2 active:scale-95 shadow-lg shadow-white/5"
                    >
                      {importing === r.full_name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Import
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Imported Repos */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                Active Engineering Projects
            </h2>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {repos.length} Connected
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {repos.length === 0 ? (
              <div className="p-16 border border-dashed border-white/5 rounded-2xl text-center flex flex-col items-center justify-center opacity-30">
                <GitBranch className="w-10 h-10 mb-6" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Select a repository from GitHub to get started.</p>
              </div>
            ) : repos.map(repo => (
              <div key={repo.id} className="p-6 bg-[#18181b] border border-white/5 rounded-2xl flex items-center justify-between shadow-xl hover:border-white/10 transition-all group">
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-lg text-white truncate mb-1 tracking-tight group-hover:text-primary transition-colors">{repo.full_name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 opacity-60 font-medium">{repo.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center gap-3 ml-6">
                   <button
                    onClick={() => startChatWithRepo(repo.id, repo.name)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5 active:scale-95"
                   >
                     <MessageSquare className="w-3.5 h-3.5" />
                     Engineer
                   </button>
                   <div className="w-[1px] h-6 bg-white/5" />
                   <a
                    href={`https://github.com/${repo.full_name}`}
                    target="_blank"
                    className="p-2.5 hover:bg-white/5 rounded-xl text-muted-foreground hover:text-white transition-all border border-transparent hover:border-white/5"
                  >
                    <ExternalLink className="w-4.5 h-4.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(repo.id)}
                    className="p-2.5 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
