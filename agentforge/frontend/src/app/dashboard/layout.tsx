'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useStore } from '@/lib/store'
import { getMe } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setUser } = useStore()
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('af_token')
    if (!token) { router.replace('/'); return }
    getMe().then(setUser).catch(() => { localStorage.removeItem('af_token'); router.replace('/') })
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
