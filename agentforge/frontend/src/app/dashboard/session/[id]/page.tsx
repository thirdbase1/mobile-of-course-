'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore, MODELS } from '@/lib/store'
import { getSession, getMessages, openAgentSocket, api } from '@/lib/api'
import MessageBubble from '@/components/MessageBubble'
import FileTree from '@/components/FileTree'
import CodeEditor from '@/components/CodeEditor'
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
  AlertCircle,
  RefreshCcw,
  Code2,
  Search
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

  const [files, setFiles] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [loadingFiles, setLoadingFiles] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!id) return
    getSession(id as string).then(setSession).catch(() => router.push('/dashboard'))
    getMessages(id as string).then(msgs => {
      setMessages(msgs)
      setLoadingHistory(false)
    }).catch(() => setLoadingHistory(false))
    refreshFiles()
  }, [id])

  useEffect(() => {
    if (scrollRef.current && activeTab === 'chat') scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, activeTab])

  useEffect(() => {
    if (activeTab === 'sandbox' && id) fetchLogs()
  }, [activeTab, id])

  async function refreshFiles() {
    if (!id) return
    setLoadingFiles(true)
    try {
        const res = await api.get(`/repos/fs/${id}`)
        setFiles(res.data)
    } catch (err) {
        console.error(err)
    } finally {
        setLoadingFiles(false)
    }
  }

  async function fetchFile(path: string) {
      try {
          const res = await api.get(`/repos/fs/${id}/file`, { params: { path } })
          setSelectedFile(res.data)
      } catch (err) {
          console.error(err)
      }
  }

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
      } else if (data.type === 'file_changed') {
          refreshFiles()
          if (selectedFile && selectedFile.path === data.path) fetchFile(data.path)
      } else if (data.type === 'terminal_log') {
          setSandboxLogs(prev => [...prev, { type: 'result', output: data.content, timestamp: new Date().toISOString() }])
      } else if (data.type === 'tool_call') {
        setMessages(prev => [...prev, { role: 'tool_call', ...data }])
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
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex border-b border-border bg-card/30">
        <button
          onClick={() => setActiveTab('chat')}
          className={clsx("flex-1 py-3 text-xs font-bold uppercase tracking-widest", activeTab === 'chat' ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={clsx("flex-1 py-3 text-xs font-bold uppercase tracking-widest", activeTab === 'code' ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
        >
          Code
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={clsx("flex-1 py-3 text-xs font-bold uppercase tracking-widest", activeTab === 'sandbox' ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
        >
          Sandbox
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={clsx(
          "flex-col border-r border-border bg-card transition-all duration-300 overflow-hidden",
          "md:flex md:w-64",
          activeTab === 'code' ? "flex fixed inset-0 z-50 md:relative" : "hidden"
        )}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest">Explorer</span>
            <button onClick={refreshFiles} className="p-1 hover:bg-secondary rounded"><RefreshCcw className="w-3 h-3" /></button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
             <FileTree files={files} onSelect={fetchFile} activePath={selectedFile?.path} />
          </div>
        </div>

        <div className={clsx(
          "flex-1 flex flex-col min-w-0 relative",
          activeTab === 'chat' ? "flex" : "hidden md:flex"
        )}>
          <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-card/20">
            <div className="flex items-center gap-2">
               <div className={clsx("w-1.5 h-1.5 rounded-full", (sending || status !== 'Idle') ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{status}</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
            {messages.length === 0 && !loadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-20">
                <MessageSquare className="w-12 h-12 mb-4" />
                <p className="text-sm font-medium">Ready for your instructions.</p>
              </div>
            ) : (
              <div className="pb-32">
                {messages.map((m, i) => (
                  <MessageBubble key={m.id || i} msg={m} />
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-gradient-to-t from-background via-background/95 to-transparent absolute bottom-0 left-0 right-0 z-10">
            <div className="max-w-3xl mx-auto relative">
               <form
                onSubmit={e => { e.preventDefault(); startAgent(input) }}
                className="relative bg-card/90 backdrop-blur-2xl border border-border rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] focus-within:ring-1 focus-within:ring-primary/40 transition-all overflow-hidden"
              >
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAgent(input) } }}
                  placeholder="Message AgentForge..."
                  className="w-full bg-transparent px-4 py-5 text-sm focus:outline-none resize-none min-h-[64px]"
                  rows={1}
                />

                <div className="flex items-center justify-between px-4 pb-4">
                   <div className="relative">
                     <button
                      type="button"
                      onClick={() => setShowModelPicker(!showModelPicker)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border text-[10px] font-bold uppercase tracking-tighter text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                     >
                       <Cpu className="w-3 h-3" />
                       {MODELS.find(m => m.id === model)?.name || model}
                       <ChevronDown className="w-3 h-3" />
                     </button>

                     <AnimatePresence>
                       {showModelPicker && (
                         <motion.div
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
                         >
                           <div className="p-2.5 border-b border-border bg-secondary/40 text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Available Models</div>
                           <div className="max-h-[300px] overflow-y-auto no-scrollbar py-1">
                             {MODELS.map(m => (
                               <button
                                key={m.id}
                                onClick={() => { setModel(m.id); setShowModelPicker(false) }}
                                className={clsx(
                                  "w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-between group",
                                  model === m.id ? "bg-secondary text-primary" : "text-muted-foreground/70"
                                )}
                               >
                                 <span>{m.name}</span>
                                 <span className="text-[8px] opacity-40 font-mono tracking-tighter group-hover:opacity-100">{m.provider}</span>
                               </button>
                             ))}
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>

                   <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-20 shadow-lg shadow-primary/20 active:scale-95"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className={clsx(
          "flex-1 flex flex-col min-w-0 bg-background relative border-l border-border",
          activeTab === 'sandbox' ? "flex" : "hidden"
        )}>
           <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-card/20">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sandbox Logs</span>
              <button onClick={fetchLogs} className="p-1 hover:bg-secondary rounded"><RefreshCcw className="w-3 h-3" /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] text-muted-foreground/80 space-y-2 no-scrollbar">
              {sandboxLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap break-words border-l border-border pl-4 py-0.5">
                      {log.output}
                  </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}
