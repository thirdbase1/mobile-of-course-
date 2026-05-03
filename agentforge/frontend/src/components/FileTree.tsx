'use client'
import { useState, useEffect } from 'react'
import { listFiles, getFile } from '@/lib/api'
import { useStore } from '@/lib/store'
import clsx from 'clsx'

interface TreeNode {
  name:    string
  path:    string
  type:    'file' | 'dir'
  size?:   number
}

const LANG_EXT: Record<string, string> = {
  ts:'typescript', tsx:'typescript', js:'javascript', jsx:'javascript',
  py:'python', rb:'ruby', go:'go', rs:'rust', java:'java', cpp:'cpp', c:'c',
  sh:'bash', bash:'bash', md:'markdown', json:'json', yaml:'yaml', yml:'yaml',
  html:'html', css:'css', scss:'css', toml:'toml', env:'bash',
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const icons: Record<string, string> = {
    py:'🐍', ts:'🔷', tsx:'⚛', js:'📜', jsx:'⚛', json:'{}',
    md:'📝', html:'🌐', css:'🎨', go:'🐹', rs:'🦀', rb:'💎',
    sh:'$', bash:'$', yaml:'⚙', yml:'⚙', toml:'⚙', env:'🔒',
    gitignore:'🚫', dockerfile:'🐳',
  }
  return <span className="text-[11px] w-4 text-center shrink-0">{icons[ext] || icons[name.toLowerCase()] || '📄'}</span>
}

interface Props {
  repoId:     string
  repoFull:   string
  branch:     string
}

export default function FileTree({ repoId, repoFull, branch }: Props) {
  const { openTab } = useStore()
  const [tree,    setTree]    = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded,setExpanded]= useState<Set<string>>(new Set())
  const [subtrees,setSubtrees]= useState<Record<string, TreeNode[]>>({})
  const [loadingSubs, setLoadingSubs] = useState<Set<string>>(new Set())
  const [openPath, setOpenPath] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listFiles(repoId, '', branch)
      .then(data => setTree(normalize(data)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [repoId, branch])

  function normalize(items: any[]): TreeNode[] {
    return (Array.isArray(items) ? items : []).map(i => ({
      name: i.name, path: i.path, type: i.type === 'dir' ? 'dir' : 'file', size: i.size,
    })).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  async function toggleDir(path: string) {
    if (expanded.has(path)) {
      setExpanded(s => { const n = new Set(s); n.delete(path); return n })
      return
    }
    setExpanded(s => new Set([...s, path]))
    if (subtrees[path]) return
    setLoadingSubs(s => new Set([...s, path]))
    try {
      const data = await listFiles(repoId, path, branch)
      setSubtrees(s => ({ ...s, [path]: normalize(data) }))
    } catch {}
    setLoadingSubs(s => { const n = new Set(s); n.delete(path); return n })
  }

  async function openFile(node: TreeNode) {
    setOpenPath(node.path)
    try {
      const data = await getFile(repoId, node.path, branch)
      const ext  = node.name.split('.').pop()?.toLowerCase() || ''
      openTab({
        repoId,
        repoFull,
        path:    node.path,
        content: data.content,
        sha:     data.sha,
        branch,
      })
    } catch (e: any) {
      alert('Failed to open file: ' + (e?.response?.data?.detail || e.message))
    } finally {
      setOpenPath(null)
    }
  }

  function renderNodes(nodes: TreeNode[], depth = 0) {
    return nodes.map(node => (
      <div key={node.path}>
        {node.type === 'dir' ? (
          <button
            onClick={() => toggleDir(node.path)}
            className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-surface-3 rounded transition-colors text-left"
            style={{ paddingLeft: `${8 + depth * 12}px` }}
          >
            <span className="text-[10px] text-text-muted w-3 shrink-0">
              {loadingSubs.has(node.path) ? '⟳' : expanded.has(node.path) ? '▾' : '▸'}
            </span>
            <span className="text-yellow text-[11px] shrink-0">📁</span>
            <span className="text-text-secondary text-[11.5px] truncate">{node.name}</span>
          </button>
        ) : (
          <button
            onClick={() => openFile(node)}
            className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-surface-3 rounded transition-colors text-left group"
            style={{ paddingLeft: `${20 + depth * 12}px` }}
          >
            <FileIcon name={node.name} />
            <span className={clsx(
              'text-[11.5px] truncate flex-1',
              openPath === node.path ? 'text-brand' : 'text-text-secondary group-hover:text-text-primary'
            )}>
              {node.name}
            </span>
            {openPath === node.path && (
              <span className="w-2.5 h-2.5 border border-brand/50 border-t-brand rounded-full animate-spin shrink-0" />
            )}
          </button>
        )}
        {node.type === 'dir' && expanded.has(node.path) && subtrees[node.path] && (
          renderNodes(subtrees[node.path], depth + 1)
        )}
      </div>
    ))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-8 text-text-muted text-xs gap-2">
      <span className="w-3 h-3 border border-brand/50 border-t-brand rounded-full animate-spin" />
      Loading files…
    </div>
  )

  if (tree.length === 0) return (
    <div className="py-8 text-text-muted text-xs text-center">Empty repository</div>
  )

  return <div className="py-1">{renderNodes(tree)}</div>
}
