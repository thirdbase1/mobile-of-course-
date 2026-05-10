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
  Terminal,
  Box,
  Layers,
  Activity,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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

      const s = await createSession({
          title: `Project: ${r.name}`,
          model,
          repo_id: r.id
      })
      upsertSession(s)
      router.push(`/dashboard/session/${s.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setImporting(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this repository mapping?')) return
    await deleteRepo(id)
    setRepos(repos.filter(r => r.id !== id))
  }

  async function startChatWithRepo(repoId: string, repoName: string) {
    const s = await createSession({
        title: `Repo Ops: ${repoName}`,
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
    <div className="flex-1 overflow-y-auto bg-[#09090b] selection:bg-white selection:text-black">
      <div className="max-w-6xl mx-auto px-10 py-20">
        <header className="mb-20">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-6">
              <Layers className="w-3.5 h-3.5" /> Workspace Manager
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white mb-6 uppercase">Repositories</h1>
          <p className="text-white/40 text-lg font-bold tracking-tight uppercase max-w-2xl">Connect your GitHub architecture to the GITCODE autonomous execution loop.</p>
        </header>

        {/* GitHub Import Interface */}
        <section className="mb-32">
          <div className="flex items-center justify-between mb-10 border-b border-white/[0.05] pb-6">
            <h2 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
              <GitBranch className="w-6 h-6 text-white/40" />
              Source Control Registry
            </h2>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                {ghRepos.length} Projects Available
            </div>
          </div>

          <div className="bg-[#0c0c0e] border border-white/[0.05] rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-8 border-b border-white/[0.02] flex items-center gap-6 bg-white/[0.01]">
              <Search className="w-5 h-5 text-white/20" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter GitHub repositories..."
                className="flex-1 bg-transparent text-sm font-bold uppercase tracking-widest focus:outline-none text-white placeholder:text-white/10"
              />
            </div>

            <div className="divide-y divide-white/[0.02] max-h-[600px] overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="p-32 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin mb-8 text-white" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Synchronizing with GitHub API...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-32 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
                  No operational targets found in registry.
                </div>
              ) : filtered.map(r => {
                const imported = repos.find(ir => ir.full_name === r.full_name)
                return (
                  <div key={r.id} className="p-8 flex items-center justify-between hover:bg-white/[0.01] transition-all group">
                    <div className="flex items-center gap-8 min-w-0">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/[0.05] group-hover:border-white/20 group-hover:bg-white group-hover:text-black transition-all shrink-0">
                        <Box className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="font-black text-xl tracking-tighter text-white uppercase truncate">{r.full_name}</span>
                          {r.private ? <Lock className="w-3.5 h-3.5 text-white/20" /> : <Globe className="w-3.5 h-3.5 text-white/20" />}
                        </div>
                        <div className="text-[9px] font-black text-white/20 flex items-center gap-4 uppercase tracking-[0.2em]">
                          <span>{r.language || 'Native Engine'}</span>
                          <div className="w-1 h-1 rounded-full bg-white/10" />
                          <span>Last Operational Check: {new Date(r.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {imported ? (
                      <div className="flex items-center gap-3 text-white/20 font-black text-[10px] uppercase tracking-[0.2em] px-6 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <CheckCircle2 className="w-4 h-4 text-green-500/40" />
                        Mapped
                      </div>
                    ) : (
                      <button
                        disabled={importing === r.full_name}
                        onClick={() => handleImport(r.full_name)}
                        className="px-8 py-3.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all disabled:opacity-20 flex items-center gap-3 active:scale-95 shadow-2xl"
                      >
                        {importing === r.full_name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Map Repo
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Active Engineering Clusters */}
        <section>
          <div className="flex items-center justify-between mb-10 border-b border-white/[0.05] pb-6">
            <h2 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
              <Activity className="w-6 h-6 text-white/40" />
              Active Workspace Clusters
            </h2>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                {repos.length} Proxied Environments
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repos.length === 0 ? (
              <div className="col-span-full py-32 border border-dashed border-white/10 rounded-[3rem] text-center flex flex-col items-center justify-center opacity-20">
                <Terminal className="w-16 h-16 mb-8" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">No active workspace clusters initialized.</p>
              </div>
            ) : repos.map(repo => (
              <div key={repo.id} className="p-10 bg-white/[0.01] border border-white/[0.05] rounded-[2.5rem] flex items-center justify-between shadow-2xl hover:border-white/20 transition-all group">
                <div className="min-w-0 flex-1 pr-8">
                  <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-3 group-hover:text-white transition-colors">Cluster ID — {repo.id.split('-')[0]}</div>
                  <h3 className="font-black text-2xl text-white truncate mb-2 tracking-tighter uppercase">{repo.name}</h3>
                  <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest line-clamp-1">{repo.description || 'Environment telemetry: 100% functional.'}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                   <button
                    onClick={() => startChatWithRepo(repo.id, repo.name)}
                    className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-black hover:bg-white/90 transition-all shadow-2xl active:scale-95"
                   >
                     <ArrowRight className="w-7 h-7" />
                   </button>
                   <button
                    onClick={() => handleDelete(repo.id)}
                    className="p-4 hover:bg-red-500/10 rounded-2xl text-white/20 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
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
