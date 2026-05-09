'use client'

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ResizablePanelProps {
  direction: 'horizontal' | 'vertical'
  defaultSize?: number
  minSize?: number
  maxSize?: number
  onResize?: (size: number) => void
  children: ReactNode
  className?: string
}

/**
 * ResizablePanel - Draggable divider for resizing panels
 * Supports both horizontal and vertical resizing
 */
export function ResizablePanel({
  direction,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  onResize,
  children,
  className,
}: ResizablePanelProps) {
  const [size, setSize] = React.useState(defaultSize)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isResizingRef = React.useRef(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizingRef.current = true
    const startPos = direction === 'horizontal' ? e.clientX : e.clientY
    const startSize = size

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current || !containerRef.current) return

      const currentPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY
      const diff = currentPos - startPos

      const containerSize =
        direction === 'horizontal'
          ? containerRef.current.clientWidth
          : containerRef.current.clientHeight

      const sizePercent = (diff / containerSize) * 100
      let newSize = startSize + sizePercent

      newSize = Math.max(minSize, Math.min(maxSize, newSize))
      setSize(newSize)
      onResize?.(newSize)
    }

    const handleMouseUp = () => {
      isResizingRef.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          'overflow-hidden',
          direction === 'horizontal' ? 'flex' : 'flex flex-col',
          className
        )}
      >
        <div
          style={{
            [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
            [direction === 'horizontal' ? 'minWidth' : 'minHeight']: `${minSize}%`,
            [direction === 'horizontal' ? 'maxWidth' : 'maxHeight']: `${maxSize}%`,
          }}
          className={direction === 'horizontal' ? 'overflow-hidden' : 'overflow-hidden flex-1'}
        >
          {children}
        </div>

        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'bg-border hover:bg-primary/30 transition-colors cursor-col-resize',
            direction === 'horizontal' ? 'w-1 flex-shrink-0 hover:w-1.5' : 'h-1 flex-shrink-0 hover:h-1.5'
          )}
        />
      </div>
    </>
  )
}
