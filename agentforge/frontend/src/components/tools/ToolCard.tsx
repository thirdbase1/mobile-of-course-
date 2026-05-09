'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui'
import { ChevronDown, Copy, Zap } from 'lucide-react'

export type ToolType = 'read_file' | 'write_file' | 'run_command' | 'git_commit' | 'api_call' | 'search_repo' | 'test_run'

export interface ToolCardProps {
  id: string
  tool: ToolType
  status: 'idle' | 'running' | 'success' | 'error'
  description: string
  input?: Record<string, any>
  output?: string
  error?: string
  duration?: number
  onApprove?: () => void
  onDeny?: () => void
  expanded?: boolean
  onToggleExpand?: () => void
}

const toolConfig: Record<ToolType, { label: string; icon: string; color: string }> = {
  read_file: { label: 'Read File', icon: '📄', color: 'text-blue-400' },
  write_file: { label: 'Write File', icon: '✏️', color: 'text-green-400' },
  run_command: { label: 'Run Command', icon: '⚡', color: 'text-yellow-400' },
  git_commit: { label: 'Git Commit', icon: '🔗', color: 'text-purple-400' },
  api_call: { label: 'API Call', icon: '🌐', color: 'text-cyan-400' },
  search_repo: { label: 'Search Repo', icon: '🔍', color: 'text-orange-400' },
  test_run: { label: 'Run Tests', icon: '✓', color: 'text-green-400' },
}

/**
 * ToolCard - Visualizes a single AI tool execution
 * Shows tool type, status, input/output, and approval controls
 * Part of the AI Execution Timeline system
 */
export function ToolCard({
  id,
  tool,
  status,
  description,
  input,
  output,
  error,
  duration,
  onApprove,
  onDeny,
  expanded = false,
  onToggleExpand,
}: ToolCardProps) {
  const config = toolConfig[tool]

  return (
    <div
      className={cn(
        'border border-border rounded-lg overflow-hidden transition-all',
        status === 'running' ? 'border-accent/50 bg-accent/5' : 'bg-surface-tertiary'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-surface-primary border-b border-border">
        <button
          onClick={onToggleExpand}
          className="flex-shrink-0 p-1 hover:bg-surface-secondary rounded transition-colors"
        >
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              expanded ? 'rotate-180' : ''
            )}
          />
        </button>

        <span className="text-lg">{config.icon}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{config.label}</p>
          <p className="text-xs text-foreground-tertiary truncate">{description}</p>
        </div>

        <StatusBadge status={status} />

        {duration && status === 'success' && (
          <span className="text-xs text-foreground-tertiary">{duration}ms</span>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <>
          {/* Input Section */}
          {input && Object.keys(input).length > 0 && (
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-foreground mb-2">Input</p>
              <div className="bg-[#1e1e1e] rounded p-2 font-mono text-xs text-foreground-secondary overflow-x-auto max-h-32 overflow-y-auto">
                <pre>{JSON.stringify(input, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Output Section */}
          {output && (
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-foreground mb-2">Output</p>
              <div className="bg-[#1e1e1e] rounded p-2 font-mono text-xs text-foreground-secondary overflow-x-auto max-h-32 overflow-y-auto">
                <pre>{output}</pre>
              </div>
            </div>
          )}

          {/* Error Section */}
          {error && (
            <div className="px-3 py-2 border-b border-border bg-destructive/10">
              <p className="text-xs font-semibold text-destructive mb-2">Error</p>
              <div className="bg-[#1e1e1e] rounded p-2 font-mono text-xs text-destructive/80 overflow-x-auto max-h-32 overflow-y-auto">
                <pre>{error}</pre>
              </div>
            </div>
          )}

          {/* Actions */}
          {status !== 'success' && status !== 'error' && (
            <div className="px-3 py-2 flex gap-2">
              <button
                onClick={onApprove}
                className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-semibold hover:bg-primary-light transition-colors"
              >
                Approve
              </button>
              <button
                onClick={onDeny}
                className="flex-1 px-3 py-1.5 bg-destructive/20 text-destructive rounded text-xs font-semibold hover:bg-destructive/30 transition-colors"
              >
                Deny
              </button>
            </div>
          )}

          {/* Copy Output */}
          {(output || error) && (
            <div className="px-3 py-2 flex items-center justify-end gap-2">
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-foreground-tertiary hover:bg-surface-secondary transition-colors">
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          )}
        </>
      )}

      {/* Collapsed Summary */}
      {!expanded && status === 'running' && (
        <div className="px-3 py-2 animate-pulse">
          <div className="h-1.5 bg-accent/30 rounded-full overflow-hidden">
            <div className="h-full bg-accent/70 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  )
}
