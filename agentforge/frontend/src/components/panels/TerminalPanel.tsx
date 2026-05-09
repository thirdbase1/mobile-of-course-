'use client'

import React from 'react'
import { useWorkspace } from '@/lib/workspace-context'
import { Button } from '@/components/ui'
import { X, Plus, Trash2 } from 'lucide-react'

export interface TerminalLine {
  id: string
  text: string
  type: 'input' | 'output' | 'error' | 'warning'
  timestamp: number
}

/**
 * TerminalPanel - Live terminal streaming and execution
 * Shows:
 * - Real-time command output
 * - Agent terminal activity
 * - File system changes
 * - Process output and errors
 */
export function TerminalPanel() {
  const { togglePanel } = useWorkspace()
  const [lines, setLines] = React.useState<TerminalLine[]>([
    {
      id: '1',
      text: '$ npm install',
      type: 'input',
      timestamp: Date.now() - 5000,
    },
    {
      id: '2',
      text: 'added 156 packages in 2.3s',
      type: 'output',
      timestamp: Date.now() - 4500,
    },
    {
      id: '3',
      text: '$ npm run build',
      type: 'input',
      timestamp: Date.now() - 3000,
    },
    {
      id: '4',
      text: '▲ Next.js 14.2.5',
      type: 'output',
      timestamp: Date.now() - 2900,
    },
  ])
  const terminalRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  return (
    <div className="flex flex-col h-full bg-[#0a0e27] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-4 border-b border-border bg-surface-primary">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Terminal</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Plus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => togglePanel('terminal')}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 text-sm leading-relaxed"
      >
        {lines.map(line => (
          <div
            key={line.id}
            className={`font-mono text-xs ${
              line.type === 'input'
                ? 'text-accent'
                : line.type === 'error'
                  ? 'text-destructive'
                  : line.type === 'warning'
                    ? 'text-warning'
                    : 'text-foreground-secondary'
            }`}
          >
            {line.type === 'input' && <span className="text-accent">{'>'} </span>}
            {line.text}
          </div>
        ))}
        <div className="text-accent">{'>'} _</div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border px-3 py-2 bg-surface-primary">
        <div className="flex items-center text-xs text-accent font-mono">
          <span>{'>'} </span>
          <input
            type="text"
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-foreground ml-2 focus:outline-none text-xs"
            onKeyPress={e => {
              if (e.key === 'Enter') {
                const command = (e.target as HTMLInputElement).value
                if (command) {
                  setLines([
                    ...lines,
                    {
                      id: String(Date.now()),
                      text: command,
                      type: 'input',
                      timestamp: Date.now(),
                    },
                  ])
                  ;(e.target as HTMLInputElement).value = ''
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
