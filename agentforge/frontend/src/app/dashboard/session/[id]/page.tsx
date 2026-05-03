'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Send, Square, RotateCcw, Copy, Check, Paperclip } from 'lucide-react'
import MessageBubble from '@/components/MessageBubble'
import ModelPicker from '@/components/ModelPicker'
import { useStore, Message } from '@/lib/store'
import { getMessages, openAgentSocket } from '@/lib/api'
import clsx from 'clsx'

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { messages, setMessages, appendMessage, updateLastMessage, updateSession, selectedModel } = useStore()

  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const didAutoSend = useRef(false)

  useEffect(() => {
    getMessages(id).then(setMessages).catch(() => setMessages([]))
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-send prompt from URL (new session from dashboard)
  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (prompt && !didAutoSend.current && messages.length === 0) {
      didAutoSend.current = true
      setTimeout(() => send(prompt), 300)
    }
  }, [messages])

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || running) return
    setInput('')

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    appendMessage(userMsg)
    setRunning(true)
    updateSession(id, { status: 'running' })

    // Thinking indicator
    const thinkingId = Date.now().toString() + '_t'
    appendMessage({ id: thinkingId, role: 'assistant', content: '', thinking: true, created_at: new Date().toISOString() })

    const ws = openAgentSocket(id)
    wsRef.current = ws
    let firstChunk = true
    let assistantId = ''

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'token') {
        if (firstChunk) {
          firstChunk = false
          updateLastMessage({ thinking: false, content: data.content, id: assistantId || thinkingId })
        } else {
          updateLastMessage({ content: (messages.find(m => m.id === assistantId)?.content ?? '') + data.content })
        }
      } else if (data.type === 'message_start') {
        assistantId = data.id
      } else if (data.type === 'tool_call') {
        appendMessage({
          id: data.id,
          role: 'tool',
          content: '',
          tool_name: data.tool_name,
          tool_input: data.tool_input,
          created_at: new Date().toISOString(),
        })
        // New thinking dot after tool
        appendMessage({ id: Date.now().toString() + '_t2', role: 'assistant', content: '', thinking: true, created_at: new Date().toISOString() })
        firstChunk = true
      } else if (data.type === 'tool_result') {
        setMessages(prev => prev.map(m => m.id === data.id ? { ...m, tool_output: data.output } : m))
      } else if (data.type === 'done') {
        ws.close()
        setRunning(false)
        updateSession(id, { status: 'idle' })
        // Remove any leftover thinking dots
        setMessages(prev => prev.filter(m => !m.thinking))
      } else if (data.type === 'error') {
        updateLastMessage({ thinking: false, content: `**Error:** ${data.message}` })
        ws.close()
        setRunning(false)
        updateSession(id, { status: 'error' })
      }
    }

    ws.onerror = () => {
      setRunning(false)
      updateLastMessage({ thinking: false, content: '**Connection error.** Please try again.' })
      updateSession(id, { status: 'error' })
    }

    // Send user message
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'message', content, model: selectedModel }))
    }
  }, [input, running, id, selectedModel, messages])

  function stop() {
    wsRef.current?.close()
    setRunning(false)
    setMessages(prev => prev.filter(m => !m.thinking))
    updateSession(id, { status: 'idle' })
  }

  function copyLast() {
    const last = [...messages].reverse().find(m => m.role === 'assistant' && m.content)
    if (last) {
      navigator.clipboard.writeText(last.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border bg-bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <ModelPicker />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyLast} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-bg-panel transition-colors">
            {copied ? <><Check size={12} className="text-accent-green" /> Copied</> : <><Copy size={12} /> Copy last</>}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
            <p>Send a message to start the agent</p>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-4 border-t border-bg-border bg-bg-surface">
        <div className={clsx(
          'flex gap-2 bg-bg-base border rounded-xl p-2 transition-colors',
          running ? 'border-brand/50' : 'border-bg-border focus-within:border-brand'
        )}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={running ? 'Agent is working…' : 'Ask the agent anything… (Enter to send, Shift+Enter for newline)'}
            disabled={running}
            rows={1}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder-slate-600 resize-none max-h-40 disabled:opacity-50"
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 160) + 'px'
            }}
          />
          {running ? (
            <button onClick={stop} className="bg-accent-red/10 hover:bg-accent-red/20 text-accent-red border border-accent-red/30 px-3 py-2 rounded-lg transition-colors self-end">
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={() => send()}
              disabled={!input.trim()}
              className="bg-brand hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors self-end"
            >
              <Send size={14} />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">Agent can execute code, read/write files, and interact with GitHub</p>
      </div>
    </div>
  )
}
