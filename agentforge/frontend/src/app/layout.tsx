import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentForge — AI Coding Agent',
  description: 'Self-hosted AI coding agent with code execution, GitHub integration, and multi-model support',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
