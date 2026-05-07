'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore, MODELS } from '@/lib/store'
import { getSession, getMessages, openAgentSocket, api } from '@/lib/api'
import MessageBubble from '@/components/MessageBubble'
import {
  Send,
  Loader2,
  Cpu,
  ChevronDown,
  Files,
  MessageSquare,
  Sparkles,
  Command,
  Plus,
  Terminal as TerminalIcon,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function SessionPage() {
  const { id } = useParams()
  const router = useRouter()
  const { model, setModel } = useStore()
  const [session, setSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('Idle')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'sandbox'>('chat')
  const [sandboxLogs, setSandboxLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!id) return
    getSession(id as string).then(setSession).catch(() => router.push('/dashboard'))
    getMessages(id as string).then(msgs => {
      setMessages(msgs)
      setLoadingHistory(false)
    }).catch(() => setLoadingHistory(false))
  }, [id])

  useEffect(() => {
    if (scrollRef.current && activeTab === 'chat') scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, activeTab])

  useEffect(() => {
    if (activeTab === 'sandbox' && id) {
        fetchLogs()
    }
  }, [activeTab, id])

  async function fetchLogs() {
    setLoadingLogs(true)
    try {
        const res = await api.get(`/execute/logs/${id}`)
        setSandboxLogs(res.data)
    } catch (err) {
        console.error(err)
    } finally {
        setLoadingLogs(false)
    }
  }

  async function startAgent(text: string) {
    if (!text.trim() || sending) return

    setInput('')
    setSending(true)
    setStatus('Thinking')

    setMessages(prev => [...prev, { role: 'user', content: text, id: 'u-' + Date.now() }])

    const ws = openAgentSocket(id as string)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'reasoning') {
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.id === data.id) {
            return [...prev.slice(0, -1), { ...last, reasoning: (last.reasoning || '') + data.content }]
          }
          return [...prev, { role: 'assistant', content: '', reasoning: data.content, id: data.id }]
        })
      } else if (data.type === 'token') {
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.id === data.id) {
            return [...prev.slice(0, -1), { ...last, content: (last.content || '') + data.content }]
          }
          return [...prev, { role: 'assistant', content: data.content, id: data.id }]
        })
      } else if (data.type === 'status') {
        setStatus(data.message)
      } else if (data.type === 'tool_call') {
        setMessages(prev => [...prev, { role: 'tool_call', ...data }])
        if (activeTab === 'sandbox') fetchLogs()
      } else if (data.type === 'tool_result') {
        setMessages(prev => {
          const updated = prev.map(m => {
            if (m.role === 'tool_call' && m.tc_id === data.tc_id) {
              return { ...m, result: data.output }
            }
            return m
          })
          return [...updated, { role: 'tool_result', content: data.output, tc_id: data.tc_id }]
        })
        if (activeTab === 'sandbox') fetchLogs()
      } else if (data.type === 'info') {
        setMessages(prev => [...prev, { role: 'info', content: data.message, id: 'info-' + Date.now() }])
      } else if (data.type === 'done') {
        setSending(false)
        setStatus('Idle')
        ws.close()
      } else if (data.type === 'error') {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ ' + data.message, id: 'err-' + Date.now() }])
        setSending(false)
        setStatus('Error')
        ws.close()
      }
    }

    ws.onopen = () => ws.send(JSON.stringify({ type: 'start', message: text, model }))
    ws.onerror = () => { setSending(false); setStatus('Error') }
    ws.onclose = () => { setSending(false); if (status !== 'Error') setStatus('Idle') }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
      {/* Tab Switcher */}
      <div className="flex border-b border-white/5 bg-black/20">
        <button
          onClick={() => setActiveTab('chat')}
          className={clsx("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors", activeTab === 'chat' ? "text-white border-b border-white" : "text-muted-foreground")}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={clsx("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors", activeTab === 'code' ? "text-white border-b border-white" : "text-muted-foreground")}
        >
          Explorer
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={clsx("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2", activeTab === 'sandbox' ? "text-white border-b border-white" : "text-muted-foreground")}
        >
          <TerminalIcon className="w-3 h-3" />
          SB
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Explorer */}
        <div className={clsx(
          "flex-col border-r border-white/5 bg-black/40 transition-all duration-300 overflow-hidden",
          "md:flex md:w-64",
          activeTab === 'code' ? "flex fixed inset-0 z-50 md:relative bg-[#09090b]" : "hidden"
        )}>
          <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-white">Workspace</span>
            <button onClick={() => setActiveTab('chat')} className="text-[10px] uppercase font-bold text-muted-foreground">Close</button>
          </div>

          <div className="p-4 border-b border-white/5 hidden md:flex items-center gap-2">
            <Files className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Explorer</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
             <div className="text-[11px] text-muted-foreground/40 px-3 py-6 italic font-medium leading-relaxed">
               {session?.repo ? `Project ${session.repo.name} connected. Sandbox active.` : "Project sandbox initialized at /tmp/af-session."}
             </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className={clsx(
          "flex-1 flex flex-col min-w-0 bg-background relative",
          activeTab !== 'chat' ? "hidden md:flex" : "flex"
        )}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
            {messages.length === 0 && !loadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-30 max-w-md mx-auto">
                <Sparkles className="w-8 h-8 mb-6 text-primary" />
                <h2 className="text-lg font-medium text-white mb-2">How can I help you today?</h2>
                <p className="text-xs text-muted-foreground">I can help you build, refactor, or debug your code directly in the sandbox.</p>
              </div>
            ) : (
              <div className="pb-40">
                {messages.map((m, i) => (
                  <MessageBubble key={m.id || i} msg={m} />
                ))}
                {sending && status === 'Thinking' && (
                    <div className="max-w-3xl mx-auto px-4 py-8 flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">Thinking...</span>
                    </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent absolute bottom-0 left-0 right-0 z-10">
            <div className="max-w-3xl mx-auto relative">
               <div className="absolute -top-12 left-0 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowModelPicker(!showModelPicker)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-all backdrop-blur-md"
                        >
                            <Cpu className="w-3 h-3" />
                            {MODELS.find(m => m.id === model)?.name || model}
                            <ChevronDown className={clsx("w-3 h-3 transition-transform", showModelPicker && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                        {showModelPicker && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 mb-3 w-96 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
                            >
                                <div className="sticky top-0 p-3 border-b border-white/5 bg-[#18181b] text-[9px] font-bold uppercase text-muted-foreground tracking-widest z-10">Select Model</div>
                                <div className="max-h-96 overflow-y-auto py-1 pr-2">
                                    {MODELS.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => { setModel(m.id); setShowModelPicker(false) }}
                                        className={clsx(
                                            "w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-between group rounded-lg mx-1",
                                            model === m.id ? "text-white bg-white/10" : "text-muted-foreground/60"
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="truncate">{m.name}</span>
                                            <span className="text-[8px] opacity-40 font-mono tracking-tighter group-hover:opacity-60">{m.provider}</span>
                                        </div>
                                        {model === m.id && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 ml-2" />}
                                    </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>

                    <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-all backdrop-blur-md">
                        <Plus className="w-3 h-3" />
                        Add Context
                    </button>
               </div>

               <form
                onSubmit={e => { e.preventDefault(); startAgent(input) }}
                className="relative bg-[#18181b]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl focus-within:border-white/20 transition-all overflow-hidden"
              >
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAgent(input) } }}
                  placeholder="Ask anything..."
                  className="w-full bg-transparent px-5 py-6 text-sm focus:outline-none resize-none min-h-[80px] text-white placeholder:text-muted-foreground/40"
                  rows={1}
                />

                <div className="flex items-center justify-between px-5 pb-5">
                   <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
                        <div className="flex items-center gap-1.5">
                            <Command className="w-3 h-3" />
                            <span>Return to send</span>
                        </div>
                   </div>

                   <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-20 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {sending ? 'Sending' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sandbox View */}
        <div className={clsx(
          "flex-1 flex flex-col min-w-0 bg-[#09090b] relative border-l border-white/5",
          activeTab === 'sandbox' ? "flex fixed inset-0 z-50 md:relative" : "hidden"
        )}>
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-white/[0.02]">
            <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Sandbox Logs</span>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={fetchLogs} className="p-1.5 hover:bg-white/5 rounded-md">
                    <Sparkles className={clsx("w-3.5 h-3.5 text-muted-foreground", loadingLogs && "animate-spin")} />
                </button>
                <button onClick={() => setActiveTab('chat')} className="md:hidden p-1.5 hover:bg-white/5 rounded-md">
                    <X className="w-4 h-4 text-white" />
                </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-muted-foreground/80 space-y-6 no-scrollbar">
            {sandboxLogs.length === 0 && !loadingLogs ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <TerminalIcon className="w-12 h-12 mb-4" />
                <p>No execution logs yet.</p>
              </div>
            ) : (
              sandboxLogs.map((log, i) => (
                <div key={i} className="space-y-2 border-l-2 border-white/5 pl-4 hover:border-primary/30 transition-colors">
                  {log.type === 'call' ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-primary/80 font-bold">
                        <TerminalIcon className="w-3 h-3" />
                        <span>{log.tool}</span>
                        <span className="text-[8px] opacity-30 ml-auto">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <pre className="bg-white/5 p-3 rounded-lg overflow-x-auto border border-white/5 text-[10px]">
                        {JSON.stringify(log.input, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-green-500/80 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>output</span>
                      </div>
                      <pre className="bg-black/40 p-3 rounded-lg overflow-x-auto border border-white/5 text-[10px] whitespace-pre-wrap">
                        {log.output}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
            {loadingLogs && (
                <div className="flex items-center gap-2 p-4 text-[10px] uppercase font-bold tracking-widest opacity-30">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing logs...
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
