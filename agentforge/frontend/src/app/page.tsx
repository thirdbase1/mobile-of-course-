'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Github, Code2, GitBranch, Bot, Terminal, ArrowRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  const [authed, setAuthed] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('af_token')) setAuthed(true)
  }, [])

  return (
    <div className="min-h-screen bg-bg-base text-slate-200 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-bg-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg">AgentForge</span>
        </div>
        <div className="flex items-center gap-3">
          {authed ? (
            <Link href="/dashboard" className="bg-brand hover:bg-brand-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Open Dashboard
            </Link>
          ) : (
            <a href="/api/backend/auth/github" className="flex items-center gap-2 bg-bg-panel border border-bg-border hover:border-brand px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Github size={16} /> Sign in with GitHub
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/30 text-brand text-xs px-3 py-1 rounded-full mb-6">
          <Zap size={12} /> Powered by Groq · OpenRouter · xAI Grok
        </div>

        <h1 className="text-5xl font-bold mb-4 leading-tight max-w-3xl">
          AI Agent that actually
          <span className="text-brand"> runs your code</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mb-10 leading-relaxed">
          Give it a task. It writes code, executes it, fixes errors, commits to GitHub, 
          and keeps going until the job is done — just like a real engineer.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <a href="/api/backend/auth/github" className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-light text-white px-6 py-3 rounded-lg font-medium transition-colors">
            <Github size={18} /> Start with GitHub <ArrowRight size={16} />
          </a>
          <Link href="#how" className="flex items-center justify-center gap-2 bg-bg-panel border border-bg-border hover:border-brand px-6 py-3 rounded-lg font-medium transition-colors">
            See how it works
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
          {[
            { icon: Terminal, title: 'Real Code Execution', desc: 'Runs Python, JS, Bash in isolated sandboxes. Sees the output and fixes its own errors.' },
            { icon: GitBranch, title: 'GitHub Integration', desc: 'Import any repo with one click. Agent commits, pushes, and opens PRs on your behalf.' },
            { icon: Bot, title: 'Long-Running Agent Loop', desc: 'Keeps working step by step. Picks up where it left off if interrupted. Never forgets the plan.' },
            { icon: Zap, title: 'Multi-Model AI', desc: 'Groq for speed (900 tok/s), Claude/GPT-4o for complex tasks, Grok for web-aware work.' },
            { icon: Code2, title: 'Parallel Sub-Agents', desc: 'Spawns workers for independent subtasks. Merges results automatically. No manual switching.' },
            { icon: CheckCircle, title: 'Full History', desc: 'Every thought, tool call, and result is logged. Replay any session. Nothing is lost.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-bg-surface border border-bg-border rounded-xl p-5 text-left hover:border-brand/50 transition-colors">
              <div className="w-9 h-9 bg-brand/10 rounded-lg flex items-center justify-center mb-3">
                <Icon size={18} className="text-brand" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-bg-border px-6 py-4 text-center text-slate-500 text-sm">
        AgentForge · Open source · Deployable anywhere
      </footer>
    </div>
  )
}
