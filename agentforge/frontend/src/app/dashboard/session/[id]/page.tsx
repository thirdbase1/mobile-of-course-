'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { getSession, getMessages, openAgentSocket } from '@/lib/api'
import MessageBubble from '@/components/MessageBubble'
import {
  Send,
  Loader2,
  Layout,
  Code2,
  Terminal,
  Files,
  Cpu,
  Hash,
  Brain,
  MessageSquare,
  ChevronDown
} from 'lucide-react'
import { useStore, MODELS } from '@/lib/store'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function SessionPage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const { model, setModel } = useStore()

  const [session, setSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('Idle')

  const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat')
  const [showModelPicker, setShowModelPicker] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    Promise.all([
      getSession(id as string),
      getMessages(id as string)
    ]).then(([s, ms]) => {
      setSession(s)
      setMessages(ms)
      setLoading(false)
      const q = searchParams.get('q')
      if (q) startAgent(q)
    })
    return () => wsRef.current?.close()
  }, [id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function startAgent(text: string) {
    if (!text.trim() || sending) return
    const userMsg = { role: 'user', content: text, id: Date.now().toString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    setStatus('Thinking...')

    if (wsRef.current) wsRef.current.close()
    const ws = openAgentSocket(id as string)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'token') {
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.id === data.id) {
            return [...prev.slice(0, -1), { ...last, content: (last.content || '') + data.content }]
          }
          return [...prev, { role: 'assistant', content: data.content, id: data.id }]
        })
      } else if (data.type === 'status') {
        setStatus(data.message)
      } else if (data.type === 'message_start') {
         setMessages(prev => [...prev, { role: 'assistant', content: '', id: data.id }])
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
      } else if (data.type === 'info') {
        setMessages(prev => [...prev, { role: 'info', content: data.message }])
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
    ws.onopen = () => ws.send(JSON.stringify({ type: 'start', message: text }))
    ws.onerror = () => { setSending(false); setStatus('Error') }
    ws.onclose = () => { setSending(false); setStatus('Idle') }
  }

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-border bg-card/30">
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
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Files) / Mobile Code View */}
        <div className={clsx(
          "flex-col border-r border-border bg-card transition-all duration-300 overflow-hidden",
          "md:flex md:w-64",
          activeTab === 'code' ? "flex fixed inset-0 z-50 md:relative" : "hidden"
        )}>
          {/* Mobile Back to Chat */}
          <div className="md:hidden p-4 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest">Workspace</span>
            <button onClick={() => setActiveTab('chat')} className="p-1 bg-secondary rounded-md text-[10px] px-2 uppercase font-bold">Back to Chat</button>
          </div>

          <div className="p-4 border-b border-border hidden md:flex items-center gap-2">
            <Files className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Explorer</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
             <div className="text-[11px] text-muted-foreground px-2 py-4 italic opacity-50">
               Project sandbox initialized.
             </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className={clsx(
          "flex-1 flex flex-col min-w-0 bg-background transition-opacity duration-300",
          activeTab === 'code' ? "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto" : "opacity-100"
        )}>
          <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-card/20">
            <div className="flex items-center gap-2">
               <div className={clsx("w-1.5 h-1.5 rounded-full", sending ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{status}</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-20">
                <MessageSquare className="w-12 h-12 mb-4" />
                <p className="text-sm font-medium">Ready for your instructions.</p>
              </div>
            ) : (
              <div className="pb-24">
                {messages.map((m, i) => (
                  <MessageBubble key={m.id || i} msg={m} />
                ))}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gradient-to-t from-background via-background to-transparent absolute bottom-0 left-0 right-0">
            <div className="max-w-3xl mx-auto relative">
               <form
                onSubmit={e => { e.preventDefault(); startAgent(input) }}
                className="relative bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl focus-within:ring-1 focus-within:ring-primary/40 transition-all overflow-hidden"
              >
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAgent(input) } }}
                  placeholder="Ask anything..."
                  className="w-full bg-transparent px-4 py-5 text-sm focus:outline-none resize-none min-h-[64px]"
                  rows={1}
                />

                <div className="flex items-center justify-between px-4 pb-4">
                   <div className="relative">
                     <button
                      type="button"
                      onClick={() => setShowModelPicker(!showModelPicker)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-[10px] font-bold uppercase tracking-tighter text-muted-foreground hover:text-foreground transition-colors"
                     >
                       <Cpu className="w-3 h-3" />
                       {model.split('/')[1]}
                       <ChevronDown className="w-3 h-3" />
                     </button>

                     <AnimatePresence>
                       {showModelPicker && (
                         <motion.div
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 mb-2 w-48 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100]"
                         >
                           {MODELS.map(m => (
                             <button
                              key={m.id}
                              onClick={() => { setModel(m.id); setShowModelPicker(false) }}
                              className={clsx("w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors", model === m.id ? "bg-secondary" : "")}
                             >
                               {m.name}
                             </button>
                           ))}
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>

                   <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-20 shadow-lg shadow-primary/20"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
