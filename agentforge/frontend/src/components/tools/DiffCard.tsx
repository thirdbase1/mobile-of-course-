'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { StatusBadge, Button } from '@/components/ui'
import { ChevronDown } from 'lucide-react'

export interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  lineNumber?: number
}

export interface DiffCardProps {
  id: string
  filePath: string
  status: 'idle' | 'running' | 'success' | 'error'
  lines: DiffLine[]
  additions: number
  deletions: number
  expanded?: boolean
  onToggleExpand?: () => void
  onApprove?: () => void
  onDeny?: () => void
}

/**
 * DiffCard - Specialized tool card for showing file diffs
 * Shows before/after changes with color coding
 * Part of multi-file editing approval system
 */
export function DiffCard({
  id,
  filePath,
  status,
  lines,
  additions,
  deletions,
  expanded = false,
  onToggleExpand,
  onApprove,
  onDeny,
}: DiffCardProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface-tertiary transition-all">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-surface-primary border-b border-border">
        <button
          onClick={onToggleExpand}
          className="flex-shrink-0 p-1 hover:bg-surface-secondary rounded transition-colors"
        >
          <ChevronDown
            className={cn('w-4 h-4 transition-transform', expanded ? 'rotate-180' : '')}
          />
        </button>

        <span className="text-lg">📝</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{filePath}</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-success">+{additions}</span>
          <span className="text-destructive">-{deletions}</span>
        </div>

        <StatusBadge status={status} />
      </div>

      {/* Expanded Diff Content */}
      {expanded && (
        <>
          <div className="bg-[#1e1e1e] font-mono text-xs overflow-x-auto max-h-80 overflow-y-auto">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-2 whitespace-pre-wrap break-words px-4 py-1',
                  line.type === 'add'
                    ? 'bg-success/10 text-success'
                    : line.type === 'remove'
                      ? 'bg-destructive/10 text-destructive'
                      : 'text-foreground-secondary'
                )}
              >
                <span className="flex-shrink-0 w-8 text-right text-foreground-tertiary">
                  {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                </span>
                <span>{line.content}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-3 py-2 border-t border-border bg-surface-primary flex gap-2">
            <Button
              onClick={onApprove}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Accept Changes
            </Button>
            <Button
              onClick={onDeny}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
