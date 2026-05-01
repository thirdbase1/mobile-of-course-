'use client'

import React from 'react'

export function UpdateBadge({ lastUpdated }: { lastUpdated?: Date }) {
  const timeAgo = React.useMemo(() => {
    if (!lastUpdated) return 'Just now'
    const seconds = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }, [lastUpdated])

  return (
    <div className="update-badge">
      {timeAgo}
    </div>
  )
}

export function UpdateIndicator() {
  return <div className="update-indicator" />
}

export function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <div
      className="loading-spinner"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  )
}

export function DataRefreshHint({ isRefreshing = false }: { isRefreshing?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
      {isRefreshing && <LoadingSpinner size={14} />}
      <span>{isRefreshing ? 'Updating data...' : 'Last updated: Just now'}</span>
    </div>
  )
}
