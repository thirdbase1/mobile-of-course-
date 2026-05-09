'use client'

import React from 'react'
import { WorkspaceShell, Sidebar, ResizablePanel } from '@/components'
import { ChatPanel, TimelinePanel, InspectorPanel, TerminalPanel, GitPanel, EditorPanel } from '@/components/panels'
import { ChatInterface } from '@/components/ChatInterface'
import { FileExplorer } from '@/components/FileExplorer'
import { default as CodeEditor } from '@/components/CodeEditor'
import { ApprovalPrompt } from '@/components/ApprovalPrompt'
import { WorkspaceProvider } from '@/lib/workspace-context'
import { PermissionsProvider } from '@/lib/permissions-context'

// Mock file data
const mockFiles = [
  {
    id: '1',
    name: 'src',
    type: 'folder' as const,
    path: 'src',
    children: [
      {
        id: '2',
        name: 'app',
        type: 'folder' as const,
        path: 'src/app',
        children: [
          {
            id: '3',
            name: 'page.tsx',
            type: 'file' as const,
            path: 'src/app/page.tsx',
          },
          {
            id: '4',
            name: 'layout.tsx',
            type: 'file' as const,
            path: 'src/app/layout.tsx',
          },
        ],
      },
      {
        id: '5',
        name: 'components',
        type: 'folder' as const,
        path: 'src/components',
        children: [
          {
            id: '6',
            name: 'Button.tsx',
            type: 'file' as const,
            path: 'src/components/Button.tsx',
          },
        ],
      },
    ],
  },
  {
    id: '7',
    name: 'package.json',
    type: 'file' as const,
    path: 'package.json',
  },
]

const mockEditorFiles = [
  {
    id: '1',
    name: 'page.tsx',
    path: 'src/app/page.tsx',
    language: 'typescript',
    content: `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Welcome to GITCODE</h1>
      <p>AI-powered full-stack development workspace</p>
    </main>
  )
}`,
  },
  {
    id: '2',
    name: 'Button.tsx',
    path: 'src/components/Button.tsx',
    language: 'typescript',
    content: `export interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={{\`px-4 py-2 rounded \${variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}\`}}
    >
      {children}
    </button>
  )
}`,
  },
]

/**
 * Workspace Page - Main application interface
 * Integrates all workspace components:
 * - File explorer and editor
 * - AI chat interface
 * - Operation timeline and inspector
 * - Terminal and git panels
 * - Permission system
 */
export default function WorkspacePage() {
  const [activeEditorFile, setActiveEditorFile] = React.useState(mockEditorFiles[0].path)
  const [activeEditorFiles, setActiveEditorFiles] = React.useState(mockEditorFiles)

  return (
    <WorkspaceProvider>
      <PermissionsProvider>
        <WorkspaceShell
          sidebar={<Sidebar />}
          chat={
            <div className="flex gap-4 h-full">
              <div className="flex-1 overflow-hidden">
                <ChatInterface />
              </div>
            </div>
          }
          editor={
            <div className="flex gap-4 h-full">
              <div style={{ width: '250px' }} className="overflow-hidden border-r border-border">
                <FileExplorer
                  files={mockFiles}
                  selectedFile={activeEditorFile}
                  onFileSelect={setActiveEditorFile}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  files={activeEditorFiles}
                  activeFile={activeEditorFile}
                  onActiveFileChange={setActiveEditorFile}
                />
              </div>
            </div>
          }
          timeline={<TimelinePanel />}
          inspector={<InspectorPanel />}
          terminal={<TerminalPanel />}
          git={<GitPanel />}
        />

        {/* Approval prompt for AI operations */}
        <ApprovalPrompt />
      </PermissionsProvider>
    </WorkspaceProvider>
  )
}
