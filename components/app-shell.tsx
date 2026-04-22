'use client'

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutGrid, Wallet, History, User, Gift, Menu } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { DesktopSidebar } from "./desktop-sidebar"

interface AppShellProps {
  children: React.ReactNode
}

const tabs = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Services", href: "/dashboard/services", icon: LayoutGrid },
  { name: "Referral", href: "/dashboard/referral", icon: Gift },
  { name: "History", href: "/dashboard/transactions", icon: History },
  { name: "Profile", href: "/dashboard/profile", icon: User },
]

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="app-shell">
      <DesktopSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-content">
        {/* Top bar with hamburger button - mobile only */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6 text-slate-900" />
          </button>
          <span className="font-bold text-slate-900">Mozosubz</span>
          <div className="w-10" /> {/* Spacer for layout */}
        </div>
        {children}
      </div>

      <nav className="bottom-nav" style={{ contain: "layout style paint" }}>
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn("tab-btn", active && "active")}
              prefetch={true}
            >
              <div className="tab-icon-wrap">
                <tab.icon style={{ width: 19, height: 19 }} />
              </div>
              <span className="tab-label">{tab.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
