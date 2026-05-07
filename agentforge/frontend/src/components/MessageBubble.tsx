'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot, Terminal, CheckCircle2, Info, ChevronDown, ChevronRight, Brain, FileText, Sparkles } from 'lucide-react'
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

  // Try to parse tool result for diff stats
  let diffStats: { added: number, removed: number, path: string } | null = null
  if (isToolResult && msg.content) {
    try {
      const data = JSON.parse(msg.content)
      if (data.added !== undefined && data.removed !== undefined) {
        diffStats = data
      }
    } catch {}
  }

  if (isInfo) {
    return (
      <div className="flex justify-center my-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          <Info className="w-3 h-3 text-blue-400" />
          {msg.content}
        </div>
      </div>
    )
  }

  if (isToolCall || isToolResult) {
    return (
      <div className="my-2 max-w-3xl mx-auto w-full px-4">
        <div
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            "flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-[#18181b]/50 cursor-pointer hover:bg-[#18181b] transition-all",
            expanded ? "rounded-b-none border-b-0" : ""
          )}
        >
          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
            {isToolCall ? (
                <Terminal className="w-3 h-3 text-primary" />
            ) : (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
             <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
               {isToolCall ? `exec: ${msg.tool_name}` : 'output: success'}

               {diffStats && (
                 <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-green-500">+${diffStats.added}</span>
                    <span className="text-red-500">-${diffStats.removed}</span>
                 </div>
               )}
             </div>
          </div>
          <ChevronRight className={clsx("w-3 h-3 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-[#18181b]/30 border border-t-0 border-white/5 rounded-b-xl"
            >
              <div className="p-4 font-mono text-[10px] whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto no-scrollbar text-muted-foreground/80">
                {isToolCall ? JSON.stringify(msg.tool_input, null, 2) : (diffStats ? `Updated ${diffStats.path}` : msg.content)}
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
      "py-8 px-4",
      isUser ? "" : ""
    )}>
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
             <div className={clsx(
                "w-5 h-5 rounded-md flex items-center justify-center border border-white/10",
                isUser ? "bg-white/5" : "bg-primary text-primary-foreground"
             )}>
                {isUser ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {isUser ? 'User' : 'AgentForge'}
             </span>
          </div>

          {reasoningContent && (
            <div className="mb-4">
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
                >
                  <Brain className={clsx("w-3 h-3", showReasoning && "text-primary")} />
                  {showReasoning ? 'Hide Thought Process' : 'Show Thought Process'}
                </button>
                <AnimatePresence>
                  {showReasoning && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pl-4 border-l border-white/10 text-xs text-muted-foreground/60 leading-relaxed overflow-hidden italic"
                    >
                      {reasoningContent}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          )}

          <div className="prose prose-invert prose-zinc prose-xs max-w-none leading-relaxed text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent || ''}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
