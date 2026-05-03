'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useStore } from '@/lib/store'
import { getMe, getRepos } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setUser, setRepos, sidebarOpen } = useStore()
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('af_token')
    if (!token) { router.replace('/'); return }
    getMe().then(setUser).catch(() => { localStorage.removeItem('af_token'); router.replace('/') })
    getRepos().then(setRepos).catch(() => {})
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
