'use client'

import React from 'react'
import { usePermissions } from '@/lib/permissions-context'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { AlertCircle, Shield } from 'lucide-react'

/**
 * ApprovalPrompt - Floating approval request interface
 * Shows pending AI tool execution requests
 * Follows macOS security prompts + GitHub Actions approval patterns
 */
export function ApprovalPrompt() {
  const { pendingApprovals, approve, deny } = usePermissions()

  if (pendingApprovals.length === 0) return null

  const current = pendingApprovals[0]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card elevated className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Approval Required</CardTitle>
          </div>
          <CardDescription>AI agent requested permission to execute action</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Warning message */}
          <div className="flex gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning">{current.description}</div>
          </div>

          {/* Operation details */}
          <div className="bg-surface-tertiary rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold text-foreground mb-2">Operation Details</p>
            <div className="font-mono text-xs text-foreground-tertiary space-y-1">
              {Object.entries(current.details).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-primary min-w-max">{key}:</span>
                  <span className="truncate">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Permission options */}
          <div className="bg-surface-secondary p-3 rounded-lg border border-border">
            <p className="text-xs font-semibold text-foreground mb-2">Remember this choice?</p>
            <div className="space-y-2 text-xs text-foreground-tertiary">
              <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                <input type="radio" name="scope" value="once" defaultChecked className="w-3 h-3" />
                <span>Just this time</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                <input type="radio" name="scope" value="session" className="w-3 h-3" />
                <span>For this session</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                <input type="radio" name="scope" value="global" className="w-3 h-3" />
                <span>Always allow</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deny(current.id)}
            >
              Deny
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => approve(current.id)}
            >
              Approve
            </Button>
          </div>

          {/* Queue indicator */}
          {pendingApprovals.length > 1 && (
            <div className="text-xs text-center text-foreground-tertiary">
              {pendingApprovals.length - 1} more request{pendingApprovals.length > 2 ? 's' : ''} pending
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
