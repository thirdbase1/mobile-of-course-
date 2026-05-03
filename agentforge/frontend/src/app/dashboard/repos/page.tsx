'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { getGithubRepos, importRepo, deleteRepo } from '@/lib/api'
import clsx from 'clsx'

export default function ReposPage() {
  const { repos, addRepo, removeRepo } = useStore()
  const [ghRepos,   setGhRepos]   = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [importing, setImporting] = useState<string | null>(null)
  const [search,    setSearch]    = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)

  useEffect(() => {
    getGithubRepos().then(setGhRepos).finally(() => setLoading(false))
  }, [])

  const imported = new Set(repos.map(r => r.full_name))
  const filtered = ghRepos
    .filter(r => !imported.has(r.full_name))
    .filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()))

  async function doImport(r: any) {
    setImporting(r.full_name)
    try {
      const res = await importRepo({ full_name: r.full_name, default_branch: r.default_branch || 'main' })
      addRepo(res)
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Import failed')
    } finally {
      setImporting(null)
    }
  }

  async function doDelete(id: string) {
    setDeleting(id)
    try {
      await deleteRepo(id)
      removeRepo(id)
    } catch {}
    setDeleting(null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-text-primary">Repositories</h1>
            <p className="text-text-muted text-xs mt-0.5">Import GitHub repos for the agent to read, edit, and commit to</p>
          </div>
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="flex items-center gap-2 bg-brand hover:opacity-90 text-white text-xs font-medium px-4 py-2 rounded-lg transition-opacity"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Import repo
          </button>
        </div>

        {/* Import panel */}
        {showPanel && (
          <div className="bg-surface-2 border border-border rounded-xl mb-5 overflow-hidden animate-fade-up">
            <div className="px-4 py-3 border-b border-border">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search your GitHub repositories…"
                autoFocus
                className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-brand/50 transition-colors"
              />
            </div>
            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-text-muted text-sm gap-2">
                  <span className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin"/>
                  Loading your repos…
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">
                  {search ? 'No repos match your search' : 'All your repos are already imported'}
                </p>
              ) : filtered.map(r => (
                <div
                  key={r.full_name}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-3 transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">{r.full_name}</span>
                      {r.private && <span className="text-[10px] text-text-muted bg-surface-4 px-1.5 py-0.5 rounded shrink-0">private</span>}
                    </div>
                    {r.description && <p className="text-xs text-text-muted mt-0.5 truncate">{r.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {r.language && <span className="text-[10px] text-text-muted">{r.language}</span>}
                      <span className="text-[10px] text-text-muted">⎇ {r.default_branch || 'main'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => doImport(r)}
                    disabled={importing === r.full_name}
                    className="flex items-center gap-1.5 text-xs bg-brand/10 hover:bg-brand/15 text-brand border border-brand/25 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  >
                    {importing === r.full_name
                      ? <span className="w-3 h-3 border border-brand/30 border-t-brand rounded-full animate-spin" />
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                    }
                    Import
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Imported repos */}
        {repos.length === 0 && !showPanel ? (
          <div className="bg-surface-2 border border-border rounded-xl p-10 text-center">
            <div className="text-3xl mb-3 opacity-30">⎇</div>
            <p className="text-text-secondary text-sm font-medium">No repos imported yet</p>
            <p className="text-text-muted text-xs mt-1">Import a GitHub repo so the agent can read, edit, and commit code</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {repos.map(r => (
              <div
                key={r.id}
                className="bg-surface-2 border border-border rounded-xl px-4 py-3.5 flex items-center gap-4 hover:border-border-strong transition-colors group"
              >
                <div className="w-9 h-9 bg-surface-3 rounded-lg flex items-center justify-center shrink-0 text-sm">
                  {r.private ? '🔒' : '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-text-primary truncate">{r.full_name}</span>
                    {r.private && <span className="text-[10px] text-text-muted bg-surface-3 px-1.5 py-0.5 rounded shrink-0">private</span>}
                  </div>
                  {r.description && <p className="text-xs text-text-muted mt-0.5 truncate">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    {r.language && <span className="text-[10px] text-text-muted">{r.language}</span>}
                    <span className="text-[10px] text-text-muted">⎇ {r.default_branch}</span>
                    <span className="text-[10px] text-text-muted">
                      Imported {new Date(r.imported_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <a
                    href={`https://github.com/${r.full_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-text-primary transition-colors"
                    title="Open on GitHub"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </a>
                  <button
                    onClick={() => doDelete(r.id)}
                    disabled={deleting === r.id}
                    className="text-text-muted hover:text-red transition-colors disabled:opacity-50"
                    title="Remove repo"
                  >
                    {deleting === r.id
                      ? <span className="w-3 h-3 border border-red/30 border-t-red rounded-full animate-spin block"/>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
