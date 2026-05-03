'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User, Terminal, WrenchIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { Message } from '@/lib/store'
import { useState } from 'react'
import clsx from 'clsx'

interface Props { msg: Message }

export default function MessageBubble({ msg }: Props) {
  const [toolOpen, setToolOpen] = useState(false)

  if (msg.thinking) {
    return (
      <div className="flex gap-3 px-4 py-3">
        <div className="w-7 h-7 bg-brand/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={14} className="text-brand" />
        </div>
        <div className="flex items-center gap-1 pt-1.5">
          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-brand" />
        </div>
      </div>
    )
  }

  if (msg.role === 'tool') {
    return (
      <div className="px-4 py-2">
        <button
          onClick={() => setToolOpen(!toolOpen)}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          {toolOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Terminal size={12} className="text-accent-green" />
          <span className="font-mono">{msg.tool_name}</span>
        </button>
        {toolOpen && (
          <div className="mt-2 ml-4 space-y-2">
            {msg.tool_input && (
              <div className="bg-bg-panel border border-bg-border rounded-lg p-3 font-mono text-xs text-slate-300 overflow-x-auto">
                <div className="text-slate-500 mb-1">Input:</div>
                <pre>{typeof msg.tool_input === 'string' ? msg.tool_input : JSON.stringify(msg.tool_input, null, 2)}</pre>
              </div>
            )}
            {msg.tool_output && (
              <div className="bg-bg-base border border-bg-border rounded-lg p-3 font-mono text-xs overflow-x-auto">
                <div className="text-slate-500 mb-1">Output:</div>
                <pre className={clsx(
                  typeof msg.tool_output === 'string' && msg.tool_output.toLowerCase().includes('error')
                    ? 'text-accent-red' : 'text-accent-green'
                )}>
                  {typeof msg.tool_output === 'string' ? msg.tool_output : JSON.stringify(msg.tool_output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (msg.role === 'user') {
    return (
      <div className="flex gap-3 px-4 py-3 justify-end">
        <div className="bg-brand/10 border border-brand/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
        <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <User size={13} className="text-slate-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="w-7 h-7 bg-brand/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={14} className="text-brand" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="agent-message text-sm text-slate-200 leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
