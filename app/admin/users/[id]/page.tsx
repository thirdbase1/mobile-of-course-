import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UserDetailsCard } from '@/components/admin/user-details-card'
import { UserTransactionsCard } from '@/components/admin/user-transactions-card'
import { ArrowLeft } from 'lucide-react'

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
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-300">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">User Details</h1>
      </div>

      <div className="grid gap-24 md:grid-cols-2">
        <UserDetailsCard user={user} />
        <UserTransactionsCard transactions={transactions} />
      </div>
    </div>
  )
}
