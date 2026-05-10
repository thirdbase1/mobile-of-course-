'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { createSession } from '@/lib/api'
import {
  Plus,
  GitBranch,
  Zap,
  Code2,
  ArrowRight,
  Loader2,
  X,
  Terminal,
  Activity,
  Layers,
  Box,
  MessageSquarePlus,
  ArrowUpRight,
  ShieldCheck,
  Cpu
} from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardHome() {
  const { user, repos, upsertSession, model } = useStore()
  const [loading, setLoading] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<any>(null)
  const [initialPrompt, setInitialPrompt] = useState('')
  const router = useRouter()

  async function startNewChat(repoId?: string, prompt?: string) {
    setLoading(true)
    try {
      const content = prompt?.trim() || "Ready for directives. Provide the engineering objective."
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
      const s = await createSession({
        title: repoId ? `Repo Ops: ${repos.find(r => r.id === repoId)?.name}` : title,
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
    <div className="flex-1 overflow-y-auto bg-[#09090b] selection:bg-white selection:text-black">
      <div className="max-w-6xl mx-auto px-10 py-20">
        {/* Advanced Header */}
        <header className="mb-20">
          <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-6"
          >
            <Activity className="w-3.5 h-3.5" /> Core System Online
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black tracking-tighter mb-6 leading-none uppercase"
          >
            WELCOME TO <span className="text-white/20 italic">GITCODE</span>, {user?.login}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-white/40 text-lg font-bold tracking-tight uppercase max-w-2xl"
          >
            Autonomous engineering environment initialized. Select a workspace or initialize a new operational state.
          </motion.p>
        </header>

        {/* Global Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
           {[
             { title: "Initialize Session", desc: "Launch an autonomous thread without specific repository bindings.", icon: Plus, action: () => startNewChat() },
             { title: "Sync Repository", desc: "Connect a high-capacity engineering sandbox to your GitHub repo.", icon: GitBranch, action: () => router.push('/dashboard/repos'), secondary: true },
             { title: "Operational Feed", desc: "Monitor all active execution chains and background engineering tasks.", icon: Activity, inactive: true }
           ].map((item, i) => (
             <motion.button
               key={i}
               whileHover={!item.inactive ? { y: -8, scale: 1.02 } : {}}
               onClick={item.action}
               disabled={item.inactive}
               className={clsx(
                 "flex flex-col items-start p-10 rounded-[2.5rem] border transition-all text-left group relative overflow-hidden",
                 item.secondary ? "bg-white/[0.02] border-white/5 hover:border-white/20" : "bg-white text-black border-transparent",
                 item.inactive && "opacity-20 cursor-not-allowed"
               )}
             >
               <div className={clsx(
                 "w-14 h-14 rounded-2xl flex items-center justify-center mb-10 transition-all",
                 item.secondary ? "bg-white/5 group-hover:bg-white group-hover:text-black" : "bg-black/5 group-hover:bg-black group-hover:text-white"
               )}>
                 <item.icon className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-black mb-3 uppercase tracking-tight">{item.title}</h3>
               <p className={clsx("text-xs font-bold leading-relaxed uppercase tracking-wider", item.secondary ? "text-white/30" : "text-black/50")}>
                 {item.desc}
               </p>
             </motion.button>
           ))}
        </div>

        {/* Repositories / Workspaces */}
        <section>
          <div className="flex items-center justify-between mb-10 border-b border-white/[0.05] pb-6">
            <h2 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tighter">
              <Box className="w-6 h-6 text-white/40" />
              Connected Workspaces
            </h2>
            <button onClick={() => router.push('/dashboard/repos')} className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-all flex items-center gap-2">
               Full Catalog <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {repos.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-32 rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01]">
                <Layers className="w-16 h-16 text-white/10 mb-8" />
                <p className="text-white/30 mb-10 text-center font-bold uppercase tracking-widest text-xs">No active repositories mapped to GITCODE.</p>
                <button
                  onClick={() => router.push('/dashboard/repos')}
                  className="px-10 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all active:scale-95"
                >
                  Map first repository
                </button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {repos.slice(0, 6).map(repo => (
                <motion.div
                  key={repo.id}
                  layoutId={repo.id}
                  onClick={() => setSelectedRepo(repo)}
                  className="p-8 rounded-[2rem] border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 cursor-pointer transition-all group flex items-center justify-between"
                >
                  <div className="min-w-0 pr-6">
                    <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-3 group-hover:text-white transition-colors">Workspace — {repo.language || "Native"}</div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase truncate mb-2">{repo.name}</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest line-clamp-1">
                      {repo.description || "Production-grade engineering environment ready."}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-white group-hover:text-black transition-all shrink-0">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Operational Modal */}
      <AnimatePresence>
        {selectedRepo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedRepo(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              layoutId={selectedRepo.id}
              className="relative w-full max-w-2xl bg-[#121214] border border-white/10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="p-12">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center">
                      <MessageSquarePlus className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-black text-2xl tracking-tighter uppercase">Initialize Thread</h3>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">{selectedRepo.full_name}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRepo(null)} className="p-3 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Operational Objective</label>
                    <textarea
                        autoFocus
                        value={initialPrompt}
                        onChange={e => setInitialPrompt(e.target.value)}
                        placeholder="Define the task (e.g. Audit architecture, fix bottlenecks, implement feature...)"
                        className="w-full h-40 bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-6 text-sm font-medium resize-none focus:outline-none focus:border-white/20 transition-all text-white placeholder:text-white/10"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      disabled={loading}
                      onClick={() => startNewChat(selectedRepo.id, initialPrompt)}
                      className="flex-1 h-16 bg-white text-black rounded-[1.25rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-white/90 transition-all disabled:opacity-20 active:scale-95 shadow-2xl"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-5 h-5" />}
                      Start Engineering Chain
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-12 py-8 bg-white/[0.02] border-t border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/20">
                  <ShieldCheck className="w-4 h-4 text-green-500/40" />
                  Isolated Sandbox v3.2 Initialized
                </div>
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/20">
                  <Cpu className="w-4 h-4" />
                  Core: {model.split('/')[1]}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
