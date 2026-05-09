import React from 'react'
import { cn } from '@/lib/utils'

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'idle' | 'running' | 'success' | 'error' | 'warning' | 'pending'
  label?: string
  pulse?: boolean
}

function StatusBadge({
  status,
  label,
  pulse = true,
  className,
  ...props
}: StatusBadgeProps) {
  const statusConfig = {
    idle: {
      dot: 'bg-foreground-tertiary',
      bg: 'bg-foreground-tertiary/10',
      text: 'text-foreground-secondary',
      label: label || 'Idle',
    },
    running: {
      dot: 'bg-accent',
      bg: 'bg-accent/10',
      text: 'text-accent',
      label: label || 'Running',
      pulse: true,
    },
    success: {
      dot: 'bg-success',
      bg: 'bg-success/10',
      text: 'text-success',
      label: label || 'Success',
    },
    error: {
      dot: 'bg-destructive',
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      label: label || 'Error',
    },
    warning: {
      dot: 'bg-warning',
      bg: 'bg-warning/10',
      text: 'text-warning',
      label: label || 'Warning',
    },
    pending: {
      dot: 'bg-warning',
      bg: 'bg-warning/10',
      text: 'text-warning',
      label: label || 'Pending',
      pulse: true,
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        config.bg,
        config.text,
        'border-transparent',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          config.dot,
          config.pulse && pulse && 'animate-pulse'
        )}
      />
      {config.label}
    </div>
  )
}

export { StatusBadge }
