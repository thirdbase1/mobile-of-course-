import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UserDetailsCard } from '@/components/admin/user-details-card'
import { UserTransactionsCard } from '@/components/admin/user-transactions-card'
import { ArrowLeft, User } from 'lucide-react'

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !user) {
    notFound()
  }

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <Link
          href="/admin/users"
          className="btn btn-ghost btn-icon"
          style={{ marginBottom: 12, alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={16} />
          <span>Back to users</span>
        </Link>
        <div>
          <h1 className="admin-page-title">
            <User
              size={22}
              style={{ display: 'inline', marginRight: 10, verticalAlign: '-3px' }}
            />
            {user.full_name || 'User profile'}
          </h1>
          <p className="admin-page-subtitle" style={{ wordBreak: 'break-all' }}>
            {user.email}
          </p>
        </div>
      </div>

      <div className="grid-2col" style={{ gap: 20 }}>
        <UserDetailsCard user={user} />
        <UserTransactionsCard transactions={transactions || []} />
      </div>
    </div>
  )
}
