'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useStore } from '@/lib/store'
import { getMe, getRepos, getKeys } from '@/lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { setUser, setRepos } = useStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('af_token')
    if (!token) { router.replace('/'); return }

    setMounted(true)

    // Core Init
    Promise.all([
        getMe().then(setUser),
        getRepos().then(setRepos),
        getKeys() // Ensure keys are in context/memory if needed, but the backend handles them.
                 // However, we fetch to ensure session is valid.
    ]).catch((err) => {
        console.error("Initialization failed", err)
        localStorage.removeItem('af_token');
        router.replace('/')
    })
  }, [])

  if (!mounted) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header />
        <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
