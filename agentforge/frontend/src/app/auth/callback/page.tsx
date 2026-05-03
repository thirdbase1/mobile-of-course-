'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function Inner() {
  const router = useRouter()
  const params = useSearchParams()
  useEffect(() => {
    const token = params.get('token')
    if (token) { localStorage.setItem('af_token', token); router.replace('/dashboard') }
    else router.replace('/?error=' + (params.get('error') || 'auth_failed'))
  }, [params, router])
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Signing you in…</p>
      </div>
    </div>
  )
}

export default function Callback() {
  return <Suspense fallback={null}><Inner /></Suspense>
}
