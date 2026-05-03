'use client'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChatMessage } from '@/lib/store'
import clsx from 'clsx'

interface Props { msg: ChatMessage }

// ── Thinking indicator ──────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="w-6 h-6 rounded-full bg-brand/15 border border-brand/25 flex items-center justify-center shrink-0">
        <span className="text-brand text-[10px]">A</span>
      </div>
      <div className="flex items-center gap-1 pl-1">
        {[0,1,2].map(i => (
          <span key={i} className="thinking-dot w-1.5 h-1.5 rounded-full bg-brand/50 inline-block" />
        ))}
      </div>
    </div>
  )
}

// ── Tool call card ──────────────────────────────────────────────────────────
function ToolCard({ msg }: { msg: ChatMessage }) {
  const [open, setOpen] = useState(false)
  const hasOutput = !!msg.tool_output
  const isError   = msg.tool_output?.toLowerCase().includes('error') || msg.tool_output?.toLowerCase().includes('failed')
  const statusColor = !hasOutput ? 'text-text-muted' : isError ? 'text-red' : 'text-green'

  // Tool icon map
  const icons: Record<string, string> = {
    execute_code:       '⚙',
    github_read_file:   '📄',
    github_write_file:  '✏',
    github_list_files:  '📁',
    github_delete_file: '🗑',
    github_search_code: '🔍',
    github_create_branch: '⎇',
    github_create_pr:   '↑',
    github_list_commits:'📋',
    web_search:         '🌐',
    fetch_url:          '🔗',
  }

  const icon = icons[msg.tool_name || ''] || '🛠'

  return (
    <div className="mx-4 my-1.5">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs transition-colors text-left',
          open
            ? 'bg-surface-3 border-border'
            : 'bg-surface-2 border-border hover:border-border-strong'
        )}
      >
        <span className="text-sm shrink-0">{icon}</span>
        <span className="font-mono font-medium text-text-secondary flex-1 truncate">{msg.tool_name}</span>
        {hasOutput ? (
          <span className={clsx('shrink-0 text-[10px] font-medium', statusColor)}>
            {isError ? '✕ error' : '✓ done'}
          </span>
        ) : (
          <span className="w-3 h-3 border border-brand/50 border-t-brand rounded-full animate-spin shrink-0" />
        )}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={clsx('text-text-muted shrink-0 transition-transform', open && 'rotate-180')}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="mt-1 rounded-lg border border-border overflow-hidden text-xs font-mono">
          {msg.tool_input && Object.keys(msg.tool_input).length > 0 && (
            <div className="bg-surface-1 border-b border-border">
              <div className="px-3 py-1.5 text-text-muted text-[10px] uppercase tracking-wider font-sans font-semibold">Input</div>
              <div className="px-3 pb-2.5 overflow-x-auto">
                {msg.tool_name === 'execute_code' && msg.tool_input.code ? (
                  <div>
                    {msg.tool_input.language && (
                      <span className="text-brand text-[10px] font-sans font-medium">{msg.tool_input.language}</span>
                    )}
                    <pre className="text-text-secondary leading-relaxed mt-1 text-[11.5px]">{msg.tool_input.code}</pre>
                  </div>
                ) : (
                  <pre className="text-text-secondary leading-relaxed text-[11.5px]">
                    {JSON.stringify(msg.tool_input, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
          {hasOutput && (
            <div className="bg-surface-0">
              <div className="px-3 py-1.5 text-text-muted text-[10px] uppercase tracking-wider font-sans font-semibold">Output</div>
              <div className="px-3 pb-2.5 overflow-x-auto max-h-64">
                <pre className={clsx('leading-relaxed text-[11.5px] whitespace-pre-wrap', isError ? 'text-red/90' : 'text-green/90')}>
                  {msg.tool_output}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function MessageBubble({ msg }: Props) {
  if (msg.thinking)     return <ThinkingDots />
  if (msg.role === 'tool_call' || msg.role === 'tool_result') return <ToolCard msg={msg} />

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="max-w-[78%] bg-brand/10 border border-brand/20 rounded-2xl rounded-tr-sm px-4 py-2.5">
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex gap-2.5 px-4 py-2 animate-fade-up">
      <div className="w-6 h-6 rounded-full bg-brand/15 border border-brand/25 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-brand text-[10px] font-bold">A</span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className={clsx('prose-agent text-sm text-text-primary', msg.streaming && 'stream-cursor')}>
          {msg.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          ) : (
            !msg.streaming && <span className="text-text-muted italic text-xs">…</span>
          )}
        </div>
        {msg.error && (
          <div className="mt-2 text-xs text-red bg-red/10 border border-red/20 rounded-lg px-3 py-2">
            {msg.error}
          </div>
        )}
      </div>
    </div>
  )
}
