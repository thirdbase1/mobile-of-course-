'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { createSession, importRepo } from '@/lib/api'
import {
  Plus,
  Search,
  GitBranch,
  Code2,
  Terminal,
  Zap,
  ArrowRight,
  Loader2,
  X,
  MessageSquarePlus
} from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardHome() {
  const { user, repos, setRepos, upsertSession, model } = useStore()
  const [loading, setLoading] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<any>(null)
  const [initialPrompt, setInitialPrompt] = useState('')
  const router = useRouter()

  async function startNewChat(repoId?: string, prompt?: string) {
    setLoading(true)
    try {
      const content = prompt?.trim() || "Analyze this repository and tell me what it does."
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
      const s = await createSession({
        title,
        model,
        repo_id: repoId || null
      })
      upsertSession(s)
      router.push(`/dashboard/session/${s.id}?q=${encodeURIComponent(content)}`)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight mb-4"
          >
            Welcome back, {user?.name || user?.login}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Select a repository to start a new engineering session.
          </motion.p>
        </header>

        {/* Quick Actions / New Session */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <motion.button
            whileHover={{ y: -4 }}
            onClick={() => startNewChat()}
            className="flex flex-col items-start p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="font-semibold mb-1">New Empty Chat</h3>
            <p className="text-sm text-muted-foreground">Start a conversation without a specific repository context.</p>
          </motion.button>

          <motion.button
            whileHover={{ y: -4 }}
            onClick={() => router.push('/dashboard/repos')}
            className="flex flex-col items-start p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="font-semibold mb-1">Import Repository</h3>
            <p className="text-sm text-muted-foreground">Connect a new GitHub repository to AgentForge.</p>
          </motion.button>

          <motion.div
            whileHover={{ y: -4 }}
            className="flex flex-col items-start p-6 rounded-xl border border-border bg-card transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold mb-1">Agent Status</h3>
            <p className="text-sm text-muted-foreground">System is online. High-capacity models available.</p>
          </motion.div>
        </div>

        {/* Repositories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Your Repositories
            </h2>
          </div>

          {repos.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-dashed border-border bg-secondary/20">
                <GitBranch className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground mb-6 text-center">No repositories imported yet.</p>
                <button
                  onClick={() => router.push('/dashboard/repos')}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Import your first repo
                </button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repos.map(repo => (
                <motion.div
                  key={repo.id}
                  layoutId={repo.id}
                  onClick={() => setSelectedRepo(repo)}
                  className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold truncate pr-2">{repo.name}</div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-3">
                    {repo.description || "No description provided."}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-secondary text-[10px] font-medium border border-border">
                      {repo.language || "Unknown"}
                    </span>
                    {repo.private && (
                       <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        🔒 Private
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Start Chat Modal */}
      <AnimatePresence>
        {selectedRepo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRepo(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div
              layoutId={selectedRepo.id}
              className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <MessageSquarePlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Start Engineering Session</h3>
                      <p className="text-xs text-muted-foreground">{selectedRepo.full_name}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRepo(null)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    What should AgentForge do in this repository?
                  </div>
                  <textarea
                    autoFocus
                    value={initialPrompt}
                    onChange={e => setInitialPrompt(e.target.value)}
                    placeholder="e.g., Explain the core architecture and suggest improvements..."
                    className="w-full h-32 bg-secondary/50 border border-border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      disabled={loading}
                      onClick={() => startNewChat(selectedRepo.id, initialPrompt)}
                      className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Initialize Agent
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-secondary/30 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Terminal className="w-3 h-3" />
                  Isolated Workspace will be created
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Model: {model.split('/')[1]}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
