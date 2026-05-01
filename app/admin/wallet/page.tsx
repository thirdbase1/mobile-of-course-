import { createAdminClient } from '@/lib/supabase/admin'
import { WalletFundingTable } from '@/components/admin/wallet-funding-table'
import { Clock, CheckCircle, DollarSign, TrendingUp } from 'lucide-react'

export default async function WalletPage() {
  const supabase = createAdminClient()

  const { data: monnifyTransactions, error } = await supabase
    .from('monnify_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[v0] Error fetching monnify transactions:', error)
  }

  const pending = monnifyTransactions?.filter((t) => t.status === 'PENDING').length || 0
  const success = monnifyTransactions?.filter((t) => t.status === 'SUCCESS').length || 0
  const totalPending =
    monnifyTransactions?.filter((t) => t.status === 'PENDING').reduce((sum, t) => sum + (t.amount || 0), 0) || 0
  const totalSuccess =
    monnifyTransactions?.filter((t) => t.status === 'SUCCESS').reduce((sum, t) => sum + (t.amount || 0), 0) || 0
  const totalAll = (monnifyTransactions?.length || 0)

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-row">
          <div>
            <h1>Wallet Funding</h1>
            <p>Track and manage wallet deposit transactions</p>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Total Records</h3>
            <div className="stat-icon">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="stat-value">{totalAll}</div>
          <p className="stat-trend">All deposit attempts</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Pending</h3>
            <div className="stat-icon stat-icon-warning">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">{pending}</div>
          <p className="stat-trend">₦{totalPending.toLocaleString()}</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Completed</h3>
            <div className="stat-icon stat-icon-success">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="stat-value">{success}</div>
          <p className="stat-trend positive">₦{totalSuccess.toLocaleString()}</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Success Rate</h3>
            <div className="stat-icon">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-value">
            {totalAll > 0 ? Math.round((success / totalAll) * 100) : 0}%
          </div>
          <p className="stat-trend">Conversion rate</p>
        </div>
      </div>

      {monnifyTransactions && monnifyTransactions.length > 0 ? (
        <WalletFundingTable transactions={monnifyTransactions} />
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <DollarSign size={32} />
          </div>
          <h3>No funding transactions</h3>
          <p>Wallet funding transactions will appear here</p>
        </div>
      )}
    </div>
  )
}
