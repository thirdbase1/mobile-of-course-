'use client'

import React from 'react'
import { usePermissions, type ToolType } from '@/lib/permissions-context'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui'
import { Shield, Lock, AlertCircle } from 'lucide-react'

const toolLabels: Record<ToolType, string> = {
  read_file: 'Read Files',
  write_file: 'Write Files',
  delete_file: 'Delete Files',
  run_command: 'Run Commands',
  git_push: 'Push to Git',
  deploy: 'Deploy',
  api_call: 'Make API Calls',
}

const toolDescriptions: Record<ToolType, string> = {
  read_file: 'AI can read and view your project files',
  write_file: 'AI can create and modify files in your project',
  delete_file: 'AI can delete files from your project',
  run_command: 'AI can execute terminal commands',
  git_push: 'AI can push commits to your repository',
  deploy: 'AI can deploy your application',
  api_call: 'AI can make API requests',
}

/**
 * PermissionSettings - Manage AI agent permissions
 * Shows all available tools and their permission levels
 * Supports different permission scopes
 */
export function PermissionSettings() {
  const { rules, setPermission } = usePermissions()

  const getPermissionForTool = (tool: ToolType) => {
    const rule = rules.find(r => r.tool === tool)
    return rule?.action || 'ask'
  }

  const handlePermissionChange = (tool: ToolType, action: 'allow' | 'ask' | 'deny') => {
    setPermission(tool, action, 'global')
  }

  const tools: ToolType[] = [
    'read_file',
    'write_file',
    'delete_file',
    'run_command',
    'git_push',
    'deploy',
    'api_call',
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>AI Agent Permissions</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Security notice */}
          <div className="flex gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-1">Keep your workspace secure</p>
              <p className="text-foreground-secondary text-xs">
                Be cautious with permissions. Always review what AI agents are doing before approving dangerous operations.
              </p>
            </div>
          </div>

          {/* Permission rules */}
          <div className="space-y-3">
            {tools.map(tool => {
              const current = getPermissionForTool(tool)
              return (
                <div key={tool} className="flex items-start justify-between p-3 rounded-lg bg-surface-tertiary border border-border">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{toolLabels[tool]}</p>
                    <p className="text-xs text-foreground-tertiary mt-1">{toolDescriptions[tool]}</p>
                  </div>

                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePermissionChange(tool, 'deny')}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                          current === 'deny'
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-surface-secondary text-foreground-tertiary hover:bg-surface-primary'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handlePermissionChange(tool, 'ask')}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                          current === 'ask'
                            ? 'bg-warning text-foreground'
                            : 'bg-surface-secondary text-foreground-tertiary hover:bg-surface-primary'
                        }`}
                      >
                        Ask
                      </button>
                      <button
                        onClick={() => handlePermissionChange(tool, 'allow')}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                          current === 'allow'
                            ? 'bg-success text-foreground'
                            : 'bg-surface-secondary text-foreground-tertiary hover:bg-surface-primary'
                        }`}
                      >
                        Allow
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button variant="secondary" className="flex-1">
              Reset to Defaults
            </Button>
            <Button variant="primary" className="flex-1">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
