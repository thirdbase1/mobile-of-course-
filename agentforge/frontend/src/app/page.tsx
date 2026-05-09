'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  GitBranch,
  Terminal,
  Code2,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Globe,
  Rocket,
  Zap,
  Box,
  Layers,
  Activity
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem('token')) router.push('/dashboard')
  }, [])

  const login = () => {
    window.location.href = "/api/backend/auth/github"
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden selection:bg-white selection:text-black font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-20">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-white/10 blur-[160px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/5 blur-[140px] rounded-full" />
        </div>
      </div>

      <nav className="h-20 border-b border-white/[0.05] bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-8 md:px-16">
        <div className="flex items-center gap-3 font-black text-xl tracking-tighter uppercase">
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center">
            <Box className="w-6 h-6" />
          </div>
          GITCODE
        </div>
        <div className="flex items-center gap-8">
          <button onClick={login} className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors">Documentation</button>
          <button onClick={login} className="px-6 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all shadow-xl active:scale-95">Sign In</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-24 pb-40 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white mb-12 shadow-inner"
        >
          <Activity className="w-3.5 h-3.5 text-white/60" />
          <span>The Engineering OS for Autonomous Teams</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-7xl md:text-9xl font-black tracking-tighter mb-10 leading-[0.85] max-w-6xl"
        >
          AI AGENTS, <span className="text-white/30 italic">OPERATING</span> IN PRODUCTION.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/40 text-lg md:text-xl max-w-2xl mb-16 leading-relaxed font-bold tracking-tight uppercase"
        >
          GITCODE is not a chatbot. It is a live operational environment where autonomous agents index repos, run tests, and manage deployment cycles.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-6 mb-32"
        >
          <button
            onClick={login}
            className="w-full sm:w-auto h-16 px-12 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-white/90 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)] group active:scale-95"
          >
            <GitBranch className="w-5 h-5" />
            Launch Environment
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Tactical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-40">
          {[
            { icon: Layers, title: "Operational Visibility", desc: "Watch the AI index entire repositories, read symbols, and edit code in real-time. Full transparency into every thought and action." },
            { icon: ShieldCheck, title: "Security Gate Architecture", desc: "Dangerous operations require human approval. Multi-stage permissions for terminal, commits, and deployments." },
            { icon: Box, title: "Sandboxed Reliability", desc: "Clones your environment into secure ephemeral containers. Autonomous dependency management and test-driven refactoring." }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-12 rounded-[3rem] bg-white/[0.02] border border-white/[0.05] text-left hover:border-white/20 hover:bg-white/[0.04] transition-all group shadow-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-10 group-hover:bg-white group-hover:text-black transition-all">
                <f.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black mb-5 tracking-tight uppercase">{f.title}</h3>
              <p className="text-white/40 leading-relaxed font-bold text-xs uppercase tracking-wider">{f.desc}</p>
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-20 transition-opacity">
                <f.icon className="w-24 h-24" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Telemetry Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="w-full bg-[#0c0c0e] rounded-[3rem] border border-white/[0.05] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative"
        >
          <div className="flex items-center justify-between px-8 py-5 bg-white/[0.03] border-b border-white/[0.05]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">gitcode-terminal-multiplexer-v3.0</div>
            <div className="w-10" />
          </div>
          <div className="p-12 font-mono text-sm text-left space-y-4">
             <div className="flex gap-4 text-white/30"><span className="font-bold">SYSTEM</span> <span>Initializing hyper-parallel execution loop...</span></div>
             <div className="flex gap-4 text-white"><span className="font-bold text-green-500">READY</span> <span>Connected to sandbox (session_id: 82k-912)</span></div>
             <div className="flex gap-4 text-white/60"><span>gitcode $</span> <span className="text-white">analyze_codebase --deep --parallel</span></div>
             <div className="flex gap-4 text-white/30 ml-8"><span>├─ indexing symbols (4.2k files)</span></div>
             <div className="flex gap-4 text-white/30 ml-8"><span>├─ mapped architecture: Next.js + FastAPI</span></div>
             <div className="flex gap-4 text-white/30 ml-8"><span>└─ ready for task: "Implement Global Approval System"</span></div>
             <div className="flex gap-4"><span className="animate-pulse w-2 h-5 bg-white" /></div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-white/[0.05] py-24 px-8 text-center bg-black">
        <div className="font-black text-2xl mb-8 tracking-tighter uppercase">GITCODE</div>
        <div className="flex items-center justify-center gap-8 mb-12">
            {[GitBranch, Terminal, Code2, Globe].map((I, i) => (
                <I key={i} className="w-5 h-5 text-white/20 hover:text-white transition-colors cursor-pointer" />
            ))}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          © 2026 GITCODE. Built for autonomous engineering.
        </p>
      </footer>
    </div>
  )
}
