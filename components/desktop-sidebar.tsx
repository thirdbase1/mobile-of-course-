'use client'

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutGrid, Wallet, History, User, Gift, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DesktopSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const tabs = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Services", href: "/dashboard/services", icon: LayoutGrid },
  { name: "Referral", href: "/dashboard/referral", icon: Gift },
  { name: "History", href: "/dashboard/transactions", icon: History },
  { name: "Wallet", href: "/dashboard/deposit", icon: Wallet },
  { name: "Profile", href: "/dashboard/profile", icon: User },
]

export function DesktopSidebar({ isOpen, onClose }: DesktopSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Overlay for mobile/tablet when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "app-shell-sidebar fixed md:static md:flex flex-col",
          "transition-transform duration-300 ease-in-out",
          "z-40 md:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Close button - mobile only */}
        <div className="md:hidden p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-lg text-slate-900">Mozosubz</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo - desktop only */}
        <div className="hidden md:block p-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="font-bold text-lg text-slate-900">Mozosubz</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.name}
                href={tab.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200",
                  active
                    ? "bg-blue-100 text-blue-600"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
          <p>© 2026 Mozosubz</p>
        </div>
      </aside>
    </>
  )
}
