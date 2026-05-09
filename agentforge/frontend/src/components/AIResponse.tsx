'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button, Badge } from '@/components/ui'
import { ToolCard } from '@/components/tools'
import { ChevronDown, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'

export interface AIResponseSection {
  type: 'text' | 'code' | 'plan' | 'tool' | 'result'
  content: string
  language?: string
  title?: string
}

export interface AIResponseProps {
  content: string
  sections?: AIResponseSection[]
  thinking?: string
  tokensUsed?: number
  duration?: number
  onCopy?: () => void
  onThumbsUp?: () => void
  onThumbsDown?: () => void
}

/**
 * AIResponse - Enhanced AI response renderer
 * Supports structured content, code blocks, plans, and embedded tool results
 */
export function AIResponse({
  content,
  sections,
  thinking,
  tokensUsed,
  duration,
  onCopy,
  onThumbsUp,
  onThumbsDown,
}: AIResponseProps) {
  const [showThinking, setShowThinking] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.()
  }

  return (
    <div className="bg-surface-tertiary border border-border rounded-lg overflow-hidden">
      {/* Main content */}
      <div className="px-4 py-3 space-y-4">
        {/* AI thinking (collapsible) */}
        {thinking && (
          <div className="bg-surface-primary rounded border border-border">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary transition-colors"
            >
              <ChevronDown
                className={cn('w-4 h-4 transition-transform', showThinking ? 'rotate-180' : '')}
              />
              <span className="text-xs font-semibold text-foreground-secondary">AI Reasoning</span>
            </button>
            {showThinking && (
              <div className="px-3 py-2 border-t border-border text-xs text-foreground-secondary font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                {thinking}
              </div>
            )}
          </div>
        )}

        {/* Sections */}
        {sections && sections.length > 0 ? (
          <div className="space-y-3">
            {sections.map((section, idx) => (
              <div key={idx}>
                {section.type === 'text' && (
                  <p className="text-sm text-foreground leading-relaxed">{section.content}</p>
                )}

                {section.type === 'plan' && (
                  <div className="bg-primary/10 border border-primary/20 rounded p-3">
                    {section.title && (
                      <p className="text-xs font-semibold text-primary mb-2">{section.title}</p>
                    )}
                    <ol className="space-y-2 text-sm text-foreground list-decimal list-inside">
                      {section.content.split('\n').map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {section.type === 'code' && (
                  <div className="bg-[#1e1e1e] rounded border border-border overflow-x-auto">
                    {section.language && (
                      <div className="px-3 py-2 border-b border-border bg-surface-primary text-xs font-mono text-foreground-tertiary">
                        {section.language}
                      </div>
                    )}
                    <pre className="p-3 font-mono text-xs text-foreground-secondary overflow-x-auto">
                      {section.content}
                    </pre>
                  </div>
                )}

                {section.type === 'tool' && (
                  <ToolCard
                    id={`tool-${idx}`}
                    tool="read_file"
                    status="success"
                    description={section.title || 'Tool execution'}
                    output={section.content}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
        )}
      </div>

      {/* Footer with metrics and actions */}
      <div className="border-t border-border px-4 py-2 bg-surface-primary flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tokensUsed && (
            <Badge variant="outline">
              {tokensUsed} tokens
            </Badge>
          )}
          {duration && (
            <Badge variant="outline">
              {duration}ms
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleCopy}
            title="Copy response"
          >
            <Copy className="w-3 h-3" />
            {copied && <span className="text-xs ml-1">Copied!</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={onThumbsUp}
            title="This response was helpful"
          >
            <ThumbsUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={onThumbsDown}
            title="This response was not helpful"
          >
            <ThumbsDown className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
