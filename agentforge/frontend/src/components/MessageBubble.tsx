'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot, Terminal, CheckCircle2, Info, ChevronDown, ChevronRight, Brain } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageProps {
  msg: any
}

export default function MessageBubble({ msg }: MessageProps) {
  const isUser = msg.role === 'user'
  const isToolCall = msg.role === 'tool_call'
  const isToolResult = msg.role === 'tool_result'
  const isInfo = msg.role === 'info'

  const [expanded, setExpanded] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)

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
               {isToolCall ? 'Executing Operation' : 'Execution Log'}
             </div>
             <div className="text-xs font-mono truncate text-foreground">
               {isToolCall ? `${msg.tool_name}` : 'Result received'}
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
                {isToolCall ? (
                  <div>
                    <div className="text-muted-foreground mb-1">Arguments:</div>
                    {JSON.stringify(msg.tool_input, null, 2)}
                  </div>
                ) : (
                  <div>
                    <div className="text-muted-foreground mb-1">Output:</div>
                    {msg.content}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Handle reasoning if present in content (some models use <thought> or similar)
  const hasReasoning = msg.content?.includes('<thought>')
  const displayContent = hasReasoning ? msg.content.split('</thought>')[1] : msg.content
  const reasoningContent = hasReasoning ? msg.content.split('<thought>')[1].split('</thought>')[0] : null

  return (
    <div className={clsx(
      "flex flex-col gap-3 py-8 px-4 md:px-0",
      isUser ? "bg-background" : "bg-secondary/20 border-y border-border/50"
    )}>
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
        <div className="flex gap-6">
          <div className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
            isUser ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"
          )}>
            {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0 prose prose-invert prose-zinc max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent || ''}
            </ReactMarkdown>
          </div>
        </div>

        {reasoningContent && (
          <div className="ml-14">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <Brain className="w-3.5 h-3.5" />
              {showReasoning ? 'Hide Reasoning' : 'View Reasoning'}
            </button>
            <AnimatePresence>
              {showReasoning && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 p-4 bg-secondary/30 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed overflow-hidden"
                >
                  {reasoningContent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
