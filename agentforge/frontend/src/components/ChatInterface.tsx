'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button, Spinner } from '@/components/ui'
import { Send, Plus, Settings } from 'lucide-react'
import { ToolCard } from '@/components/tools'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  tools?: Array<{
    id: string
    type: string
    status: 'running' | 'success' | 'error'
    description: string
  }>
}

/**
 * ChatInterface - Main AI chat with streaming responses and embedded tool cards
 * Shows conversation history and real-time AI operations
 * Integrates with AI execution timeline
 */
export function ChatInterface() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      role: 'user',
      content: 'Build me a full-stack app with authentication',
      timestamp: Date.now() - 60000,
    },
    {
      id: '2',
      role: 'assistant',
      content: 'I\'ll help you build a full-stack app. Let me start by analyzing your project structure and setting up authentication.',
      timestamp: Date.now() - 55000,
      tools: [
        { id: 't1', type: 'read_file', status: 'success', description: 'Reading package.json' },
        { id: 't2', type: 'read_file', status: 'success', description: 'Reading project structure' },
      ],
    },
  ])
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response with tools
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I understand. Let me set up the authentication system for your app. This will involve setting up a database schema, creating auth routes, and configuring session management.',
        timestamp: Date.now(),
        tools: [
          {
            id: 'tool-' + Date.now(),
            type: 'write_file',
            status: 'running',
            description: 'Creating authentication database schema',
          },
        ],
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-surface-primary">
        <h2 className="text-sm font-semibold text-foreground">GITCODE Chat</h2>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🤖</span>
              </div>
              <p className="text-sm font-semibold text-foreground mb-2">Welcome to GITCODE</p>
              <p className="text-xs text-foreground-tertiary mb-4">
                Start by telling the AI what you want to build
              </p>
              <Button variant="primary" size="sm">
                <Plus className="w-3 h-3" />
                New Workspace
              </Button>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-md',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-tertiary text-foreground border border-border'
                )}
                style={{
                  borderRadius: message.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                }}
              >
                {/* Message content */}
                <div className="px-4 py-3">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.timestamp && (
                    <p className={cn('text-xs mt-2 opacity-70')}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                {/* Embedded tool cards */}
                {message.tools && message.tools.length > 0 && (
                  <div className="px-4 pb-3 space-y-2">
                    {message.tools.map(tool => (
                      <div
                        key={tool.id}
                        className="text-xs bg-surface-primary px-3 py-2 rounded border border-border"
                      >
                        <div className="flex items-center gap-2">
                          {tool.status === 'running' && (
                            <Spinner size="sm" color="primary" />
                          )}
                          <span>{tool.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-tertiary border border-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-foreground-tertiary">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-surface-primary">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Tell the AI what to build..."
            className="input-base flex-1 text-sm"
            disabled={isLoading}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-3"
          >
            {isLoading ? <Spinner size="sm" color="white" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-foreground-tertiary mt-2">
          Shift + Enter for new line • Responses may take a moment to generate
        </p>
      </div>
    </div>
  )
}
