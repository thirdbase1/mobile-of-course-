'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useStore, ChatMessage, MODELS } from '@/lib/store'
import { getMessages, getSession, patchSession, openAgentSocket } from '@/lib/api'
import MessageBubble from '@/components/MessageBubble'
import ModelPicker from '@/components/ModelPicker'
import RepoSelector from '@/components/RepoSelector'
import CodeEditor from '@/components/CodeEditor'
import GitBar from '@/components/GitBar'
import clsx from 'clsx'

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()

  const {
    messages, setMessages, appendMessage, updateMessage, removeMessage,
    sessions, updateSession,
    model, setModel,
    editorOpen, setEditorOpen,
    repos,
  } = useStore()

  const [input,     setInput]     = useState('')
  const [running,   setRunning]   = useState(false)
  const [session,   setSession]   = useState<any>(null)
  const [repoId,    setRepoId]    = useState<string | undefined>()
  const [titleEdit, setTitleEdit] = useState(false)
  const [titleVal,  setTitleVal]  = useState('')

  const bottomRef    = useRef<HTMLDivElement>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const wsRef        = useRef<WebSocket | null>(null)
  const didAutoSend  = useRef(false)
  const thinkingId   = useRef<string>('')
  const streamingId  = useRef<string>('')
  const toolCallIds  = useRef<Set<string>>(new Set())

  // Load session + messages
  useEffect(() => {
    setMessages([])
    getSession(id).then(s => {
      setSession(s)
      setTitleVal(s.title)
      setRepoId(s.repo_id || undefined)
      setModel(s.model)
    }).catch(() => {})

    getMessages(id).then(rawMsgs => {
      const out: ChatMessage[] = []
      for (const m of rawMsgs) {
        if (m.role === 'user' || m.role === 'assistant') {
          out.push({ id: m.id, role: m.role, content: m.content || '', created_at: m.created_at })
        } else if (m.role === 'tool_call') {
          out.push({
            id: m.id, role: 'tool_call', tool_name: m.tool_name,
            tool_call_id: m.tool_call_id, tool_input: m.tool_input,
            created_at: m.created_at,
          })
        } else if (m.role === 'tool_result') {
          // Attach output to matching tool_call bubble
          const call = out.find(x => x.tool_call_id === m.tool_call_id || x.id === m.tool_call_id)
          if (call) call.tool_output = m.tool_output || ''
        }
      }
      setMessages(out)
    }).catch(() => {})
  }, [id])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Auto-send ?q= param
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !didAutoSend.current && messages.length === 0) {
      didAutoSend.current = true
      setTimeout(() => send(q), 400)
    }
  }, [messages])

  function stop() {
    wsRef.current?.close()
    wsRef.current = null
    setRunning(false)
    // Clean up any dangling thinking indicator
    if (thinkingId.current) {
      removeMessage(thinkingId.current)
      thinkingId.current = ''
    }
    updateSession(id, { status: 'idle' })
  }

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || running) return
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Reset tool tracking
    toolCallIds.current.clear()
    streamingId.current = ''

    // Optimistic user message
    const userMsgId = 'user_' + Date.now()
    appendMessage({ id: userMsgId, role: 'user', content, created_at: new Date().toISOString() })
    setRunning(true)
    updateSession(id, { status: 'running' })

    // Show thinking
    thinkingId.current = 'think_' + Date.now()
    appendMessage({ id: thinkingId.current, role: 'assistant', content: '', thinking: true, created_at: new Date().toISOString() })

    const ws = openAgentSocket(id)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'message', content, model, repo_id: repoId || null }))
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'message_start') {
        // Replace thinking dot with real streaming message
        if (thinkingId.current) {
          updateMessage(thinkingId.current, { thinking: false, id: data.id, streaming: true, content: '' })
          thinkingId.current = ''
        }
        streamingId.current = data.id

      } else if (data.type === 'token') {
        if (streamingId.current) {
          updateMessage(streamingId.current, { streaming: true })
          // Append token using functional form to avoid stale closure
          useStore.setState(st => ({
            messages: st.messages.map(m =>
              m.id === streamingId.current
                ? { ...m, content: (m.content || '') + data.content, streaming: true }
                : m
            )
          }))
        }

      } else if (data.type === 'tool_call') {
        // Finalize streaming assistant message
        if (streamingId.current) {
          updateMessage(streamingId.current, { streaming: false })
          streamingId.current = ''
        }
        // Remove stale thinking dot if any
        if (thinkingId.current) {
          removeMessage(thinkingId.current)
          thinkingId.current = ''
        }
        // Add tool call bubble
        toolCallIds.current.add(data.id)
        appendMessage({
          id:          data.id,
          role:        'tool_call',
          tool_name:   data.tool_name,
          tool_call_id: data.tc_id,
          tool_input:  data.tool_input,
          created_at:  new Date().toISOString(),
        })
        // Show new thinking for agent's next response
        thinkingId.current = 'think_' + Date.now()
        appendMessage({ id: thinkingId.current, role: 'assistant', content: '', thinking: true, created_at: new Date().toISOString() })

      } else if (data.type === 'tool_result') {
        updateMessage(data.id, { tool_output: data.output })

      } else if (data.type === 'done') {
        if (streamingId.current) updateMessage(streamingId.current, { streaming: false })
        if (thinkingId.current) { removeMessage(thinkingId.current); thinkingId.current = '' }
        streamingId.current = ''
        ws.close()
        setRunning(false)
        updateSession(id, { status: 'idle' })

      } else if (data.type === 'error') {
        if (streamingId.current) {
          updateMessage(streamingId.current, { streaming: false, error: data.message })
        } else if (thinkingId.current) {
          updateMessage(thinkingId.current, { thinking: false, error: data.message })
          thinkingId.current = ''
        } else {
          appendMessage({ id: 'err_' + Date.now(), role: 'assistant', content: '', error: data.message, created_at: new Date().toISOString() })
        }
        streamingId.current = ''
        ws.close()
        setRunning(false)
        updateSession(id, { status: 'error' })
      }
    }

    ws.onerror = () => {
      if (thinkingId.current) { removeMessage(thinkingId.current); thinkingId.current = '' }
      if (streamingId.current) updateMessage(streamingId.current, { streaming: false, error: 'Connection error' })
      setRunning(false)
      updateSession(id, { status: 'error' })
    }

    ws.onclose = () => {
      if (thinkingId.current) { removeMessage(thinkingId.current); thinkingId.current = '' }
      if (streamingId.current) updateMessage(streamingId.current, { streaming: false })
      streamingId.current = ''
    }
  }, [input, running, model, repoId, id])

  async function saveTitle() {
    setTitleEdit(false)
    if (!titleVal.trim() || titleVal === session?.title) return
    await patchSession(id, { title: titleVal }).catch(() => {})
    updateSession(id, { title: titleVal })
    setSession((s: any) => s ? { ...s, title: titleVal } : s)
  }

  async function changeRepo(rid: string | undefined) {
    setRepoId(rid)
    await patchSession(id, { repo_id: rid || null }).catch(() => {})
  }

  const activeRepo = repos.find(r => r.id === repoId)

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden">
      {/* Chat column */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface-1 shrink-0 flex-wrap gap-y-2">
          {/* Session title */}
          {titleEdit ? (
            <input
              autoFocus
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle() }}
              className="bg-surface-0 border border-brand/40 rounded px-2 py-1 text-sm font-medium outline-none flex-1 min-w-0 max-w-xs"
            />
          ) : (
            <button
              onClick={() => setTitleEdit(true)}
              className="text-sm font-medium text-text-primary hover:text-brand transition-colors truncate max-w-xs"
              title="Click to rename"
            >
              {session?.title || 'Session'}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <ModelPicker />
            <RepoSelector value={repoId} onChange={changeRepo} compact />

            {activeRepo && (
              <GitBar repoId={activeRepo.id} repoFull={activeRepo.full_name} branch={activeRepo.default_branch} />
            )}

            <button
              onClick={() => setEditorOpen(!editorOpen)}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors border',
                editorOpen
                  ? 'bg-brand/15 border-brand/35 text-brand'
                  : 'bg-surface-3 border-border text-text-muted hover:text-text-primary hover:border-border-strong'
              )}
              title="Toggle code editor"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
              Editor
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm gap-2">
              <span className="text-2xl opacity-30">⚡</span>
              <p>Send a message to start the agent</p>
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border bg-surface-1 px-4 py-3">
          <div className={clsx(
            'flex gap-2 bg-surface-0 border rounded-xl p-2 transition-colors',
            running ? 'border-brand/40' : 'border-border focus-within:border-brand/40'
          )}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
              }}
              placeholder={running ? 'Agent is working…' : 'Message the agent… (Enter to send, Shift+Enter for newline)'}
              disabled={running}
              rows={1}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none resize-none max-h-40 disabled:opacity-50 leading-relaxed"
            />
            {running ? (
              <button
                onClick={stop}
                className="self-end flex items-center gap-1.5 bg-red/10 hover:bg-red/15 text-red border border-red/25 px-3 py-2 rounded-lg text-xs font-medium transition-colors shrink-0"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                Stop
              </button>
            ) : (
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className="self-end flex items-center gap-1.5 bg-brand hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-xs font-semibold transition-opacity shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Send
              </button>
            )}
          </div>
          <p className="text-text-muted text-[10px] mt-1.5 text-center">
            Agent can run code, read/write GitHub files, and create PRs
          </p>
        </div>
      </div>

      {/* Code editor panel */}
      {editorOpen && (
        <div className="flex-shrink-0 border-l border-border" style={{ width: 460 }}>
          <CodeEditor />
        </div>
      )}
    </div>
  )
}
