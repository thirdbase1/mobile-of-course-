'use client'

import { useStore } from '@/lib/store'
import { Bot, Zap, GitBranch, Terminal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createSession } from '@/lib/api'
import { MODELS } from '@/lib/store'
import ModelPicker from '@/components/ModelPicker'

const STARTERS = [
  'Build a REST API with FastAPI and write tests for every endpoint',
  'Clone my repo, find all TODO comments, and fix them one by one',
  'Create a Python web scraper that extracts data and saves to CSV',
  'Review my code for security issues and fix the critical ones',
  'Set up a CI/CD workflow with GitHub Actions for my project',
]

export default function DashboardHome() {
  const { user, selectedModel, sessions, setSessions, setActiveSession } = useStore()
  const router = useRouter()

  async function startSession(prompt?: string) {
    const s = await createSession({ title: prompt?.slice(0, 60) || 'New session', model: selectedModel })
    setSessions([s, ...sessions])
    setActiveSession(s)
    router.push(`/dashboard/session/${s.id}${prompt ? `?prompt=${encodeURIComponent(prompt)}` : ''}`)
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 py-12">
      <div className="w-14 h-14 bg-brand/10 border border-brand/30 rounded-2xl flex items-center justify-center mb-5">
        <Bot size={28} className="text-brand" />
      </div>

      <h1 className="text-2xl font-bold mb-2">
        {user ? `Hey ${user.login} 👋` : 'AgentForge'}
      </h1>
      <p className="text-slate-400 text-sm mb-8 text-center max-w-sm">
        Tell me what to build, fix, or explore. I'll write code, run it, and keep going until it's done.
      </p>

      <div className="flex items-center gap-3 mb-6">
        <ModelPicker />
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Zap size={11} className="text-accent-yellow" /> Groq = fastest</span>
          <span className="flex items-center gap-1"><GitBranch size={11} className="text-accent-green" /> GitHub connected</span>
          <span className="flex items-center gap-1"><Terminal size={11} className="text-accent-blue" /> Sandboxed exec</span>
        </div>
      </div>

      {/* Quick start input */}
      <form
        onSubmit={e => { e.preventDefault(); const v = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim(); if (v) startSession(v) }}
        className="w-full max-w-2xl mb-6"
      >
        <div className="flex gap-2 bg-bg-surface border border-bg-border rounded-xl p-2 focus-within:border-brand transition-colors">
          <input
            name="q"
            placeholder="What do you want me to build or fix?"
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder-slate-500"
          />
          <button type="submit" className="bg-brand hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Start
          </button>
        </div>
      </form>

      {/* Starter prompts */}
      <div className="w-full max-w-2xl">
        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Try one of these</p>
        <div className="grid grid-cols-1 gap-2">
          {STARTERS.map(s => (
            <button
              key={s}
              onClick={() => startSession(s)}
              className="text-left px-4 py-3 bg-bg-surface border border-bg-border hover:border-brand rounded-lg text-sm text-slate-300 hover:text-slate-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
