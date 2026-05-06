'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useStore } from '@/lib/store'
import { getMe, getRepos } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setUser, setRepos, sidebarOpen } = useStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('af_token')
    if (!token) { router.replace('/'); return }

    setMounted(true)

    getMe().then(setUser).catch(() => {
      localStorage.removeItem('af_token');
      router.replace('/')
    })
    getRepos().then(setRepos).catch(() => {})
  }, [])

  if (!mounted) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        {children}
      </main>
    </div>
  )
}
