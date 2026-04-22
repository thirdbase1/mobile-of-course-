'use client'

export function Logo() {
  return (
    <div className="flex items-center gap-[9px]">
      {/* Logo icon - 34x34px with border-radius 10px */}
      <div className="w-[34px] h-[34px] rounded-[10px] overflow-hidden flex-shrink-0">
        <svg width="34" height="34" viewBox="0 0 96 96" fill="none">
          <defs>
            <linearGradient id="ico" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#1a56db" />
            </linearGradient>
            <linearGradient id="blt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
          </defs>
          <rect width="96" height="96" rx="26" fill="url(#ico)" />
          <rect x="1" y="1" width="94" height="48" rx="26" fill="white" fillOpacity="0.06" />
          <rect x="18" y="58" width="8" height="20" rx="3" fill="white" fillOpacity="0.35" />
          <rect x="30" y="46" width="8" height="32" rx="3" fill="white" fillOpacity="0.6" />
          <path d="M44 68L44 36L57 52L70 36L70 68" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      {/* Logo wordmark - Space Grotesk 700, color #0b1120 */}
      <span className="font-[var(--font-space-grotesk)] text-[20px] font-bold text-[#0b1120] tracking-[-0.5px]">
        mozosubz
      </span>
    </div>
  )
}
