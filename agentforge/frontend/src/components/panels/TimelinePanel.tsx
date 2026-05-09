'use client'

import React from 'react'
import { useWorkspace } from '@/lib/workspace-context'
import { Button } from '@/components/ui'
import { X, Play, Pause, RotateCcw } from 'lucide-react'
import { StatusBadge } from '@/components/ui'

export interface TimelineEvent {
  id: string
  timestamp: number
  action: string
  status: 'idle' | 'running' | 'success' | 'error'
  details?: string
  nested?: TimelineEvent[]
}

/**
 * TimelinePanel - Real-time AI operation execution timeline
 * Shows all AI tool calls, operations, and results in a live timeline view
 * Inspired by GitHub Actions, Cursor agent feed, and Linear activity
 */
export function TimelinePanel() {
  const { togglePanel } = useWorkspace()
  const [events, setEvents] = React.useState<TimelineEvent[]>([
    {
      id: '1',
      timestamp: Date.now() - 5000,
      action: 'Analyzing repository structure',
      status: 'success',
    },
    {
      id: '2',
      timestamp: Date.now() - 3000,
      action: 'Reading package.json',
      status: 'success',
    },
    {
      id: '3',
      timestamp: Date.now() - 1000,
      action: 'Executing npm install',
      status: 'running',
    },
  ])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-border bg-surface-primary">
        <h2 className="text-sm font-semibold text-foreground">AI Timeline</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Play className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Pause className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => togglePanel('timeline')}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {events.map((event, idx) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {idx < events.length - 1 && (
                <div className="absolute left-3 top-7 w-0.5 h-6 bg-border" />
              )}

              {/* Event item */}
              <div className="flex gap-3">
                {/* Timeline dot */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      event.status === 'running'
                        ? 'animate-pulse bg-accent'
                        : event.status === 'success'
                          ? 'bg-success'
                          : event.status === 'error'
                            ? 'bg-destructive'
                            : 'bg-muted'
                    }`}
                  />
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-surface-tertiary rounded px-2.5 py-2 border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-foreground truncate">
                        {event.action}
                      </p>
                      <StatusBadge status={event.status} pulse={event.status === 'running'} />
                    </div>
                    {event.details && (
                      <p className="text-xs text-foreground-tertiary mt-1">{event.details}</p>
                    )}
                  </div>

                  {/* Nested events */}
                  {event.nested && event.nested.length > 0 && (
                    <div className="mt-2 ml-3 pl-3 border-l border-border space-y-2">
                      {event.nested.map(nestedEvent => (
                        <div key={nestedEvent.id} className="flex gap-2">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-foreground-secondary">
                              {nestedEvent.action}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
