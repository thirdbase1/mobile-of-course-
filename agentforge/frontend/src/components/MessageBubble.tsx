'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot, Terminal, CheckCircle2, AlertCircle, Info, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageProps {
  msg: any
  onToolClick?: (tcId: string) => void
}

export default function MessageBubble({ msg, onToolClick }: MessageProps) {
  const isUser = msg.role === 'user'
  const isAssistant = msg.role === 'assistant'
  const isToolCall = msg.role === 'tool_call'
  const isToolResult = msg.role === 'tool_result'
  const isInfo = msg.role === 'info'

  const [expanded, setExpanded] = useState(false)

  if (isInfo) {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-[11px] text-muted-foreground">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          {msg.content}
        </div>
      </div>
    )
  }

  if (isToolCall || isToolResult) {
    return (
      <div className="my-2 px-4 md:px-0">
        <div
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            "flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50 cursor-pointer hover:border-primary/30 transition-all",
            expanded ? "rounded-b-none border-b-0" : ""
          )}
        >
          {isToolCall ? (
            <Terminal className="w-4 h-4 text-primary" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          <div className="flex-1 min-w-0">
             <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
               {isToolCall ? 'Executing Tool' : 'Tool Result'}
             </div>
             <div className="text-xs font-mono truncate text-foreground">
               {isToolCall ? `${msg.tool_name}(${JSON.stringify(msg.tool_input || {}).slice(0, 40)}...)` : 'Operation Complete'}
             </div>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-secondary/20 border border-t-0 border-border rounded-b-xl"
            >
              <div className="p-4 font-mono text-[11px] whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto no-scrollbar selection:bg-primary/20">
                {isToolCall ? JSON.stringify(msg.tool_input, null, 2) : msg.content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={clsx(
      "flex flex-col gap-3 py-8 px-4 md:px-0",
      isUser ? "bg-background" : "bg-secondary/20 border-y border-border/50"
    )}>
      <div className="max-w-3xl mx-auto w-full flex gap-6">
        <div className={clsx(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
          isUser ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"
        )}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0 prose prose-invert prose-zinc max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.content || ''}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
