"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { NetworkLogo } from "@/lib/utils/network-logo"

interface ConfirmSheetProps {
  show: boolean
  title: string
  network?: string
  page?: 'data' | 'airtime'
  details: { label: string; value: string }[]
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmSheet({ show, title, network, page = 'airtime', details, onConfirm, onCancel, loading }: ConfirmSheetProps) {
  // Lock body scroll and hide nav when sheet is open
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
    <>
      <div className="sheet-overlay open" onClick={onCancel} />
      <div className="bottom-sheet open">
        <div className="sheet-handle" />
        <div className="sheet-title">{title}</div>
        <div className="sheet-body">
          {network && (
            <div className="flex flex-col items-center gap-0 mb-3 pb-3 border-b border-[var(--border)]">
              <NetworkLogo network={network} size="confirm" page={page} />
              <span className="text-[11px] text-[var(--text-3)] mt-1">{network}</span>
            </div>
          )}
          <div className="bg-[var(--bg)] rounded-[16px] mb-3">
            {details.map((item, idx) => (
              <div key={idx} className="confirm-row" style={idx === details.length - 1 ? { borderBottom: "none" } : {}}>
                <span className="confirm-label">{item.label}</span>
                {item.label === "Amount" ? (
                  <span className="confirm-amount">{item.value}</span>
                ) : (
                  <span className="confirm-value">{item.value}</span>
                )}
              </div>
            ))}
          </div>
          <button onClick={onConfirm} disabled={loading} className="btn-accent flex items-center justify-center gap-2 w-full mb-2" style={{ height: '44px' }}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm & Pay"
            )}
          </button>
          <button onClick={onCancel} className="btn-ghost w-full" style={{ height: '40px' }}>
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
