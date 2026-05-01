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
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setIsMobileOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isMobileOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.querySelector('.admin-sidebar')
      const toggleBtn = document.querySelector('.sidebar-toggle')
      if (
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        toggleBtn &&
        !toggleBtn.contains(e.target as Node)
      ) {
        setIsMobileOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMobileOpen])

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <>
      <div className="admin-sidebar-header">
        <Link href="/admin" className="admin-logo">
          <BarChart3 size={24} />
          <span>Admin</span>
        </Link>
        {isMobile && (
          <button
            className="sidebar-toggle"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
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
    </>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          className="sidebar-toggle"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle sidebar"
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 35,
          }}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 39,
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'admin-sidebar',
          isMobile && isMobileOpen && 'open',
          isMobile && !isMobileOpen && 'closed',
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
