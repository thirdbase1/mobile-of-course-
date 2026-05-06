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
  Brain
} from 'lucide-react'
import clsx from 'clsx'

export default function SessionPage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const [session, setSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('Idle')
  const [showExplorer, setShowExplorer] = useState(true)
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
    <div className="flex-1 flex overflow-hidden">
      <div className={clsx(
        "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300",
        showExplorer ? "w-64" : "w-0 overflow-hidden border-0"
      )}>
        <div className="p-4 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Files className="w-3.5 h-3.5" /> Workspace
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
           <div className="text-xs text-muted-foreground px-2 py-4 italic">
             {session?.repo ? "Sandbox active." : "Project sandbox active."}
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/30 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">{session?.title}</h2>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Hash className="w-2.5 h-2.5" />
                <span>{session?.model.split('/')[1]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sending && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase">{status}</span>
              </div>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
              <Terminal className="w-12 h-12 mb-4" />
              <p className="text-sm">Sandbox initialized. Awaiting commands.</p>
            </div>
          ) : (
            <div className="pb-12">
              {messages.map((m, i) => (
                <MessageBubble key={m.id || i} msg={m} />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-background border-t border-border">
          <div className="max-w-3xl mx-auto">
             <form
              onSubmit={e => { e.preventDefault(); startAgent(input) }}
              className="relative bg-card border border-border rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden"
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAgent(input) } }}
                placeholder="Instruct the agent..."
                className="w-full bg-transparent px-4 py-4 text-sm focus:outline-none resize-none min-h-[60px]"
                rows={1}
              />
              <div className="flex items-center justify-end px-4 pb-3">
                 <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
