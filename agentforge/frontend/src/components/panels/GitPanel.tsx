'use client'

import React from 'react'
import { useWorkspace } from '@/lib/workspace-context'
import { Button } from '@/components/ui'
import { X, GitBranch, GitCommit, Plus } from 'lucide-react'
import { Badge } from '@/components/ui'

/**
 * GitPanel - Git operations and repository management
 * Shows:
 * - Branch switching
 * - Commit operations
 * - Pull request creation
 * - Diff viewing
 */
export function GitPanel() {
  const { togglePanel } = useWorkspace()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-surface-primary">
        <h2 className="text-sm font-semibold text-foreground">Git</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => togglePanel('git')}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Current Branch */}
        <div className="bg-surface-tertiary border border-border rounded p-3">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">Current Branch</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded border border-border">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm text-foreground font-mono">fix-frontend-deployment-v2</span>
          </div>
        </div>

        {/* Changes */}
        <div className="bg-surface-tertiary border border-border rounded p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Changes</span>
            <Badge variant="primary">3</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 bg-surface-secondary rounded hover:bg-surface-primary transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs font-bold">M</span>
                <span className="text-xs text-foreground">src/components/Button.tsx</span>
              </div>
              <span className="text-xs text-foreground-tertiary">+24 -8</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-surface-secondary rounded hover:bg-surface-primary transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs font-bold">A</span>
                <span className="text-xs text-foreground">src/lib/utils.ts</span>
              </div>
              <span className="text-xs text-foreground-tertiary">+68</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-surface-secondary rounded hover:bg-surface-primary transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-xs font-bold">D</span>
                <span className="text-xs text-foreground">src/old-component.tsx</span>
              </div>
              <span className="text-xs text-foreground-tertiary">-45</span>
            </div>
          </div>
        </div>

        {/* Commit */}
        <div className="bg-surface-tertiary border border-border rounded p-3">
          <div className="flex items-center gap-2 mb-3">
            <GitCommit className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Commit</span>
          </div>
          <input
            type="text"
            placeholder="Commit message..."
            className="input-base w-full text-xs mb-2"
            defaultValue="chore: add design system and workspace shell"
          />
          <Button variant="primary" size="sm" className="w-full">
            <GitCommit className="w-3 h-3" />
            Commit Changes
          </Button>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="secondary" size="sm" className="w-full">
            <Plus className="w-3 h-3" />
            Push to Remote
          </Button>
          <Button variant="secondary" size="sm" className="w-full">
            Create Pull Request
          </Button>
        </div>
      </div>
    </div>
  )
}
