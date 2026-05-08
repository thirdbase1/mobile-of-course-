'use client'
import { File, Folder, ChevronRight, ChevronDown, FileText, Code2, Database, Settings, Terminal, Hash, Image } from 'lucide-react'
import { useState, useEffect } from 'react'
import clsx from 'clsx'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

export default function FileTree({ files, onSelect, activePath }: { files: FileNode[], onSelect: (path: string) => void, activePath?: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }

  // Auto-expand parents of active file
  useEffect(() => {
    if (activePath) {
        const parts = activePath.split('/')
        let current = ''
        const nextExpanded = { ...expanded }
        parts.forEach(p => {
            current = current ? `${current}/${p}` : p
            nextExpanded[current] = true
        })
        // setExpanded(nextExpanded)
    }
  }, [activePath])

  const getIcon = (node: FileNode) => {
    if (node.type === 'dir') return <Folder className="w-3.5 h-3.5 text-blue-400/80 fill-blue-400/10" />

    const ext = node.name.split('.').pop()?.toLowerCase()
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) return <Code2 className="w-3.5 h-3.5 text-blue-300" />
    if (['json', 'yaml', 'yml'].includes(ext || '')) return <Settings className="w-3.5 h-3.5 text-orange-300" />
    if (['md', 'txt'].includes(ext || '')) return <FileText className="w-3.5 h-3.5 text-zinc-400" />
    if (['sql', 'db'].includes(ext || '')) return <Database className="w-3.5 h-3.5 text-purple-300" />
    if (['sh', 'bash'].includes(ext || '')) return <Terminal className="w-3.5 h-3.5 text-green-300" />
    if (['png', 'jpg', 'svg'].includes(ext || '')) return <Image className="w-3.5 h-3.5 text-pink-300" />
    return <File className="w-3.5 h-3.5 text-zinc-500" />
  }

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expanded[node.path]
    const isActive = activePath === node.path

    return (
      <div key={node.path}>
        <div
          onClick={() => node.type === 'dir' ? toggle(node.path) : onSelect(node.path)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={clsx(
            "flex items-center gap-2 py-1 cursor-pointer transition-colors group relative",
            isActive ? "bg-white/10 text-white" : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
          )}
        >
          {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}

          <div className="w-4 h-4 flex items-center justify-center">
            {node.type === 'dir' && (
                isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
            )}
          </div>

          {getIcon(node)}
          <span className="text-xs font-medium truncate py-0.5">{node.name}</span>
        </div>

        {node.type === 'dir' && isExpanded && node.children && (
          <div>
            {node.children.sort((a,b) => {
                if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
                return a.name.localeCompare(b.name)
            }).map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="py-2">
      {files.sort((a,b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
          return a.name.localeCompare(b.name)
      }).map(node => renderNode(node))}
    </div>
  )
}
