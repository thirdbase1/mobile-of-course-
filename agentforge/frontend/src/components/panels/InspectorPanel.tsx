'use client'

import React from 'react'
import { useWorkspace } from '@/lib/workspace-context'
import { Button } from '@/components/ui'
import { X, ChevronDown } from 'lucide-react'

/**
 * InspectorPanel - Detailed inspection of selected operations
 * Shows:
 * - Tool call details
 * - Request/response data
 * - File changes
 * - Performance metrics
 */
export function InspectorPanel() {
  const { togglePanel } = useWorkspace()
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['request', 'response'])
  )

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections)
    if (newSet.has(section)) {
      newSet.delete(section)
    } else {
      newSet.add(section)
    }
    setExpandedSections(newSet)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-surface-primary">
        <h2 className="text-sm font-semibold text-foreground">Inspector</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => togglePanel('inspector')}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Request Section */}
        <div className="bg-surface-tertiary border border-border rounded">
          <button
            onClick={() => toggleSection('request')}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-primary transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSections.has('request') ? '' : '-rotate-90'
              }`}
            />
            <span className="text-xs font-semibold text-foreground">Request</span>
          </button>

          {expandedSections.has('request') && (
            <div className="px-3 py-2 border-t border-border bg-surface-secondary text-xs text-foreground-secondary font-mono space-y-1">
              <div>
                <span className="text-primary">POST</span> /api/agents/tool-call
              </div>
              <div>
                <span className="text-accent">Authorization</span>: Bearer ...
              </div>
              <div className="mt-2 p-2 bg-surface-tertiary rounded">
                <pre className="text-foreground text-xs overflow-auto">{`{
  "tool": "read_file",
  "params": {
    "path": "./src/app.tsx"
  }
}`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Response Section */}
        <div className="bg-surface-tertiary border border-border rounded">
          <button
            onClick={() => toggleSection('response')}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-primary transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSections.has('response') ? '' : '-rotate-90'
              }`}
            />
            <span className="text-xs font-semibold text-foreground">Response</span>
            <span className="text-xs text-success ml-auto">200 OK</span>
          </button>

          {expandedSections.has('response') && (
            <div className="px-3 py-2 border-t border-border bg-surface-secondary text-xs">
              <pre className="text-foreground font-mono overflow-auto">{`{
  "success": true,
  "content": "export default function App() {",
  "lines": 142
}`}</pre>
            </div>
          )}
        </div>

        {/* Metrics Section */}
        <div className="bg-surface-tertiary border border-border rounded">
          <button
            onClick={() => toggleSection('metrics')}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-primary transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSections.has('metrics') ? '' : '-rotate-90'
              }`}
            />
            <span className="text-xs font-semibold text-foreground">Metrics</span>
          </button>

          {expandedSections.has('metrics') && (
            <div className="px-3 py-2 border-t border-border bg-surface-secondary text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">Duration:</span>
                <span className="text-foreground">147ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">Tokens used:</span>
                <span className="text-foreground">342</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">Cost:</span>
                <span className="text-foreground">$0.00134</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
