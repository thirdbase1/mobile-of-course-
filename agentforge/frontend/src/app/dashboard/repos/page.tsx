'use client'
import { useState, useEffect } from 'react'
import { getGithubRepos, importRepo, deleteRepo } from '@/lib/api'
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
  ArrowLeft
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import clsx from 'clsx'

export default function ReposPage() {
  const { repos, setRepos } = useStore()
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

  const filtered = ghRepos.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Repositories</h1>
            <p className="text-muted-foreground">Manage your connected GitHub repositories.</p>
          </div>
          <Link href="/dashboard" className="p-2 hover:bg-secondary rounded-full transition-colors md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Import List */}
        <div className="bg-card border border-border rounded-xl shadow-sm mb-12">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search GitHub repositories..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>

          <div className="divide-y divide-border max-h-[400px] overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm">Fetching repositories from GitHub...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No repositories found.
              </div>
            ) : filtered.map(r => {
              const imported = repos.find(ir => ir.full_name === r.full_name)
              return (
                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2 bg-secondary rounded-lg">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{r.full_name}</span>
                        {r.private ? <Lock className="w-3 h-3 text-muted-foreground" /> : <Globe className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{r.language || 'Markdown'}</span>
                        <span>•</span>
                        <span>Updated {new Date(r.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {imported ? (
                    <div className="flex items-center gap-2 text-primary font-medium text-xs px-3 py-1.5 rounded-md bg-primary/10">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Imported
                    </div>
                  ) : (
                    <button
                      disabled={importing === r.full_name}
                      onClick={() => handleImport(r.full_name)}
                      className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
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
          <h2 className="text-xl font-bold mb-6">Imported to AgentForge</h2>
          <div className="grid grid-cols-1 gap-4">
            {repos.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground text-sm">
                No repositories imported yet.
              </div>
            ) : repos.map(repo => (
              <div key={repo.id} className="p-4 bg-card border border-border rounded-xl flex items-center justify-between shadow-sm">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate mb-1">{repo.full_name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{repo.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                   <a
                    href={`https://github.com/${repo.full_name}`}
                    target="_blank"
                    className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(repo.id)}
                    className="p-2 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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
