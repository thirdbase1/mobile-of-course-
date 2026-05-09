'use client'

import React from 'react'
import { ToolCard } from './ToolCard'

export interface ReadFileCardProps {
  id: string
  filePath: string
  status: 'idle' | 'running' | 'success' | 'error'
  content?: string
  error?: string
  lineCount?: number
  duration?: number
  expanded?: boolean
  onToggleExpand?: () => void
}

/**
 * ReadFileCard - Specialized tool card for file reading operations
 * Shows file path, content preview, and line count
 */
export function ReadFileCard({
  id,
  filePath,
  status,
  content,
  error,
  lineCount,
  duration,
  expanded = false,
  onToggleExpand,
}: ReadFileCardProps) {
  return (
    <ToolCard
      id={id}
      tool="read_file"
      status={status}
      description={filePath}
      input={{ path: filePath }}
      output={content ? `${content.substring(0, 500)}${content.length > 500 ? '...' : ''}` : undefined}
      error={error}
      duration={duration}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
    />
  )
}
