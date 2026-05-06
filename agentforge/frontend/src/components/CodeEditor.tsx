'use client'
import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

export default function CodeEditor({ content, language }: { content: string, language?: string }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorView.theme({
       "&": { height: "100%" },
       ".cm-scroller": { overflow: "auto" }
    })

    const lang = language === 'python' ? python() : javascript()

    const view = new EditorView({
      doc: content,
      extensions: [
        basicSetup,
        lang,
        oneDark,
        EditorView.editable.of(false),
        state
      ],
      parent: editorRef.current
    })

    viewRef.current = view
    return () => view.destroy()
  }, [content, language])

  return <div ref={editorRef} className="h-full w-full" />
}
