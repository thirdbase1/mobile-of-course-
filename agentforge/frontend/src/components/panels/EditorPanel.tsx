'use client'

import React from 'react'
import { Button } from '@/components/ui'
import { Plus, X } from 'lucide-react'

/**
 * EditorPanel - Code editor with syntax highlighting
 * Will integrate with CodeMirror or Monaco Editor
 * Shows:
 * - Code with syntax highlighting
 * - AI-generated diffs
 * - File tabs
 * - Line numbers and folding
 */
export function EditorPanel() {
  const [openFiles, setOpenFiles] = React.useState([
    { id: '1', name: 'App.tsx', active: true },
    { id: '2', name: 'Button.tsx', active: false },
  ])

  return (
    <div className="flex flex-col h-full">
      {/* File Tabs */}
      <div className="flex items-center gap-1 h-10 px-2 border-b border-border bg-surface-primary overflow-x-auto">
        {openFiles.map(file => (
          <div
            key={file.id}
            className={`flex items-center gap-2 px-3 py-1 rounded-t border-b-2 text-xs font-medium cursor-pointer transition-colors ${
              file.active
                ? 'bg-surface-secondary text-foreground border-b-primary'
                : 'text-foreground-tertiary border-b-transparent hover:bg-surface-secondary'
            }`}
          >
            {file.name}
            <button className="hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden bg-[#1e1e1e] font-mono text-xs leading-relaxed">
        <div className="w-full h-full overflow-auto p-4 text-foreground-secondary">
          <div className="text-right text-foreground-tertiary mb-4">
            {' '}
            {/* Line numbers */}
            <div className="inline-block pr-4 border-r border-border text-right w-8">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i + 1}>{i + 1}</div>
              ))}
            </div>
          </div>

          {/* Code content */}
          <div className="ml-2 space-y-0">
            <div>
              <span className="text-primary">export</span>
              <span> </span>
              <span className="text-primary">default</span>
              <span> </span>
              <span className="text-accent">function</span>
              <span>{` App() {`}</span>
            </div>
            <div className="ml-4">
              <span className="text-primary">return</span>
              <span> (</span>
            </div>
            <div className="ml-8">
              <span className="text-warning">&lt;div&gt;</span>
            </div>
            <div className="ml-12">
              <span className="text-accent">&lt;h1&gt;</span>
              <span>Welcome to GITCODE</span>
              <span className="text-accent">&lt;/h1&gt;</span>
            </div>
            <div className="ml-8">
              <span className="text-warning">&lt;/div&gt;</span>
            </div>
            <div className="ml-4">
              <span>)</span>
            </div>
            <div>
              <span className="text-foreground">{'}'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 px-4 border-t border-border bg-surface-primary flex items-center justify-between text-xs text-foreground-tertiary">
        <div className="flex gap-4">
          <span>Ln 1, Col 1</span>
          <span>UTF-8</span>
          <span>LF</span>
          <span>TypeScript</span>
        </div>
        <div className="flex gap-4">
          <span>CRLF</span>
          <span>Prettier</span>
        </div>
      </div>
    </div>
  )
}
