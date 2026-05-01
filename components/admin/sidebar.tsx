'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  BarChart3,
  Users,
  CreditCard,
  DollarSign,
  Settings,
  Activity,
  LogOut,
  Banknote,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
  { name: 'Wallet Funding', href: '/admin/wallet', icon: DollarSign },
  { name: 'Pricing Rules', href: '/admin/pricing', icon: Settings },
  { name: 'Deposit Rules', href: '/admin/deposit-rules', icon: Banknote },
  { name: 'Monitoring', href: '/admin/monitoring', icon: Activity },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        type="button"
      >
        <Menu size={20} />
      </button>

      {/* Overlay (mobile only) */}
      {isOpen && (
        <div
          className="sidebar-overlay open"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={cn('admin-sidebar', isOpen && 'open')}>
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-logo">
            <span className="admin-logo-icon">
              <BarChart3 size={18} />
            </span>
            <span>Admin</span>
          </Link>
          <button
            className="sidebar-toggle"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="admin-nav">
          {adminLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn('admin-nav-item', active && 'active')}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/api/auth/signout" className="admin-nav-item logout">
            <LogOut size={18} />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
