import { createAdminClient } from '@/lib/supabase/admin'
import { WalletFundingTable } from '@/components/admin/wallet-funding-table'

export default async function WalletPage() {
  const supabase = createAdminClient()

  // Get all wallet funding transactions using admin client to bypass RLS
  const { data: monnifyTransactions, error } = await supabase
    .from('monnify_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[v0] Error fetching monnify transactions:', error)
  }

  // Get summary stats
  const pending = monnifyTransactions?.filter((t) => t.status === 'PENDING').length || 0
  const success = monnifyTransactions?.filter((t) => t.status === 'SUCCESS').length || 0
  const totalPending = monnifyTransactions
    ?.filter((t) => t.status === 'PENDING')
    .reduce((sum, t) => sum + (t.amount || 0), 0) || 0
  const totalSuccess = monnifyTransactions
    ?.filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + (t.amount || 0), 0) || 0

  console.log('[v0] Wallet page - Real data:', { pending, success, totalPending, totalSuccess })

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Wallet Funding Management</h1>
        <p>Track and manage wallet deposit transactions</p>
      </div>

      <div className="stats-grid-small">
        <div className="stat-card-small">
          <h3>Pending</h3>
          <p className="text-2xl font-bold">{pending}</p>
          <p className="text-sm text-gray-500">₦{totalPending.toLocaleString()}</p>
        </div>
        <div className="stat-card-small">
          <h3>Completed</h3>
          <p className="text-2xl font-bold">{success}</p>
          <p className="text-sm text-gray-500">₦{totalSuccess.toLocaleString()}</p>
        </div>
      </div>

      {monnifyTransactions && monnifyTransactions.length > 0 ? (
        <WalletFundingTable transactions={monnifyTransactions} />
      ) : (
        <div className="text-center py-12">No wallet funding transactions found</div>
      )}
    </div>
  )
}
