'use client'

import React, { ReactNode } from 'react'
import { useWorkspace } from '@/lib/workspace-context'
import { cn } from '@/lib/utils'

export interface WorkspaceShellProps {
  sidebar?: ReactNode
  chat?: ReactNode
  editor?: ReactNode
  terminal?: ReactNode
  git?: ReactNode
  context?: ReactNode
  timeline?: ReactNode
  inspector?: ReactNode
}

/**
 * GITCODE Workspace Shell - Main multi-panel layout container
 * Manages the desktop layout with:
 * - Persistent sidebar
 * - Resizable editor area
 * - AI execution timeline
 * - Context/memory panel
 * - Git operations panel
 * - Terminal integration
 */
export function WorkspaceShell({
  sidebar,
  chat,
  editor,
  terminal,
  git,
  context,
  timeline,
  inspector,
}: WorkspaceShellProps) {
  const { state } = useWorkspace()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Always visible, collapsible */}
      <div className="flex-shrink-0">{sidebar}</div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar/Breadcrumb Area */}
        <div className="h-12 border-b border-border bg-surface-primary flex items-center px-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <span className="text-xs font-semibold text-foreground">WORKSPACE</span>
            <span>•</span>
            <span>Main Branch</span>
          </div>
        </div>

        {/* Workspace Content - Main Layout */}
        <div className="flex-1 flex overflow-hidden flex-col gap-0.5 p-1 bg-background">
          {/* Main editing area with resizable panels */}
          <div className="flex-1 flex gap-0.5 overflow-hidden">
            {/* Left Panel - Chat/Context */}
            {state.activePanels.has('chat') && (
              <div
                className="flex flex-col bg-surface-secondary border border-border rounded-lg overflow-hidden hover:border-border-light transition-colors"
                style={{ width: `${state.panelWidths.chat}px`, minWidth: '250px' }}
              >
                {chat || <div className="p-4 text-foreground-tertiary">Chat Panel</div>}
              </div>
            )}

            {/* Resizer between chat and editor */}
            {state.activePanels.has('chat') && state.activePanels.has('editor') && (
              <div
                className="w-1 bg-border hover:bg-primary/30 hover:w-1.5 transition-all cursor-col-resize flex-shrink-0"
                onMouseDown={() => {
                  /* Handle resize logic */
                }}
              />
            )}

            {/* Center Panel - Editor */}
            {state.activePanels.has('editor') && (
              <div className="flex-1 flex flex-col bg-surface-secondary border border-border rounded-lg overflow-hidden hover:border-border-light transition-colors">
                {editor || <div className="p-4 text-foreground-tertiary">Editor Panel</div>}
              </div>
            )}

            {/* Right Sidebar Panels */}
            {(state.activePanels.has('timeline') || state.activePanels.has('inspector')) && (
              <>
                <div className="w-1 bg-border flex-shrink-0" />
                <div className="flex flex-col gap-1 flex-shrink-0" style={{ width: `${state.panelWidths.timeline}px`, minWidth: '250px' }}>
                  {/* Timeline Panel */}
                  {state.activePanels.has('timeline') && (
                    <div className="flex-1 flex flex-col bg-surface-secondary border border-border rounded-lg overflow-hidden hover:border-border-light transition-colors">
                      {timeline || <div className="p-4 text-foreground-tertiary">Timeline</div>}
                    </div>
                  )}

                  {/* Resizer between timeline and inspector */}
                  {state.activePanels.has('timeline') && state.activePanels.has('inspector') && (
                    <div className="h-1 bg-border flex-shrink-0" />
                  )}

                  {/* Inspector Panel */}
                  {state.activePanels.has('inspector') && (
                    <div className="flex-1 flex flex-col bg-surface-secondary border border-border rounded-lg overflow-hidden hover:border-border-light transition-colors">
                      {inspector || <div className="p-4 text-foreground-tertiary">Inspector</div>}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Bottom Panels - Terminal/Git */}
          {(state.activePanels.has('terminal') || state.activePanels.has('git')) && (
            <>
              <div className="h-1 bg-border flex-shrink-0" />
              <div className="flex gap-0.5 flex-shrink-0" style={{ height: '300px' }}>
                {state.activePanels.has('terminal') && (
                  <div className="flex-1 flex flex-col bg-surface-secondary border border-border rounded-lg overflow-hidden hover:border-border-light transition-colors">
                    {terminal || <div className="p-4 text-foreground-tertiary">Terminal</div>}
                  </div>
                )}

                {state.activePanels.has('terminal') && state.activePanels.has('git') && (
                  <div className="w-1 bg-border flex-shrink-0" />
                )}

                {state.activePanels.has('git') && (
                  <div className="flex-1 flex flex-col bg-surface-secondary border border-border rounded-lg overflow-hidden hover:border-border-light transition-colors">
                    {git || <div className="p-4 text-foreground-tertiary">Git Panel</div>}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
