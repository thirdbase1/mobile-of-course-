'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { writeFile } from '@/lib/api'
import FileTree from './FileTree'
import clsx from 'clsx'

// CodeMirror lazy-loaded
let EditorView: any = null
let EditorState: any = null
let oneDark: any = null
let langMap: Record<string, any> = {}

async function initCM() {
  if (EditorView) return
  const view   = await import('@codemirror/view')
  const state  = await import('@codemirror/state')
  const theme  = await import('@codemirror/theme-one-dark')
  EditorView   = view.EditorView
  EditorState  = state.EditorState
  oneDark      = theme.oneDark

  const [py, js, json, md, css, html] = await Promise.all([
    import('@codemirror/lang-python'),
    import('@codemirror/lang-javascript'),
    import('@codemirror/lang-json'),
    import('@codemirror/lang-markdown'),
    import('@codemirror/lang-css'),
    import('@codemirror/lang-html'),
  ])
  langMap = {
    python: py.python, py: py.python,
    javascript: () => js.javascript({ jsx: true }),
    js: () => js.javascript({ jsx: true }),
    typescript: () => js.javascript({ typescript: true, jsx: true }),
    ts: () => js.javascript({ typescript: true, jsx: true }),
    tsx: () => js.javascript({ typescript: true, jsx: true }),
    jsx: () => js.javascript({ jsx: true }),
    json: json.json,
    md: md.markdown, markdown: md.markdown,
    css: css.css, scss: css.css,
    html: html.html,
  }
}

function getLang(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const fn  = langMap[ext]
  if (!fn) return []
  try { return [typeof fn === 'function' ? fn() : fn()] } catch { return [] }
}

export default function CodeEditor() {
  const {
    openFile, setOpenFile, openFileTabs, openTab, closeTab,
    repos, editorOpen, setEditorOpen,
  } = useStore()

  const editorRef   = useRef<HTMLDivElement>(null)
  const viewRef     = useRef<any>(null)
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [dirty,  setDirty]    = useState(false)
  const [cmReady,setCmReady]  = useState(false)
  const [treeOpen,setTreeOpen]= useState(true)
  const [commitMsg, setCommitMsg] = useState('')
  const contentRef = useRef('')

  // Select repo for file tree
  const activeRepo = repos.find(r => r.id === openFile?.repoId)
  // Use first repo if nothing open yet
  const treeRepo   = activeRepo ?? repos[0] ?? null

  // Init CodeMirror
  useEffect(() => {
    initCM().then(() => setCmReady(true))
  }, [])

  // Mount/update editor when file changes
  useEffect(() => {
    if (!cmReady || !editorRef.current || !openFile) return

    contentRef.current = openFile.content
    setDirty(false)

    if (viewRef.current) {
      viewRef.current.destroy()
      viewRef.current = null
    }

    const state = EditorState.create({
      doc: openFile.content,
      extensions: [
        oneDark,
        ...getLang(openFile.path),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update: any) => {
          if (update.docChanged) {
            contentRef.current = update.state.doc.toString()
            setDirty(true)
          }
        }),
        EditorView.theme({
          '&': { height: '100%', background: '#0a0b0f' },
          '.cm-content': { padding: '8px 0', caretColor: '#7c5cfc' },
          '.cm-focused': { outline: 'none' },
        }),
      ],
    })

    viewRef.current = new EditorView({ state, parent: editorRef.current })
    return () => { viewRef.current?.destroy(); viewRef.current = null }
  }, [cmReady, openFile?.path, openFile?.repoId])

  async function save() {
    if (!openFile) return
    setSaving(true)
    try {
      const content = contentRef.current
      const msg     = commitMsg.trim() || `Update ${openFile.path.split('/').pop()}`
      const res = await writeFile(openFile.repoId, {
        path:           openFile.path,
        content,
        commit_message: msg,
        branch:         openFile.branch,
        sha:            openFile.sha,
      })
      // Update tab with new sha
      openTab({ ...openFile, content, sha: res.sha })
      setDirty(false)
      setSaved(true)
      setCommitMsg('')
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      alert('Save failed: ' + (e?.response?.data?.detail || e.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-0 border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-1 shrink-0">
        <button
          onClick={() => setTreeOpen(!treeOpen)}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-xs"
        >
          <span className="text-sm">📁</span>
          <span>{treeOpen ? 'Files' : 'Files'}</span>
        </button>
        <button onClick={() => setEditorOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* File tree panel */}
        {treeOpen && treeRepo && (
          <div className="w-44 shrink-0 border-r border-border overflow-y-auto bg-surface-1">
            <div className="px-3 py-2 text-[10px] text-text-muted font-semibold uppercase tracking-wider truncate border-b border-border">
              {treeRepo.name}
            </div>
            <FileTree repoId={treeRepo.id} repoFull={treeRepo.full_name} branch={treeRepo.default_branch} />
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          {openFileTabs.length > 0 && (
            <div className="flex overflow-x-auto bg-surface-1 border-b border-border shrink-0">
              {openFileTabs.map(tab => {
                const isActive = tab.path === openFile?.path && tab.repoId === openFile?.repoId
                return (
                  <button
                    key={tab.path + tab.repoId}
                    onClick={() => openTab(tab)}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 text-xs border-r border-border whitespace-nowrap shrink-0 transition-colors',
                      isActive ? 'bg-surface-0 text-text-primary' : 'text-text-muted hover:bg-surface-2'
                    )}
                  >
                    <span className="max-w-32 truncate">{tab.path.split('/').pop()}</span>
                    <button
                      onClick={e => { e.stopPropagation(); closeTab(tab.path) }}
                      className="text-text-muted hover:text-text-primary transition-colors"
                    >×</button>
                  </button>
                )
              })}
            </div>
          )}

          {openFile ? (
            <>
              {/* Path breadcrumb */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface-1 shrink-0">
                <span className="text-[11px] text-text-muted font-mono truncate flex-1">
                  {openFile.repoFull}/{openFile.path}
                </span>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <span className="text-[10px] text-text-muted bg-surface-3 px-1.5 py-0.5 rounded font-mono">
                    {openFile.branch}
                  </span>
                  {dirty && <span className="w-1.5 h-1.5 rounded-full bg-yellow" title="Unsaved changes" />}
                </div>
              </div>

              {/* CodeMirror */}
              <div ref={editorRef} className="flex-1 overflow-hidden" />

              {/* Save bar */}
              <div className="border-t border-border px-3 py-2 bg-surface-1 flex items-center gap-2 shrink-0">
                <input
                  value={commitMsg}
                  onChange={e => setCommitMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && save()}
                  placeholder="Commit message (optional)…"
                  className="flex-1 bg-surface-0 border border-border rounded px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-brand/50 transition-colors font-mono"
                />
                <button
                  onClick={save}
                  disabled={saving || !dirty}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all shrink-0',
                    saved
                      ? 'bg-green/15 text-green border border-green/25'
                      : dirty
                        ? 'bg-brand hover:opacity-90 text-white'
                        : 'bg-surface-3 text-text-muted cursor-not-allowed border border-border'
                  )}
                >
                  {saving
                    ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    : saved ? '✓ Saved' : '↑ Commit'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="text-3xl mb-3 opacity-30">📄</div>
              <p className="text-text-muted text-xs">Click a file to open it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
