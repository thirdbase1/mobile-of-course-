'use client'

import './processing-overlay.css'

interface ProcessingOverlayProps {
  isVisible: boolean
  message?: string
}

export function ProcessingOverlay({ isVisible, message = 'Processing payment...' }: ProcessingOverlayProps) {
  return (
    <div className={`proc-ov ${isVisible ? 'show' : ''}`}>
      <div className="spinner-wrap">
        {/* Outer ring - clockwise, blue to orange gradient */}
        <svg className="ring-outer" width="110" height="110" viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="51" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" />
          <circle
            cx="55"
            cy="55"
            r="51"
            stroke="url(#rg1)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="72 248"
          />
          <defs>
            <linearGradient id="rg1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1a56db" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>

        {/* Inner ring - counter-clockwise, faint orange */}
        <svg className="ring-inner" width="78" height="78" viewBox="0 0 78 78" fill="none">
          <circle cx="39" cy="39" r="35" stroke="rgba(249,115,22,0.12)" strokeWidth="2.5" />
          <circle
            cx="39"
            cy="39"
            r="35"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="32 188"
            opacity="0.55"
          />
        </svg>

        {/* Logo icon - stationary, center, gentle pulse */}
        <div className="logo-still">
          <svg width="56" height="56" viewBox="0 0 96 96" fill="none">
            <defs>
              <linearGradient id="ico2" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1e40af" />
                <stop offset="100%" stopColor="#1a56db" />
              </linearGradient>
            </defs>
            <rect width="96" height="96" rx="26" fill="url(#ico2)" />
            <rect x="1" y="1" width="94" height="48" rx="26" fill="white" fillOpacity="0.06" />
            <rect x="18" y="58" width="8" height="20" rx="3" fill="white" fillOpacity="0.35" />
            <rect x="30" y="46" width="8" height="32" rx="3" fill="white" fillOpacity="0.6" />
            <path
              d="M44 68L44 36L57 52L70 36L70 68"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* Text below spinner */}
      <div className="proc-text">{message}</div>
    </div>
  )
}
