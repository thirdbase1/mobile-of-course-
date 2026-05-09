'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { X, Copy, Settings } from 'lucide-react'
import { EditorView, basicSetup } from 'codemirror'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { typescript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

export interface EditorFile {
  id: string
  name: string
  path: string
  content: string
  language: string
  isDirty?: boolean
  isReadOnly?: boolean
}

export interface CodeEditorProps {
  files: EditorFile[]
  activeFile?: string
  onFileChange?: (content: string) => void
  onFileSave?: (content: string) => void
  onFileClose?: (path: string) => void
  onActiveFileChange?: (path: string) => void
}

/**
 * CodeEditor - Code editor with tabs and syntax highlighting via CodeMirror
 * Supports multiple file tabs and language detection
 */
export default function CodeEditor({
  files,
  activeFile,
  onFileChange,
  onFileSave,
  onFileClose,
  onActiveFileChange,
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const currentFile = files.find(f => f.path === activeFile)

  useEffect(() => {
    if (!editorRef.current || !currentFile) return

    // Destroy previous editor
    if (viewRef.current) {
      viewRef.current.destroy()
      viewRef.current = null
    }

    // Determine language extension
    let langExt = javascript()
    if (currentFile.language === 'python') {
      langExt = python()
    } else if (
      currentFile.language === 'typescript' ||
      currentFile.language === 'tsx'
    ) {
      langExt = typescript({ jsx: true })
    }

    // Create editor
    const view = new EditorView({
      doc: currentFile.content,
      extensions: [
        basicSetup,
        langExt,
        oneDark,
        EditorView.editable.of(!currentFile.isReadOnly),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            onFileChange?.(view.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
      parent: editorRef.current,
    })

    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [currentFile?.path])

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* File Tabs */}
      <div className="flex items-center gap-1 h-10 px-2 border-b border-border bg-surface-primary overflow-x-auto">
        {files.map(file => (
          <div
            key={file.id}
            onClick={() => onActiveFileChange?.(file.path)}
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-t border-b-2 text-xs font-medium cursor-pointer transition-colors',
              activeFile === file.path
                ? 'bg-surface-secondary text-foreground border-b-primary'
                : 'text-foreground-tertiary border-b-transparent hover:bg-surface-secondary'
            )}
          >
            <span>{file.name}</span>
            {file.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-warning" />}
            <button
              onClick={e => {
                e.stopPropagation()
                onFileClose?.(file.path)
              }}
              className="hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Editor Area */}
      {currentFile ? (
        <>
          <div ref={editorRef} className="flex-1 overflow-hidden" />

          {/* Status Bar */}
          <div className="h-8 px-4 border-t border-border bg-surface-primary flex items-center justify-between text-xs text-foreground-tertiary">
            <div className="flex gap-4">
              <span>UTF-8</span>
              <span>LF</span>
              <span className="capitalize">{currentFile.language}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onFileSave?.(currentFile.content)}
              >
                <Copy className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-foreground-tertiary">No file selected</p>
        </div>
      )}
    </div>
  )
}
