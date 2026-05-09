'use client'

import React, { createContext, useContext, useState } from 'react'

export type PermissionScope = 'global' | 'session' | 'once'
export type ToolType = 'read_file' | 'write_file' | 'delete_file' | 'run_command' | 'git_push' | 'deploy' | 'api_call'

export interface PermissionRule {
  id: string
  tool: ToolType
  action: 'allow' | 'ask' | 'deny'
  scope: PermissionScope
  createdAt: number
  expiresAt?: number
}

export interface PendingApproval {
  id: string
  tool: ToolType
  description: string
  details: Record<string, any>
  timestamp: number
  onApprove: () => void
  onDeny: () => void
}

interface PermissionsContextType {
  rules: PermissionRule[]
  pendingApprovals: PendingApproval[]
  
  // Check if tool execution is allowed
  checkPermission: (tool: ToolType) => Promise<boolean>
  
  // Add/update permission rule
  setPermission: (tool: ToolType, action: 'allow' | 'ask' | 'deny', scope: PermissionScope) => void
  
  // Request approval for pending tool
  requestApproval: (approval: PendingApproval) => Promise<boolean>
  
  // Approve pending operation
  approve: (id: string) => void
  
  // Deny pending operation
  deny: (id: string) => void
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

// Default permission rules - conservative security posture
const DEFAULT_RULES: PermissionRule[] = [
  { id: '1', tool: 'read_file', action: 'allow', scope: 'session' },
  { id: '2', tool: 'write_file', action: 'ask', scope: 'once' },
  { id: '3', tool: 'delete_file', action: 'ask', scope: 'once' },
  { id: '4', tool: 'run_command', action: 'ask', scope: 'once' },
  { id: '5', tool: 'git_push', action: 'ask', scope: 'once' },
  { id: '6', tool: 'deploy', action: 'ask', scope: 'once' },
  { id: '7', tool: 'api_call', action: 'allow', scope: 'session' },
]

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<PermissionRule[]>(DEFAULT_RULES)
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])

  const checkPermission = async (tool: ToolType): Promise<boolean> => {
    // Find the most specific rule for this tool
    const rule = rules.find(r => r.tool === tool)
    
    if (!rule || rule.action === 'allow') {
      return true
    }
    
    if (rule.action === 'deny') {
      return false
    }
    
    // action === 'ask' - permission request is handled by caller
    return false
  }

  const setPermission = (tool: ToolType, action: 'allow' | 'ask' | 'deny', scope: PermissionScope) => {
    setRules(prev => {
      const filtered = prev.filter(r => r.tool !== tool)
      return [
        ...filtered,
        {
          id: Date.now().toString(),
          tool,
          action,
          scope,
          createdAt: Date.now(),
          expiresAt: scope === 'session' ? undefined : Date.now() + (24 * 60 * 60 * 1000),
        },
      ]
    })
  }

  const requestApproval = async (approval: PendingApproval): Promise<boolean> => {
    return new Promise(resolve => {
      const handler = {
        ...approval,
        onApprove: () => {
          approval.onApprove()
          resolve(true)
          removePending(approval.id)
        },
        onDeny: () => {
          approval.onDeny()
          resolve(false)
          removePending(approval.id)
        },
      }
      setPendingApprovals(prev => [...prev, handler])
    })
  }

  const approve = (id: string) => {
    const approval = pendingApprovals.find(a => a.id === id)
    if (approval) {
      approval.onApprove()
      removePending(id)
    }
  }

  const deny = (id: string) => {
    const approval = pendingApprovals.find(a => a.id === id)
    if (approval) {
      approval.onDeny()
      removePending(id)
    }
  }

  const removePending = (id: string) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id))
  }

  return (
    <PermissionsContext.Provider
      value={{
        rules,
        pendingApprovals,
        checkPermission,
        setPermission,
        requestApproval,
        approve,
        deny,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider')
  }
  return context
}
