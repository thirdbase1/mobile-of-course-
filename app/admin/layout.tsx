import type React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { isHardcodedAdmin } from '@/lib/utils/hardcoded-admin'
import { AdminSidebar } from '@/components/admin/sidebar'
import '@/styles/admin.css'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Admin Panel - Mozosubz',
  description: 'Admin dashboard for managing users, transactions, and pricing',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()

  // Use getUser() instead of getSession() - authenticates with Supabase server
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check hardcoded admin first
  if (isHardcodedAdmin(user.email)) {
    return (
      <div className="admin-container">
        <AdminSidebar />
        <main className="admin-main">{children}</main>
      </div>
    )
  }

  // Check if user is admin in database
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/login')
  }

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  )
}
