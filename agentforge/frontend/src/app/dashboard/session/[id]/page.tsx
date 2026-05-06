'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { getSession, getMessages, openAgentSocket, listFiles, getFile } from '@/lib/api'
import MessageBubble from '@/components/MessageBubble'
import FileTree from '@/components/FileTree'
import CodeEditor from '@/components/CodeEditor'
import {
  Send,
  Loader2,
  Layout,
  Code2,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Files,
  Cpu,
  Hash
} from 'lucide-react'
import clsx from 'clsx'

export default function SessionPage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [session, setSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [showExplorer, setShowExplorer] = useState(true)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Initial data
    Promise.all([
      getSession(id as string),
      getMessages(id as string)
    ]).then(([s, ms]) => {
      setSession(s)
      setMessages(ms)
      setLoading(false)

      // If query param exists, send it
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

    // Add user message locally
    const userMsg = { role: 'user', content: text, id: Date.now().toString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    // Open WebSocket
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
        ws.close()
      } else if (data.type === 'error') {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ ' + data.message, id: 'err-' + Date.now() }])
        setSending(false)
        ws.close()
      }
    }

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'start', message: text }))
    }

    ws.onerror = () => setSending(false)
    ws.onclose = () => setSending(false)
  }

  async function handleFileSelect(path: string) {
    if (!session?.repo_id) return
    setSelectedFile(path)
    try {
      // In the new workspace model, we need a way to read files from the workspace
      // For now, use the existing github file reader if available, or just show path
      // Actually, let's keep it simple - this view is for results.
    } catch (err) {}
  }

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
      <p className="mt-4 text-muted-foreground animate-pulse">Loading session...</p>
    </div>
  )

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar Explorer */}
      <div className={clsx(
        "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300",
        showExplorer ? "w-64" : "w-0 overflow-hidden border-0"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-border">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Files className="w-3.5 h-3.5" /> Workspace
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
           <div className="text-xs text-muted-foreground px-2 py-4 italic">
             {session?.repo ? "Isolated workspace active." : "No repository attached."}
           </div>
           {/* Future: Real-time FileTree from Workspace */}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Session Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/30 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 min-w-0">
             <button
              onClick={() => setShowExplorer(!showExplorer)}
              className="p-2 hover:bg-secondary rounded-md text-muted-foreground hidden lg:block"
            >
              <Layout className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">{session?.title}</h2>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Hash className="w-2.5 h-2.5" />
                <span>{session?.model.split('/')[1]}</span>
                {session?.repo && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="truncate">{session.repo.full_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sending && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase">Thinking</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mb-6">
                <Terminal className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2">Agent initialized and ready.</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask me to analyze code, fix bugs, or implement features in this repository.
              </p>
            </div>
          ) : (
            <div className="pb-12">
              {messages.map((m, i) => (
                <MessageBubble key={m.id || i} msg={m} />
              ))}
              {sending && (
                 <div className="max-w-3xl mx-auto w-full flex gap-6 py-8 px-4 md:px-0 opacity-50">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <Cpu className="w-5 h-5 text-primary-foreground animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-2 pt-2">
                      <div className="h-2 w-1/4 bg-secondary rounded animate-pulse" />
                      <div className="h-2 w-3/4 bg-secondary rounded animate-pulse" />
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 bg-background border-t border-border">
          <div className="max-w-3xl mx-auto relative group">
             <div className="absolute -top-12 left-0 right-0 flex justify-center opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                <div className="px-3 py-1 rounded-full bg-secondary border border-border text-[10px] text-muted-foreground">
                  Press <kbd className="font-sans font-bold">Shift + Enter</kbd> for new line
                </div>
             </div>
             <form
              onSubmit={e => { e.preventDefault(); startAgent(input) }}
              className="relative bg-card border border-border rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all overflow-hidden"
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    startAgent(input)
                  }
                }}
                placeholder="Message AgentForge..."
                className="w-full bg-transparent px-4 py-4 text-sm focus:outline-none resize-none min-h-[60px] max-h-[200px]"
                rows={1}
              />
              <div className="flex items-center justify-between px-4 pb-3">
                 <div className="flex items-center gap-2">
                   <div className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground cursor-pointer transition-colors">
                     <Code2 className="w-4 h-4" />
                   </div>
                 </div>
                 <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
          <div className="max-w-3xl mx-auto mt-2 text-center">
            <p className="text-[10px] text-muted-foreground">
              AgentForge can make mistakes. Verify important code before merging.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
