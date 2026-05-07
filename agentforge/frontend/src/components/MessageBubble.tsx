'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  User,
  Bot,
  Terminal,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronRight,
  Brain,
  FileText,
  Sparkles,
  Search,
  Code2,
  GitBranch,
  Globe,
  Settings,
  Cpu,
  ArrowRight,
  Eye
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

  // Tool Icons Mapping
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
      <div className="my-1 max-w-3xl mx-auto w-full px-4">
        <div
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            "flex items-center gap-3 py-2 px-3 rounded-lg border border-white/[0.03] bg-[#121214]/50 cursor-pointer hover:bg-[#18181b] transition-all group",
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
               {isToolCall && msg.tool_input?.command && (
                 <span className="text-[9px] opacity-40 truncate max-w-[200px] normal-case">
                   $ {msg.tool_input.command}
                 </span>
               )}
             </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[8px] font-bold text-muted-foreground/20 group-hover:text-muted-foreground/40 uppercase tracking-widest">
                {expanded ? 'Hide Detail' : 'View Detail'}
             </span>
             <ChevronRight className={clsx("w-3 h-3 text-muted-foreground/20 transition-transform", expanded && "rotate-90")} />
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-[#09090b] border border-t-0 border-white/[0.03] rounded-b-lg shadow-inner"
            >
              <div className="p-4 font-mono text-[10px] whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto no-scrollbar text-muted-foreground/80 leading-relaxed">
                {isToolCall ? (
                    <div className="space-y-2">
                        <div className="text-primary/40 font-bold uppercase tracking-[0.2em] text-[8px]">Parameters</div>
                        {JSON.stringify(msg.tool_input, null, 2)}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="text-green-500/40 font-bold uppercase tracking-[0.2em] text-[8px]">Result</div>
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

  const hasNativeReasoning = !!msg.reasoning
  const hasSimulatedReasoning = msg.content?.includes('<thought>')
  const reasoningContent = msg.reasoning || (hasSimulatedReasoning ? msg.content.split('<thought>')[1].split('</thought>')[0] : null)
  const displayContent = hasSimulatedReasoning ? msg.content.split('</thought>')[1] : msg.content

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
             {!isUser && (
                 <div className="w-1 h-1 rounded-full bg-white/10 mx-1" />
             )}
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
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-muted-foreground/60 leading-relaxed overflow-hidden italic font-medium"
                >
                    <div className="flex items-center gap-2 mb-2 text-primary/40 font-bold uppercase tracking-[0.2em] text-[8px] not-italic">
                        <Brain className="w-2.5 h-2.5" />
                        Hidden Thought Process
                    </div>
                    {reasoningContent}
                </motion.div>
            )}
          </AnimatePresence>

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
