'use client'

import React from 'react'
import { useWorkspace } from '@/lib/workspace-context'
import { Button } from '@/components/ui'
import { X, Send, Plus } from 'lucide-react'

/**
 * ChatPanel - AI conversation and instruction interface
 * Shows chat history and allows user to communicate with AI agents
 */
export function ChatPanel() {
  const { togglePanel } = useWorkspace()
  const [messages, setMessages] = React.useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = React.useState('')

  const handleSend = () => {
    if (!input.trim()) return
    setMessages([...messages, { role: 'user', content: input }])
    setInput('')
    // AI response would come from websocket/api
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-surface-primary">
        <h2 className="text-sm font-semibold text-foreground">Chat</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => togglePanel('chat')}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-foreground-tertiary mb-4">No messages yet</p>
              <Button variant="primary" size="sm">
                <Plus className="w-3 h-3" />
                Start Conversation
              </Button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-tertiary text-foreground'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-surface-primary">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="input-base flex-1 text-sm"
          />
          <Button variant="primary" size="sm" onClick={handleSend} className="px-3">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
