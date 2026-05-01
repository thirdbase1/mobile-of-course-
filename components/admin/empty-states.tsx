'use client'

import React from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionText = 'Create New',
}: {
  icon?: React.ComponentType<{ size: number; strokeWidth: number }>
  title: string
  description?: string
  action?: () => void
  actionText?: string
}) {
  return (
    <div className="empty-state">
      {Icon && (
        <div style={{ marginBottom: '20px' }}>
          <Icon size={80} strokeWidth={1} />
        </div>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && (
        <button className="btn" onClick={action} style={{ marginTop: '20px' }}>
          {actionText}
        </button>
      )}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Failed to load data. Please try again.',
  action,
  actionText = 'Try Again',
}: {
  title?: string
  description?: string
  action?: () => void
  actionText?: string
}) {
  return (
    <div className="empty-state" style={{ color: 'var(--admin-danger)' }}>
      <div style={{ marginBottom: '20px', fontSize: '60px' }}>⚠️</div>
      <h3 style={{ color: 'var(--admin-danger)' }}>{title}</h3>
      <p style={{ color: 'var(--admin-text-secondary)' }}>{description}</p>
      {action && (
        <button className="btn btn-danger" onClick={action} style={{ marginTop: '20px' }}>
          {actionText}
        </button>
      )}
    </div>
  )
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="empty-state">
      <div className="loading-spinner" style={{ width: '40px', height: '40px', marginBottom: '20px', marginLeft: 'auto', marginRight: 'auto' }} />
      <p>{message}</p>
    </div>
  )
}
