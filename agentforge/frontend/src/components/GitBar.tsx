'use client'
import { useState } from 'react'
import { createPR, getBranches, listFiles } from '@/lib/api'
import { useStore } from '@/lib/store'
import clsx from 'clsx'

interface Props {
  repoId:   string
  repoFull: string
  branch:   string
}

export default function GitBar({ repoId, repoFull, branch }: Props) {
  const { repos, setRepos, openFileTabs, setOpenFileTabs } = useStore()
  const [syncing, setSyncing]  = useState(false)
  const [prOpen,  setPrOpen]   = useState(false)
  const [prForm,  setPrForm]   = useState({ title: '', body: '', head: branch, base: 'main' })
  const [prLoading, setPrLoading] = useState(false)
  const [prResult,  setPrResult]  = useState<string | null>(null)
  const [branches,  setBranches]  = useState<string[]>([])

  async function sync() {
    setSyncing(true)
    try {
      // Refresh branches list
      const bs = await getBranches(repoId)
      setBranches(bs.map((b: any) => b.name))
    } catch {}
    setSyncing(false)
  }

  async function openPrModal() {
    setPrOpen(true)
    setPrResult(null)
    try {
      const bs = await getBranches(repoId)
      setBranches(bs.map((b: any) => b.name))
    } catch {}
  }

  async function submitPR() {
    setPrLoading(true)
    try {
      const res = await createPR(repoId, prForm)
      setPrResult(`PR #${res.number} opened: ${res.url}`)
    } catch (e: any) {
      setPrResult('Error: ' + (e?.response?.data?.detail || e.message))
    } finally {
      setPrLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-text-muted text-[11px] bg-surface-3 border border-border rounded px-2 py-1">
          <span className="text-xs">⎇</span>
          <span className="font-mono">{branch}</span>
        </div>

        <button
          onClick={sync}
          disabled={syncing}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary bg-surface-3 border border-border hover:border-border-strong px-2.5 py-1.5 rounded-lg transition-colors"
          title="Sync — refresh branch info"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={clsx(syncing && 'animate-spin')}>
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Sync
        </button>

        <button
          onClick={openPrModal}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary bg-surface-3 border border-border hover:border-brand/40 px-2.5 py-1.5 rounded-lg transition-colors"
          title="Open a pull request"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
            <path d="M6 9v6M15.5 6.5l-9 9"/>
          </svg>
          New PR
        </button>
      </div>

      {/* PR Modal */}
      {prOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setPrOpen(false) }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-surface-2 border border-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm text-text-primary">Open Pull Request</h3>
              <button onClick={() => setPrOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {prResult ? (
              <div className="p-5">
                <div className={clsx(
                  'text-sm px-4 py-3 rounded-lg border',
                  prResult.startsWith('Error') ? 'bg-red/10 border-red/20 text-red' : 'bg-green/10 border-green/20 text-green'
                )}>
                  {prResult.startsWith('Error') ? prResult : (
                    <>
                      {prResult.split(': ')[0]}:<br/>
                      <a href={prResult.split(': ')[1]} target="_blank" className="underline text-brand break-all">
                        {prResult.split(': ')[1]}
                      </a>
                    </>
                  )}
                </div>
                <button onClick={() => setPrOpen(false)} className="mt-4 w-full bg-surface-3 border border-border hover:border-border-strong text-sm py-2 rounded-lg transition-colors text-text-secondary">
                  Close
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Title</label>
                  <input
                    value={prForm.title}
                    onChange={e => setPrForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="PR title"
                    className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-brand/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">From branch</label>
                    <select
                      value={prForm.head}
                      onChange={e => setPrForm(f => ({ ...f, head: e.target.value }))}
                      className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand/50 transition-colors"
                    >
                      {branches.length > 0 ? branches.map(b => <option key={b} value={b}>{b}</option>) : <option value={branch}>{branch}</option>}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">Into branch</label>
                    <select
                      value={prForm.base}
                      onChange={e => setPrForm(f => ({ ...f, base: e.target.value }))}
                      className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand/50 transition-colors"
                    >
                      {branches.length > 0 ? branches.map(b => <option key={b} value={b}>{b}</option>) : <option value="main">main</option>}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Description (optional)</label>
                  <textarea
                    value={prForm.body}
                    onChange={e => setPrForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Describe changes…"
                    rows={3}
                    className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-brand/50 transition-colors resize-none"
                  />
                </div>

                <button
                  onClick={submitPR}
                  disabled={!prForm.title.trim() || prLoading}
                  className="w-full bg-brand hover:opacity-90 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-semibold transition-opacity flex items-center justify-center gap-2"
                >
                  {prLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {prLoading ? 'Creating…' : 'Open Pull Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
