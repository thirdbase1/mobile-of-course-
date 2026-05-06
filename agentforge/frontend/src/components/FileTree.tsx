'use client'
import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

export default function FileTree({ files, onSelect }: { files: any[], onSelect: (path: string) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }

  return (
    <div className="space-y-0.5">
      {files.map(file => (
        <div key={file.path}>
          <div
            onClick={() => file.type === 'dir' ? toggle(file.path) : onSelect(file.path)}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-secondary rounded-md cursor-pointer text-xs group transition-colors"
          >
            {file.type === 'dir' ? (
              expanded[file.path] ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            ) : <span className="w-3.5" />}

            {file.type === 'dir' ? (
              <Folder className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
            ) : (
              <File className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
            )}
            <span className="truncate">{file.name}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
