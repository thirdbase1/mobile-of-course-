'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get('token')
    const error = params.get('error')
    if (token) {
      localStorage.setItem('af_token', token)
      router.replace('/dashboard')
    } else {
      router.replace('/?error=' + (error || 'auth_failed'))
    }
  }, [params, router])

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Signing you in…</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return <Suspense><CallbackInner /></Suspense>
}
