'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function CompleteProfilePage() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, username, phone_number')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          setFullName(profile.full_name || '')
          setUsername(profile.username || '')
          setPhone(profile.phone_number || '')
        }
      } catch (err) {
        console.error('[COMPLETE] Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }

    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (!phone.trim()) {
      setError('Phone number is required')
      return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        setSubmitting(false)
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: fullName.trim(),
          username: username.toLowerCase().trim(),
          phone_number: phone.trim(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      if (updateError) {
        setError(updateError.message || 'Failed to update profile')
        setSubmitting(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-6 h-6 animate-spin text-[#1a56db]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-2">
      <div className="w-full max-w-[360px]">
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] p-4 shadow-sm">
          <h1 className="text-base font-bold text-[#1e293b] text-center mb-1">Complete Your Profile</h1>
          <p className="text-xs text-[#64748b] text-center mb-4">We need some info to get started</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2.5 bg-[#fee2e2] border border-[#fecaca] rounded-lg text-xs text-[#dc2626]">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="full_name" className="block text-xs font-semibold text-[#64748b] mb-0.5">
                Full Name
              </label>
              <input
                id="full_name"
                type="text"
                placeholder="John Doe"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none focus:border-[#1a56db] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-[#64748b] mb-0.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="godswill"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                disabled={submitting}
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none focus:border-[#1a56db] focus:bg-white transition-colors"
              />
              <p className="text-xs text-[#94a3b8] mt-0.5">No spaces, lowercase only</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-[#64748b] mb-0.5">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="08012345678"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none focus:border-[#1a56db] focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 bg-[#1a56db] text-white text-sm font-semibold rounded-lg hover:bg-[#1e40af] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
