'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, GitBranch, Plus, Terminal, Code2, Sparkles, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem('af_token')) router.push('/dashboard')
  }, [])

  const login = () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin
    window.location.href = `${backendUrl}/auth/github`
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium mb-8"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span>v2.0 is now live</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl"
        >
          Your AI Senior <span className="text-muted-foreground italic">Software Engineer</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
        >
          AgentForge clones your repository into an isolated workspace, solves complex issues, writes tests, and pushes PRs—all from a single prompt.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-24"
        >
          <button
            onClick={login}
            className="w-full sm:w-auto h-12 px-8 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <GitBranch className="w-5 h-5" />
            Continue with GitHub
          </button>
          <button className="w-full sm:w-auto h-12 px-8 bg-secondary text-foreground border border-border rounded-lg font-semibold hover:bg-accent transition-all">
            See it in action
          </button>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
        >
          {[
            { icon: Terminal, title: "Isolated Workspace", desc: "Clones your repo to a secure /tmp workspace for execution." },
            { icon: ShieldCheck, title: "Act First, Ask Later", desc: "Autonomous agent loop that verifies changes before committing." },
            { icon: Code2, title: "Any Stack", desc: "Works with Python, JS, Go, Rust, and more via Wandbox." }
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-2xl bg-card border border-border text-left hover:border-primary/40 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Console Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-32 w-full max-w-4xl bg-[#0d1117] rounded-xl border border-border overflow-hidden shadow-2xl"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
              <div className="w-3 h-3 rounded-full bg-green-500/20" />
            </div>
            <div className="text-[10px] text-muted-foreground font-mono flex-1 text-center">agentforge@v2.0 — isolated-workspace</div>
          </div>
          <div className="p-6 font-mono text-sm text-left space-y-2 overflow-x-auto whitespace-nowrap md:whitespace-normal">
            <div className="flex gap-4"><span className="text-primary">➜</span> <span className="text-muted-foreground">Cloning repository...</span></div>
            <div className="flex gap-4"><span className="text-green-500">✓</span> <span className="text-white">Workspace initialized at /tmp/af-92k1</span></div>
            <div className="flex gap-4"><span className="text-primary">➜</span> <span className="text-muted-foreground">Analyzing structure & imports...</span></div>
            <div className="flex gap-4"><span className="text-blue-400">ℹ</span> <span className="text-white">Found Python/FastAPI stack. Starting logic redesign.</span></div>
            <div className="flex gap-4"><span className="animate-pulse">_</span></div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border py-12 px-6 text-center text-sm text-muted-foreground">
        © 2026 AgentForge. Securely powered by Groq & GitHub.
      </footer>
    </div>
  )
}
