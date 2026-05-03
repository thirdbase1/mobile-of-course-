'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore, MODELS } from '@/lib/store'
import { createSession } from '@/lib/api'
import ModelPicker from '@/components/ModelPicker'
import RepoSelector from '@/components/RepoSelector'

const STARTERS = [
  { icon: '🔍', text: 'Review my repo for security issues and fix the critical ones' },
  { icon: '🧪', text: 'Write comprehensive tests for every function in this codebase' },
  { icon: '🚀', text: 'Set up GitHub Actions CI/CD for automated testing and deployment' },
  { icon: '🐛', text: 'Find all TODO and FIXME comments in my repo and fix them one by one' },
  { icon: '📦', text: 'Refactor this codebase to use modern best practices and patterns' },
  { icon: '📊', text: 'Build a REST API with FastAPI, add authentication, and write tests' },
]

export default function DashboardHome() {
  const { user, model, setModel, upsertSession, repos } = useStore()
  const [input,  setInput]  = useState('')
  const [repoId, setRepoId] = useState<string | undefined>()
  const [loading,setLoading]= useState(false)
  const router = useRouter()

  async function start(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setLoading(true)
    try {
      const title = content.slice(0, 70) + (content.length > 70 ? '…' : '')
      const s     = await createSession({ title, model, repo_id: repoId || null })
      upsertSession(s)
      router.push(`/dashboard/session/${s.id}?q=${encodeURIComponent(content)}`)
    } catch { setLoading(false) }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
      <div className="w-full max-w-2xl">
        {/* Greeting */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-brand/15 border border-brand/25 rounded-2xl flex items-center justify-center text-xl mx-auto mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {user ? `Hey ${user.login}` : 'AgentForge'}
          </h1>
          <p className="text-text-secondary text-sm">Tell me what to build, fix, or ship.</p>
        </div>

        {/* Config row */}
        <div className="flex items-center gap-2 mb-3">
          <ModelPicker />
          {repos.length > 0 && <RepoSelector value={repoId} onChange={setRepoId} />}
        </div>

        {/* Input */}
        <form onSubmit={e => { e.preventDefault(); start() }} className="mb-6">
          <div className="relative bg-surface-2 border border-border rounded-xl focus-within:border-brand/50 transition-colors">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); start() } }}
              placeholder="What do you want me to build or fix?"
              rows={3}
              className="w-full bg-transparent px-4 py-3.5 text-sm text-text-primary placeholder-text-muted outline-none resize-none leading-relaxed"
            />
            <div className="px-3 pb-3 flex justify-end">
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-brand hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg font-medium transition-opacity flex items-center gap-2"
              >
                {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '⚡'}
                Start agent
              </button>
            </div>
          </div>
        </form>

        {/* Starters */}
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Quick start</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STARTERS.map(s => (
              <button
                key={s.text}
                onClick={() => start(s.text)}
                className="flex items-start gap-3 text-left px-4 py-3 bg-surface-2 border border-border hover:border-brand/40 rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors group"
              >
                <span className="text-base mt-px shrink-0">{s.icon}</span>
                <span className="leading-snug">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
