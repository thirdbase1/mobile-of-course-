'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot, Terminal, CheckCircle2, Info, ChevronDown, ChevronRight, Brain, FileText } from 'lucide-react'
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

  if (isInfo) return null

  if (isToolCall || isToolResult) {
    return (
      <div className="my-2 px-4 md:px-0">
        <div
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            "flex items-center gap-3 p-3 rounded-xl border border-border bg-card/40 cursor-pointer hover:border-primary/30 transition-all",
            expanded ? "rounded-b-none border-b-0" : ""
          )}
        >
          {isToolCall ? (
            <Terminal className="w-4 h-4 text-primary" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          <div className="flex-1 min-w-0">
             <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5 opacity-60">
               {isToolCall ? 'Executing Operation' : 'Execution Log'}
             </div>
             <div className="text-xs font-mono truncate text-foreground flex items-center gap-2">
               {isToolCall ? `${msg.tool_name}` : 'Result received'}
             </div>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground opacity-40" /> : <ChevronRight className="w-4 h-4 text-muted-foreground opacity-40" />}
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-secondary/10 border border-t-0 border-border rounded-b-xl"
            >
              <div className="p-4 font-mono text-[11px] whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto no-scrollbar selection:bg-primary/20">
                {isToolCall ? (
                  <div>
                    <div className="text-muted-foreground mb-2 opacity-50 uppercase tracking-widest text-[9px] font-bold">Input Arguments</div>
                    {JSON.stringify(msg.tool_input, null, 2)}
                  </div>
                ) : (
                  <div>
                    <div className="text-muted-foreground mb-2 opacity-50 uppercase tracking-widest text-[9px] font-bold">Output Stream</div>
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

  const hasReasoning = msg.content?.includes('<thought>') || msg.reasoning
  const displayContent = msg.content?.includes('<thought>') ? msg.content.split('</thought>')[1] : msg.content
  const reasoningContent = msg.reasoning || (msg.content?.includes('<thought>') ? msg.content.split('<thought>')[1].split('</thought>')[0] : null)

  return (
    <div className={clsx(
      "flex flex-col gap-3 py-10 px-4 md:px-0",
      isUser ? "bg-background" : "bg-secondary/10 border-y border-border/30 shadow-inner"
    )}>
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        <div className="flex gap-6">
          <div className={clsx(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border",
            isUser ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground shadow-primary/20"
          )}>
            {isUser ? <User className="w-5.5 h-5.5" /> : <Bot className="w-5.5 h-5.5" />}
          </div>

          <div className="flex-1 min-w-0 prose prose-invert prose-zinc prose-sm max-w-none leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent || ''}
            </ReactMarkdown>
          </div>
        </div>

        {reasoningContent && (
          <div className="ml-15 border-l-2 border-border pl-6">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group"
            >
              <Brain className="w-3.5 h-3.5 group-hover:animate-pulse" />
              {showReasoning ? 'Collapse Reasoning' : 'Deep Thinking Analysis'}
            </button>
            <AnimatePresence>
              {showReasoning && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 p-5 bg-secondary/20 rounded-2xl border border-border/50 text-xs text-muted-foreground/80 leading-relaxed overflow-hidden font-medium"
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
