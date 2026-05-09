import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  description?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, description, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-foreground mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          'input-base',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {description && <p className="text-xs text-foreground-tertiary mt-1">{description}</p>}
    </div>
  )
)

Input.displayName = 'Input'

export { Input }
