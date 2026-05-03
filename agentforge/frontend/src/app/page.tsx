'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [authed, setAuthed] = useState(false)
  useEffect(() => { if (localStorage.getItem('af_token')) setAuthed(true) }, [])

  return (
    <div className="min-h-screen bg-surface-0 text-text-primary flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center text-white text-sm font-bold">A</div>
          <span className="font-semibold text-text-primary">AgentForge</span>
        </div>
        {authed ? (
          <Link href="/dashboard" className="bg-brand hover:opacity-90 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-opacity">
            Dashboard →
          </Link>
        ) : (
          <a href="/api/backend/auth/github" className="flex items-center gap-2 bg-surface-3 border border-border hover:border-brand/50 text-text-primary px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            Sign in with GitHub
          </a>
        )}
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/25 text-brand text-xs px-3 py-1 rounded-full mb-8 font-medium">
          ⚡ Groq · OpenRouter · xAI · Judge0
        </div>

        <h1 className="text-[52px] leading-[1.08] font-bold mb-5 max-w-2xl tracking-tight">
          The AI agent that<br/>
          <span className="text-brand">actually ships code</span>
        </h1>

        <p className="text-text-secondary text-lg max-w-lg mb-10 leading-relaxed">
          Write, run, fix, commit — in one loop.
          Give it a task and it works until it's done.
        </p>

        <div className="flex gap-3 mb-20">
          <a href="/api/backend/auth/github" className="flex items-center gap-2 bg-brand hover:opacity-90 text-white px-6 py-3 rounded-xl font-semibold transition-opacity text-sm">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            Start with GitHub
          </a>
          <Link href="#how" className="flex items-center gap-2 bg-surface-3 border border-border hover:border-brand/40 px-6 py-3 rounded-xl font-semibold transition-colors text-sm text-text-secondary">
            How it works
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl w-full text-left">
          {[
            { icon: '⚙', title: 'Real execution', desc: 'Runs code in isolated sandboxes. Sees output. Fixes errors. Retries until it works.' },
            { icon: '🔀', title: 'GitHub native', desc: 'Import any repo. Read files, write files, create branches, open PRs — all via tool calls.' },
            { icon: '🔁', title: 'Agent loop', desc: 'Keeps going step by step until the task is done. Up to 20 iterations per message.' },
            { icon: '⚡', title: 'Fastest models', desc: 'Groq gives 900+ tokens/sec on LLaMA 3.3 70B. Switch to Claude or GPT-4o for harder tasks.' },
            { icon: '🛠', title: '11 tools', desc: 'Execute code, read/write/delete files, search repos, create branches, open PRs, fetch URLs.' },
            { icon: '📝', title: 'Code editor', desc: 'Browse and edit repo files in-browser while the agent works. All in one view.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-surface-2 border border-border rounded-xl p-5 hover:border-brand/30 transition-colors">
              <div className="text-xl mb-3">{icon}</div>
              <div className="font-semibold text-text-primary mb-1 text-sm">{title}</div>
              <div className="text-text-secondary text-sm leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-text-muted text-xs">
        AgentForge · Self-hosted · Deployable to pxxl.app
      </footer>
    </div>
  )
}
