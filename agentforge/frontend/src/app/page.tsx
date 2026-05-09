'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap,
  GitBranch,
  Plus,
  Terminal,
  Code2,
  Sparkles,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Globe,
  Rocket
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem('af_token')) router.push('/dashboard')
  }, [])

  const login = () => {
    window.location.href = "/api/backend/auth/github"
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <nav className="h-16 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-background">
            <Code2 className="w-5 h-5" />
          </div>
          GITCODE
        </div>
        <button
          onClick={login}
          className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors"
        >
          Launch
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-[10px] font-bold uppercase tracking-widest text-accent mb-10"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Native Software Engineering OS</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tight mb-8 max-w-5xl leading-[0.9]"
        >
          Supervise Autonomous <span className="text-accent">AI Engineers</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-medium"
        >
          GITCODE is an unified workspace where AI agents operate transparently in your repositories, sandboxes, and terminals. Real-time visibility, approval-based security, and multi-agent orchestration.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-24"
        >
          <button
            onClick={login}
            className="w-full sm:w-auto h-14 px-10 bg-accent text-background rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-accent/90 transition-all shadow-2xl shadow-accent/30 group"
          >
            <Terminal className="w-5 h-5" />
            Enter Workspace
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto h-14 px-10 bg-secondary text-foreground border border-border rounded-2xl font-bold uppercase tracking-widest hover:border-primary transition-all">
            Learn More
          </button>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-32">
          {[
            { icon: Terminal, title: "Multi-Panel Workspace", desc: "Chat, code editor, file explorer, diff viewer, terminal, and git panel all synchronized in real-time." },
            { icon: ShieldCheck, title: "Approval-Based Security", desc: "Granular permissions per tool, workspace, or agent. Approve dangerous operations before execution." },
            { icon: Cpu, title: "AI Agent Orchestration", desc: "Coordinate multiple specialized agents: planner, coder, debugger, reviewer, devops - working autonomously or supervised." }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-10 rounded-[2.5rem] bg-card/40 border border-border/50 text-left hover:border-primary/30 transition-all group backdrop-blur-sm shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <f.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium text-sm opacity-80">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Real-time stats section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 mb-32 border-y border-border/50 py-12"
        >
          {[
            { label: "AI Models", val: "38+", icon: Cpu },
            { label: "Workspace Types", val: "4", icon: Globe },
            { label: "Agent Roles", val: "6", icon: Sparkles },
            { label: "Permission Levels", val: "Custom", icon: ShieldCheck }
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <s.icon className="w-5 h-5 text-primary mb-3" />
              <div className="text-2xl font-black tracking-tighter">{s.val}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Console Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="w-full max-w-4xl bg-[#09090b] rounded-[2rem] border border-border/50 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-2 px-6 py-4 bg-secondary/30 border-b border-border/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex-1 text-center">gitcode@workspace — AI Engineers Active</div>
          </div>
          <div className="p-10 font-mono text-sm text-left space-y-3 overflow-x-auto whitespace-nowrap md:whitespace-normal">
            <div className="flex gap-4"><span className="text-accent font-bold">➜</span> <span className="text-muted-foreground opacity-50">Starting workspace agents...</span></div>
            <div className="flex gap-4"><span className="text-green-500">✓</span> <span className="text-white font-medium">Planner Agent: Ready</span></div>
            <div className="flex gap-4"><span className="text-green-500">✓</span> <span className="text-white font-medium">Coding Agent: Ready</span></div>
            <div className="flex gap-4"><span className="text-accent font-bold">➜</span> <span className="text-muted-foreground opacity-50">Awaiting human approval for:</span> <span className="text-white">git push origin feature-branch</span></div>
            <div className="flex gap-4"><span className="text-blue-400">●</span> <span className="text-white font-medium">1 approval required • 38 models available • 0 errors</span></div>
            <div className="flex gap-4"><span className="animate-pulse w-2 h-5 bg-accent" /></div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border/50 py-16 px-6 text-center">
        <div className="font-bold text-lg mb-4 tracking-tighter">GITCODE</div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          © 2026 GITCODE. AI-Native Engineering OS. Powered by 38+ Models & Real-Time Transparency.
        </p>
      </footer>
    </div>
  )
}
