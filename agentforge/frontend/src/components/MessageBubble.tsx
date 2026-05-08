'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  User,
  Terminal,
  CheckCircle2,
  Info,
  ChevronRight,
  Brain,
  FileText,
  Search,
  Code2,
  GitBranch,
  Globe,
  Eye,
  Cpu
} from 'lucide-react'
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

  const toolIcons: Record<string, any> = {
    'run_bash': Terminal,
    'write_file': Code2,
    'read_file': FileText,
    'list_files': Search,
    'search_files': Search,
    'analyze_codebase': Brain,
    'github_commit_and_push': GitBranch,
    'web_search': Globe,
  }

  const ToolIcon = msg.tool_name ? (toolIcons[msg.tool_name] || Terminal) : Terminal

  if (isInfo) return null // Suppress info slop

  if (isToolCall || isToolResult) {
    return (
      <div className={clsx(
          "my-1 max-w-3xl w-full px-4",
          "ml-auto" // Tools are agent-side (right)
      )}>
        <div
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            "flex items-center gap-3 py-2 px-3 rounded-lg border border-white/[0.03] bg-[#121214]/50 cursor-pointer hover:bg-[#18181b] transition-all group ml-auto max-w-[90%]",
            expanded ? "rounded-b-none border-b-0" : ""
          )}
        >
          <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/20">
            {isToolCall ? (
                <ToolIcon className="w-2.5 h-2.5 text-primary" />
            ) : (
                <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
             <div className="text-[10px] font-mono text-muted-foreground/60 flex items-center gap-2 uppercase tracking-tight">
               {isToolCall ? `step: ${msg.tool_name}` : 'output: captured'}
             </div>
          </div>
          <ChevronRight className={clsx("w-3 h-3 text-muted-foreground/20 transition-transform", expanded && "rotate-90")} />
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-[#09090b] border border-t-0 border-white/[0.03] rounded-b-lg ml-auto max-w-[90%]"
            >
              <div className="p-4 font-mono text-[10px] whitespace-pre-wrap break-words text-muted-foreground/80 leading-relaxed">
                {isToolCall ? JSON.stringify(msg.tool_input, null, 2) : msg.content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const hasSimulatedReasoning = msg.content?.includes('<thought>')
  const reasoningContent = msg.reasoning || (hasSimulatedReasoning ? msg.content.split('<thought>')[1].split('</thought>')[0] : null)
  const displayContent = hasSimulatedReasoning ? msg.content.split('</thought>')[1] : msg.content

  return (
    <div className={clsx(
      "py-6 px-4 w-full flex",
      isUser ? "justify-start" : "justify-end"
    )}>
      <div className={clsx(
          "max-w-2xl w-full flex flex-col gap-3",
          isUser ? "items-start" : "items-end text-right"
      )}>
        <div className={clsx("flex items-center gap-2 mb-1", isUser ? "flex-row" : "flex-row-reverse")}>
           <div className={clsx(
              "w-6 h-6 rounded flex items-center justify-center border border-white/10 shadow-lg",
              isUser ? "bg-white text-black" : "bg-primary text-primary-foreground"
           )}>
              {isUser ? <User className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
              {isUser ? 'Commander' : 'Executor'}
           </span>
           {!isUser && reasoningContent && (
                 <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold text-muted-foreground hover:text-white transition-colors"
                 >
                   <Eye className="w-2.5 h-2.5" />
                   {showReasoning ? 'Hide Reasoning' : 'View Reasoning'}
                 </button>
             )}
        </div>

        <AnimatePresence>
          {showReasoning && reasoningContent && (
              <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-muted-foreground/60 leading-relaxed italic text-left"
              >
                  {reasoningContent}
              </motion.div>
          )}
        </AnimatePresence>

        <div className={clsx(
            "prose prose-invert prose-zinc prose-sm max-w-none leading-relaxed p-4 rounded-2xl shadow-2xl",
            isUser ? "bg-white/[0.03] border border-white/5 rounded-tl-none text-left" : "bg-primary/5 border border-primary/10 rounded-tr-none text-left"
        )}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayContent || ''}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
