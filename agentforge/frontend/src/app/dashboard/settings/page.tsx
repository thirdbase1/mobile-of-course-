'use client'
import { useState, useEffect } from 'react'
import { getKeys, saveKeys, getMe } from '@/lib/api'
import { useStore, MODELS } from '@/lib/store'
import {
  Key,
  Save,
  Shield,
  Cpu,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ChevronRight,
  Box,
  Layers,
  Activity,
  Lock,
  LogOut,
  ShieldCheck
} from 'lucide-react'
import clsx from "clsx"
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const { user, model, setModel } = useStore()
  const [keys, setKeys] = useState<any>({
    groq_api_key: '',
    openrouter_api_key: '',
    xai_api_key: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    getKeys().then(setKeys).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setStatus('idle')
    try {
      await saveKeys(keys)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#09090b] selection:bg-white selection:text-black">
      <div className="max-w-4xl mx-auto px-10 py-20">
        <header className="mb-20">
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> Security & Configuration
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white mb-6 uppercase">Environment</h1>
          <p className="text-white/40 text-lg font-bold tracking-tight uppercase max-w-2xl">Configure your operational keys and default execution engine.</p>
        </header>

        <div className="space-y-24">
          {/* User Profile */}
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-10 flex items-center gap-3">
              <Box className="w-4 h-4" /> Identity Module
            </h2>
            <div className="p-10 bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-6">
                <img src={user?.avatar_url || ''} className="w-16 h-16 rounded-2xl border border-white/10 shadow-2xl" />
                <div>
                  <div className="text-2xl font-black uppercase tracking-tighter text-white">{user?.name || user?.login}</div>
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Authenticated via GitHub</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-6 py-3 bg-white/5 hover:bg-red-500/10 hover:text-red-500 border border-white/5 hover:border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </section>

          {/* Core Engine Selector */}
          <section>
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-10 flex items-center gap-3">
              <Cpu className="w-4 h-4" /> Default Execution Engine
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={clsx(
                    "p-8 rounded-[2rem] border text-left transition-all relative group overflow-hidden",
                    model === m.id ? "bg-white text-black border-transparent" : "bg-white/[0.01] border-white/[0.05] text-white/40 hover:border-white/20 hover:text-white"
                  )}
                >
                  <div className="text-lg font-black uppercase tracking-tight mb-2">{m.name}</div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{m.provider}</div>
                  {model === m.id && (
                    <div className="absolute top-8 right-8">
                      <CheckCircle2 className="w-5 h-5 text-black" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
                      <Cpu className="w-16 h-16" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Secure Handshake: API Keys */}
          <section>
            <div className="flex items-center justify-between mb-10">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 flex items-center gap-3">
                <Lock className="w-4 h-4" /> Infrastructure Handshake
              </h2>
            </div>

            <div className="bg-[#0c0c0e] border border-white/[0.05] rounded-[3rem] overflow-hidden divide-y divide-white/[0.02] shadow-2xl">
              {[
                { id: 'groq_api_key', label: 'Groq Infrastructure Key', placeholder: 'gsk_...', link: 'https://console.groq.com/keys' },
                { id: 'openrouter_api_key', label: 'OpenRouter Relay Key', placeholder: 'sk-or-v1-...', link: 'https://openrouter.ai/keys' },
                { id: 'xai_api_key', label: 'xAI Operational Key', placeholder: 'xai-...', link: 'https://console.x.ai/' },
              ].map(item => (
                <div key={item.id} className="p-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{item.label}</label>
                    <a href={item.link} target="_blank" className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white flex items-center gap-2 transition-colors">
                        Provision Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={keys[item.id] || ''}
                    onChange={e => setKeys({ ...keys, [item.id]: e.target.value })}
                    placeholder={item.placeholder}
                    className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-white/20 transition-all text-white placeholder:text-white/5"
                  />
                </div>
              ))}
            </div>

            <div className="mt-12 flex items-center justify-end gap-6">
              <AnimatePresence>
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Handshake Secure
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div
                     initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                     className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Link Failure
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="h-16 px-10 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/90 transition-all flex items-center justify-center gap-4 disabled:opacity-20 shadow-2xl active:scale-95"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Sync Environment
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
