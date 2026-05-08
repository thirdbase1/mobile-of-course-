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
  Plus,
  Terminal as TerminalIcon,
  RefreshCcw,
  Code2,
  Search,
  Command
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
  const [modelSearch, setModelSearch] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!id) return
    getSession(id as string).then(setSession).catch(() => router.push('/dashboard'))
    getMessages(id as string).then(msgs => {
      setMessages(msgs); setLoadingHistory(false)
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
    } catch (err) { console.error(err) } finally { setLoadingFiles(false) }
  }

  async function fetchFile(path: string) {
      try {
          const res = await api.get(`/repos/fs/${id}/file`, { params: { path } })
          setSelectedFile(res.data)
      } catch (err) { console.error(err) }
  }

  async function fetchLogs() {
    setLoadingLogs(true)
    try {
        const res = await api.get(`/execute/logs/${id}`)
        setSandboxLogs(res.data)
    } catch (err) { console.error(err) } finally { setLoadingLogs(false) }
  }

  async function startAgent(text: string) {
    if (!text.trim() || sending) return
    setInput(''); setSending(true); setStatus('Thinking')
    setMessages(prev => [...prev, { role: 'user', content: text, id: 'u-' + Date.now() }])
    const ws = openAgentSocket(id as string); wsRef.current = ws
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'reasoning') {
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.id === data.id) return [...prev.slice(0, -1), { ...last, reasoning: (last.reasoning || '') + data.content }]
          return [...prev, { role: 'assistant', content: '', reasoning: data.content, id: data.id }]
        })
      } else if (data.type === 'token') {
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.id === data.id) return [...prev.slice(0, -1), { ...last, content: (last.content || '') + data.content }]
          return [...prev, { role: 'assistant', content: data.content, id: data.id }]
        })
      } else if (data.type === 'status') {
        setStatus(data.message)
      } else if (data.type === 'file_changed') {
          refreshFiles(); if (selectedFile && selectedFile.path === data.path) fetchFile(data.path)
      } else if (data.type === 'terminal_log') {
          setSandboxLogs(prev => [...prev, { type: 'result', output: data.content, timestamp: new Date().toISOString() }])
      } else if (data.type === 'tool_call') {
        setMessages(prev => [...prev, { role: 'tool_call', ...data }])
      } else if (data.type === 'tool_result') {
        setMessages(prev => {
          const updated = prev.map(m => (m.role === 'tool_call' && m.tc_id === data.tc_id) ? { ...m, result: data.output } : m)
          return [...updated, { role: 'tool_result', content: data.output, tc_id: data.tc_id }]
        })
      } else if (data.type === 'done') {
        setSending(false); setStatus('Idle'); ws.close()
      } else if (data.type === 'error') {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ ' + data.message, id: 'err-' + Date.now() }])
        setSending(false); setStatus('Error'); ws.close()
      }
    }
    ws.onopen = () => ws.send(JSON.stringify({ type: 'start', message: text, model }))
    ws.onerror = () => { setSending(false); setStatus('Error') }
    ws.onclose = () => { setSending(false); if (status !== 'Error') setStatus('Idle') }
  }

  const filteredModels = MODELS.filter(m => m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.provider.toLowerCase().includes(modelSearch.toLowerCase()))
  const providers = Array.from(new Set(filteredModels.map(m => m.provider)))

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
      <div className="flex border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-20">
        <button onClick={() => setActiveTab('chat')} className={clsx("flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all", activeTab === 'chat' ? "text-primary border-b border-primary bg-primary/5" : "text-muted-foreground/60 hover:text-white")}>Chat</button>
        <button onClick={() => setActiveTab('code')} className={clsx("flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all", activeTab === 'code' ? "text-primary border-b border-primary bg-primary/5" : "text-muted-foreground/60 hover:text-white")}>Explorer</button>
        <button onClick={() => setActiveTab('sandbox')} className={clsx("flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2", activeTab === 'sandbox' ? "text-primary border-b border-primary bg-primary/5" : "text-muted-foreground/60 hover:text-white")}><TerminalIcon className="w-3 h-3" /> Sandbox</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={clsx("flex-1 flex overflow-hidden", activeTab === 'code' ? "flex" : "hidden")}>
           <div className="w-64 border-r border-white/5 bg-black/40 flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Workspace</span>
                <button onClick={refreshFiles} className="p-1 hover:bg-white/5 rounded"><RefreshCcw className={clsx("w-3 h-3 text-muted-foreground", loadingFiles && "animate-spin")} /></button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar"><FileTree files={files} onSelect={fetchFile} activePath={selectedFile?.path} /></div>
           </div>
           <div className="flex-1 bg-[#09090b] flex flex-col min-w-0">
              {selectedFile ? (
                  <><div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[10px] font-bold font-mono text-white opacity-60 truncate">{selectedFile.path}</span></div><div className="flex-1 overflow-hidden"><CodeEditor content={selectedFile.content} language={selectedFile.name.split('.').pop()} /></div></>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-10"><Code2 className="w-20 h-20 mb-6" /><p className="text-[10px] font-black uppercase tracking-[0.4em]">Sandbox FS Idle</p></div>
              )}
           </div>
        </div>

        <div className={clsx("flex-1 flex flex-col min-w-0 bg-background relative", activeTab === 'chat' ? "flex" : "hidden md:flex")}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
            {messages.length === 0 && !loadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-30 max-w-md mx-auto"><TerminalIcon className="w-10 h-10 mb-8 text-primary" /><h2 className="text-xl font-black text-white mb-3 tracking-tighter">System Ready</h2><p className="text-xs text-muted-foreground font-medium leading-relaxed">Issue commands to the engine.</p></div>
            ) : (
              <div className="pb-40">
                {messages.map((m, i) => <MessageBubble key={m.id || i} msg={m} />)}
                {sending && <div className="py-10 px-4 w-full flex justify-end"><div className="max-w-2xl w-full flex flex-col items-end gap-3 opacity-50"><div className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-primary">{status}</span></div></div></div>}
              </div>
            )}
          </div>

          <div className="p-6 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent absolute bottom-0 left-0 right-0 z-[60]">
            <div className="max-w-4xl mx-auto relative">
               <div className="absolute -top-12 left-0 flex items-center gap-2">
                    <div className="relative">
                        <button type="button" onClick={() => setShowModelPicker(!showModelPicker)} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#18181b] border border-white/5 text-[10px] font-black uppercase tracking-widest text-white hover:border-primary/40 transition-all shadow-2xl"><Cpu className="w-3.5 h-3.5 text-primary" />{MODELS.find(m => m.id === model)?.name || model}<ChevronDown className={clsx("w-3 h-3 opacity-40 transition-transform", showModelPicker && "rotate-180")} /></button>
                        <AnimatePresence>
                        {showModelPicker && (
                            <><div className="fixed inset-0 z-[70]" onClick={() => setShowModelPicker(false)} /><motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute bottom-full left-0 mb-4 w-[320px] bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden z-[80]"><div className="p-4 border-b border-white/5 bg-white/[0.02]"><div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2 border border-white/5"><Search className="w-3.5 h-3.5 text-muted-foreground" /><input autoFocus value={modelSearch} onChange={e => setModelSearch(e.target.value)} placeholder="Search engines..." className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-white focus:outline-none w-full" /></div></div><div className="max-h-[400px] overflow-y-auto no-scrollbar py-2">{providers.map(p => (<div key={p}><div className="px-5 py-2 text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] bg-white/[0.01]">{p}</div>{filteredModels.filter(m => m.provider === p).map(m => (<button key={m.id} type="button" onClick={() => { setModel(m.id); setShowModelPicker(false) }} className={clsx("w-full text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-between group", model === m.id ? "bg-white/5 text-primary" : "text-muted-foreground/60 hover:text-white")}><div className="flex flex-col gap-0.5"><span className={clsx(model === m.id && "text-white")}>{m.name}</span><span className="text-[8px] opacity-30 font-mono tracking-tighter group-hover:text-white/60">{m.id}</span></div>{model === m.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}</button>))}</div>))}</div></motion.div></>
                        )}
                        </AnimatePresence>
                    </div>
               </div>

               <form onSubmit={e => { e.preventDefault(); startAgent(input) }} className="relative bg-[#121214] border border-white/5 rounded-2xl shadow-2xl focus-within:border-primary/30 transition-all overflow-hidden">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAgent(input) } }} placeholder="Input parameters..." className="w-full bg-transparent px-6 py-7 text-sm focus:outline-none resize-none min-h-[90px] text-white placeholder:text-muted-foreground/20 font-medium" rows={1} />
                <div className="flex items-center justify-between px-6 pb-6"><div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20"><div className="flex items-center gap-2"><Command className="w-3 h-3" /><span>System active</span></div></div><button type="submit" disabled={!input.trim() || sending} className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all disabled:opacity-10 active:scale-95 shadow-2xl">{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{sending ? 'Processing' : 'Execute'}</button></div>
              </form>
            </div>
          </div>
        </div>

        <div className={clsx("flex-1 flex flex-col min-w-0 bg-[#09090b] relative border-l border-white/5", activeTab === 'sandbox' ? "flex" : "hidden")}>
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-white/[0.02]"><div className="flex items-center gap-2"><TerminalIcon className="w-4 h-4 text-primary" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Telemetry</span></div><button onClick={fetchLogs} className="p-1.5 hover:bg-white/5 rounded-md"><RefreshCcw className={clsx("w-3.5 h-3.5 text-muted-foreground", loadingLogs && "animate-spin")} /></button></div>
          <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] text-muted-foreground/60 space-y-4 no-scrollbar bg-black/40">
            {sandboxLogs.length === 0 ? (<div className="h-full flex flex-col items-center justify-center opacity-5"><TerminalIcon className="w-20 h-20 mb-6" /><p className="text-[10px] font-black uppercase tracking-[0.4em]">No data</p></div>) : (sandboxLogs.map((log, i) => (<div key={i} className="whitespace-pre-wrap break-words border-l border-white/10 pl-6 py-1 hover:border-primary transition-colors">{log.output}</div>)))}
          </div>
        </div>
      </div>
    </div>
  )
}
