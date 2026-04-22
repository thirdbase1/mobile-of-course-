"use client"

import type React from "react"

export const ShaderBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black opacity-80"
        style={{
          animation: "gradient 15s ease infinite",
          backgroundSize: "200% 200%",
        }}
      />
      <svg
        className="absolute w-full h-full opacity-30"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>
        <circle cx="100" cy="200" r="150" fill="rgba(59, 130, 246, 0.1)" filter="url(#blur)" />
        <circle cx="1100" cy="600" r="200" fill="rgba(139, 92, 246, 0.1)" filter="url(#blur)" />
      </svg>
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
