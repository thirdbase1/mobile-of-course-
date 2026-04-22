"use client"

import { useEffect } from "react"
import { NetworkLogo } from "@/lib/utils/network-logo"

interface SuccessOverlayProps {
  show: boolean
  title: string
  subtitle?: string
  network?: string
  page?: 'data' | 'airtime'
  onDone: () => void
}

export function SuccessOverlay({ show, title, subtitle, network, page = 'airtime', onDone }: SuccessOverlayProps) {
  // Lock body scroll and hide nav when overlay is shown
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('modal-open')
    } else {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-open')
    }
  }, [show])

  if (!show) return null

  return (
    <div className="success-overlay show">
      <div className="flex flex-col items-center justify-center gap-4">
        {network && (
          <NetworkLogo network={network} size="receipt" page={page} />
        )}
        <div className="success-title text-center">{title}</div>
        {subtitle && <div className="success-sub text-center">{subtitle}</div>}
        <button onClick={onDone} className="btn-primary w-full mt-6">
          Done
        </button>
      </div>
    </div>
  )
}
