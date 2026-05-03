'use client'

import { useEffect, useState } from 'react'
import { GitBranch, Plus, Loader2, Lock, Unlock, ExternalLink, Trash2, RefreshCw } from 'lucide-react'
import { useStore } from '@/lib/store'
import { getRepos, importRepo, api } from '@/lib/api'

export default function ReposPage() {
  const { repos, setRepos } = useStore()
  const [ghRepos, setGhRepos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      getRepos().then(setRepos),
      api.get('/repos/github').then(r => setGhRepos(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  async function doImport(repo: any) {
    setImporting(repo.full_name)
    try {
      const r = await importRepo({ full_name: repo.full_name, default_branch: repo.default_branch })
      setRepos([r, ...repos])
      setShowImport(false)
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Import failed')
    } finally {
      setImporting(null)
    }
  }

  async function removeRepo(id: string) {
    await api.delete(`/repos/${id}`).catch(() => {})
    setRepos(repos.filter(r => r.id !== id))
  }

  const filtered = ghRepos.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  ).filter(r => !repos.some(ir => ir.full_name === r.full_name))

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Repositories</h1>
            <p className="text-slate-400 text-sm mt-0.5">Import GitHub repos for the agent to work on</p>
          </div>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Import Repo
          </button>
        </div>

        {/* Import panel */}
        {showImport && (
          <div className="bg-bg-surface border border-bg-border rounded-xl p-4 mb-6">
            <p className="text-sm font-medium mb-3">Your GitHub repositories</p>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search repositories…"
              className="w-full bg-bg-base border border-bg-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand mb-3 transition-colors"
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-6 text-slate-500">
                  <Loader2 size={18} className="animate-spin mr-2" /> Loading…
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">
                  {search ? 'No matches' : 'All repos already imported'}
                </p>
              ) : filtered.map(r => (
                <div key={r.full_name} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-panel transition-colors">
                  {r.private ? <Lock size={13} className="text-slate-500 shrink-0" /> : <Unlock size={13} className="text-slate-500 shrink-0" />}
                  <span className="flex-1 text-sm">{r.full_name}</span>
                  {r.language && <span className="text-xs text-slate-500">{r.language}</span>}
                  <button
                    onClick={() => doImport(r)}
                    disabled={importing === r.full_name}
                    className="flex items-center gap-1.5 text-xs bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {importing === r.full_name ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                    Import
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Imported repos */}
        <div className="space-y-3">
          {repos.length === 0 ? (
            <div className="bg-bg-surface border border-bg-border rounded-xl p-8 text-center">
              <GitBranch size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No repos imported yet</p>
              <p className="text-slate-600 text-xs mt-1">Import a repo so the agent can read, edit, and commit code</p>
            </div>
          ) : repos.map(r => (
            <div key={r.id} className="bg-bg-surface border border-bg-border rounded-xl p-4 flex items-center gap-4 hover:border-brand/50 transition-colors group">
              <div className="w-9 h-9 bg-bg-panel rounded-lg flex items-center justify-center shrink-0">
                <GitBranch size={17} className="text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{r.full_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">branch: {r.default_branch} · imported {new Date(r.imported_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={`https://github.com/${r.full_name}`} target="_blank" className="text-slate-400 hover:text-slate-200 transition-colors">
                  <ExternalLink size={15} />
                </a>
                <button onClick={() => removeRepo(r.id)} className="text-slate-500 hover:text-accent-red transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
