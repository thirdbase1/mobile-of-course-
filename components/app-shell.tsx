'use client'

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutGrid, History, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { DesktopSidebar } from "./desktop-sidebar"

interface AppShellProps {
  children: React.ReactNode
}

const tabs = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Services", href: "/dashboard/services", icon: LayoutGrid },
  { name: "History", href: "/dashboard/transactions", icon: History },
  { name: "Profile", href: "/dashboard/profile", icon: User },
]

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="app-shell">
      <DesktopSidebar isOpen={false} onClose={() => {}} />
      <div className="app-content">
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
