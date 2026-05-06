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
  ChevronRight
} from 'lucide-react'
import clsx from "clsx"
import { motion, AnimatePresence } from 'framer-motion'

export default function SettingsPage() {
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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your API keys, model preferences, and account.</p>
        </header>

        <div className="space-y-12">
          {/* Account Profile */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> Account
            </h2>
            <div className="p-6 bg-card border border-border rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={user?.avatar_url || ''} className="w-12 h-12 rounded-full border border-border" />
                <div>
                  <div className="font-bold">{user?.name || user?.login}</div>
                  <div className="text-xs text-muted-foreground">Connected via GitHub</div>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </div>
            </div>
          </section>

          {/* Model Selection */}
          <section>
             <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Default Model
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition-all relative group",
                    model === m.id ? "bg-primary/5 border-primary shadow-sm" : "bg-card border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className="font-bold text-sm mb-1">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{m.provider}</div>
                  {model === m.id && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* API Keys */}
          <section>
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" /> API Keys
              </h2>
              <a href="#" className="text-xs text-primary hover:underline flex items-center gap-1">
                How to get keys <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {[
                { id: 'groq_api_key', label: 'Groq API Key', placeholder: 'gsk_...', link: 'https://console.groq.com/keys' },
                { id: 'openrouter_api_key', label: 'OpenRouter API Key', placeholder: 'sk-or-v1-...', link: 'https://openrouter.ai/keys' },
                { id: 'xai_api_key', label: 'xAI (Grok) API Key', placeholder: 'xai-...', link: 'https://console.x.ai/' },
              ].map(item => (
                <div key={item.id} className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider">{item.label}</label>
                    <a href={item.link} target="_blank" className="text-[10px] text-muted-foreground hover:text-foreground">Get Key</a>
                  </div>
                  <input
                    type="password"
                    value={keys[item.id] || ''}
                    onChange={e => setKeys({ ...keys, [item.id]: e.target.value })}
                    placeholder={item.placeholder}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-end gap-4">
              <AnimatePresence>
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-green-500 text-sm font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Settings saved
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div
                     initial={{ opacity: 0, x: 10 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0 }}
                     className="text-destructive text-sm font-medium flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Failed to save
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="h-10 px-6 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
