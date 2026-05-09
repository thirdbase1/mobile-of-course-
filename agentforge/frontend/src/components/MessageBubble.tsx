'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  User,
  Terminal,
  CheckCircle2,
  ChevronRight,
  Brain,
  Eye,
  Cpu,
  Code2,
  FileText,
  Search,
  GitBranch,
  Globe,
  ShieldAlert,
  Check,
  X
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageProps {
  msg: any;
  onApprove?: (tool: string, always: boolean) => void;
  onReject?: (tool: string) => void;
}

export default function MessageBubble({ msg, onApprove, onReject }: MessageProps) {
  const isUser = msg.role === 'user'
  const isToolCall = msg.role === 'tool_call'
  const isToolResult = msg.role === 'tool_result'
  const isApprovalRequest = msg.role === 'approval_request'
  const isInfo = msg.role === 'info'

  const [expanded, setExpanded] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const [alwaysAllow, setAlwaysAllow] = useState(false)

  const toolIcons: Record<string, any> = {
    'run_bash': Terminal,
    'run_bash_parallel': Terminal,
    'write_file': Code2,
    'write_files': Code2,
    'read_file': FileText,
    'list_files': Search,
    'search_files': Search,
    'analyze_codebase': Brain,
    'github_commit_and_push': GitBranch,
    'web_search': Globe,
  }

  const ToolIcon = msg.tool_name ? (toolIcons[msg.tool_name] || Terminal) : Terminal

  if (isInfo) return null

  if (isApprovalRequest) {
    return (
      <div className="my-6 max-w-2xl w-full px-4 mx-auto">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#121214] border-2 border-primary/20 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(var(--primary-rgb),0.1)]">
          <div className="p-6 bg-primary/5 border-b border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <div>
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Security Gate: Approval Required</h3>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Dangerous operation detected</p>
            </div>
          </div>
          <div className="p-6 space-y-6">
             <div className="space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target Tool</div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                   <ToolIcon className="w-4 h-4 text-primary" />
                   <span className="text-xs font-mono font-bold text-white tracking-tight">{msg.tool}</span>
                </div>
             </div>
             <div className="space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Input Parameters</div>
                <div className="p-4 rounded-xl bg-black/40 font-mono text-[10px] text-muted-foreground leading-relaxed whitespace-pre overflow-x-auto no-scrollbar border border-white/5">
                   {JSON.stringify(msg.args, null, 2)}
                </div>
             </div>

             <div className="flex items-center gap-3 py-2 cursor-pointer group" onClick={() => setAlwaysAllow(!alwaysAllow)}>
                <div className={clsx("w-4 h-4 rounded border transition-all flex items-center justify-center", alwaysAllow ? "bg-primary border-primary" : "border-white/20 group-hover:border-primary/50")}>
                   {alwaysAllow && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">Always allow {msg.tool}</span>
             </div>

             <div className="flex gap-3">
                <button
                  onClick={() => onApprove?.(msg.tool, alwaysAllow)}
                  className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  <Check className="w-4 h-4" /> Approve Execution
                </button>
                <button
                  onClick={() => onReject?.(msg.tool)}
                  className="px-8 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-white/5"
                >
                  <X className="w-4 h-4" /> Deny
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (isToolCall || isToolResult) {
    return (
      <div className="my-1 max-w-3xl w-full px-4 ml-auto">
        <div
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            "flex items-center gap-3 py-2 px-3 rounded-lg border border-white/[0.03] bg-[#121214]/50 cursor-pointer hover:bg-[#18181b] transition-all group ml-auto max-w-[90%]",
            expanded ? "rounded-b-none border-b-0" : ""
          )}
        >
          <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/20">
            {isToolCall ? <ToolIcon className="w-2.5 h-2.5 text-primary" /> : <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />}
          </div>
          <div className="flex-1 min-w-0">
             <div className="text-[10px] font-mono text-muted-foreground/60 flex items-center gap-2 uppercase tracking-tight">
               {isToolCall ? `process: ${msg.tool_name}` : 'telemetry: captured'}
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
              <div className="p-4 font-mono text-[10px] whitespace-pre-wrap break-words text-muted-foreground/80 leading-relaxed max-h-[400px] overflow-y-auto no-scrollbar">
                {isToolCall ? JSON.stringify(msg.tool_input, null, 2) : (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const reasoningContent = msg.reasoning || (msg.content?.includes('<thought>') ? msg.content.split('<thought>')[1].split('</thought>')[0] : null)
  const displayContent = msg.content?.includes('<thought>') ? msg.content.split('</thought>')[1] : msg.content

  return (
    <div className={clsx("py-8 px-4 w-full flex", isUser ? "justify-start" : "justify-end")}>
      <div className={clsx("max-w-2xl w-full flex flex-col gap-4", isUser ? "items-start" : "items-end text-right")}>
        <div className={clsx("flex items-center gap-2 mb-1", isUser ? "flex-row" : "flex-row-reverse")}>
           <div className={clsx("w-6 h-6 rounded flex items-center justify-center border border-white/10 shadow-lg", isUser ? "bg-white text-black" : "bg-primary text-primary-foreground")}>
              {isUser ? <User className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{isUser ? 'Commander' : 'Executor'}</span>
           {!isUser && reasoningContent && (
                 <button onClick={() => setShowReasoning(!showReasoning)} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold text-muted-foreground hover:text-white transition-colors">
                   <Eye className="w-2.5 h-2.5" /> {showReasoning ? 'Hide Intelligence' : 'View Reasoning'}
                 </button>
           )}
        </div>
        <AnimatePresence>
          {showReasoning && reasoningContent && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full p-5 bg-white/[0.01] border border-white/5 rounded-2xl text-xs text-muted-foreground/50 leading-relaxed italic text-left shadow-inner">
                  <div className="flex items-center gap-2 mb-3 text-[8px] font-black uppercase tracking-[0.4em] not-italic opacity-40"><Brain className="w-3 h-3" /> Core Logic Path</div>
                  {reasoningContent}
              </motion.div>
          )}
        </AnimatePresence>
        <div className={clsx("prose prose-invert prose-zinc prose-sm max-w-none leading-relaxed p-6 rounded-3xl shadow-2xl transition-all", isUser ? "bg-white/[0.02] border border-white/5 rounded-tl-none text-left" : "bg-primary/[0.03] border border-primary/10 rounded-tr-none text-left")}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent || ''}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
