'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (panelRef.current && buttonRef.current) {
        if (
          !panelRef.current.contains(target) &&
          !buttonRef.current.contains(target)
        ) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="notif-btn"
      >
        <Bell style={{ width: 18, height: 18, color: '#475569' }} />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute top-full right-0 mt-2 w-[280px] bg-white rounded-[16px] border border-[rgba(0,0,0,0.08)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.06)]">
            <span className="text-sm font-bold text-[var(--text-1)]">
              Notifications
            </span>
            <button className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors">
              Mark all read
            </button>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <BellOff
              style={{ width: 32, height: 32, color: '#cbd5e1' }}
              className="mb-3"
            />
            <p className="text-sm text-[var(--text-3)]">
              No notifications yet
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
