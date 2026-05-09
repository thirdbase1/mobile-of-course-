'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Search,
  MoreHorizontal,
} from 'lucide-react'

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileNode[]
  icon?: string
  isDirty?: boolean
}

export interface FileExplorerProps {
  files: FileNode[]
  onFileSelect?: (path: string) => void
  onFileCreate?: () => void
  selectedFile?: string
}

/**
 * FileExplorer - VS Code style file tree explorer
 * Shows directory structure with collapsible folders
 * Supports file selection and operations
 */
export function FileExplorer({
  files,
  onFileSelect,
  onFileCreate,
  selectedFile,
}: FileExplorerProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = React.useState('')

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getFileIcon = (name: string, type: 'file' | 'folder') => {
    if (type === 'folder') return null
    
    const ext = name.split('.').pop()?.toLowerCase()
    const icons: Record<string, string> = {
      tsx: '⚛️',
      ts: '📘',
      jsx: '⚛️',
      js: '📙',
      json: '📋',
      css: '🎨',
      html: '🌐',
      py: '🐍',
      sql: '🗄️',
    }
    return icons[ext || 'txt'] || '📄'
  }

  const renderFileTree = (nodes: FileNode[], depth = 0) => (
    <div style={{ paddingLeft: `${depth * 12}px` }} className="space-y-0.5">
      {nodes.map(node => (
        <div key={node.id}>
          <button
            onClick={() => {
              if (node.type === 'folder') {
                toggleExpanded(node.id)
              } else {
                onFileSelect?.(node.path)
              }
            }}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
              selectedFile === node.path
                ? 'bg-primary/20 text-primary'
                : 'text-foreground-secondary hover:bg-surface-secondary hover:text-foreground'
            )}
          >
            {node.type === 'folder' ? (
              <>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform flex-shrink-0',
                    expanded.has(node.id) && 'rotate-90'
                  )}
                />
                {expanded.has(node.id) ? (
                  <FolderOpen className="w-4 h-4 flex-shrink-0 text-accent" />
                ) : (
                  <Folder className="w-4 h-4 flex-shrink-0 text-accent" />
                )}
              </>
            ) : (
              <>
                <div className="w-4 h-4 flex-shrink-0" />
                <span className="text-lg">{getFileIcon(node.name, node.type)}</span>
              </>
            )}
            <span className={cn(
              'flex-1 truncate text-left text-xs font-medium',
              node.isDirty && 'font-bold'
            )}>
              {node.name}
            </span>
            {node.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />}
          </button>

          {node.type === 'folder' && expanded.has(node.id) && node.children && (
            renderFileTree(node.children, depth + 1)
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-4 border-b border-border bg-surface-primary flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Files</h2>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border bg-surface-primary">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-foreground-tertiary" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-base pl-9 text-xs"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-foreground-tertiary">No files yet</p>
          </div>
        ) : (
          renderFileTree(files)
        )}
      </div>
    </div>
  )
}
