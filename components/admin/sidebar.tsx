'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Users,
  CreditCard,
  DollarSign,
  Settings,
  Activity,
  LogOut,
  Banknote,
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

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <Link href="/admin" className="admin-logo">
          <BarChart3 className="mr-2" size={24} />
          <span>Admin</span>
        </Link>
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
              <Icon size={20} />
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href="/api/auth/signout" className="admin-nav-item logout">
          <LogOut size={20} />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  )
}
