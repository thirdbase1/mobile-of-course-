'use client'

import { useEffect, useState } from 'react'
import { X, User, Wallet, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UserDetailModalProps {
  userId: string
  onClose: () => void
}

export function UserDetailComprehensive({ userId, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalDeposits: 0, totalTransactions: 0, totalAmount: 0 })

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()

      try {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (userError) {
          console.error('[v0] Error fetching user:', userError)
          setLoading(false)
          return
        }

        setUser(userData)

        const { data: txData } = await supabase
          .from('transactions')
          .select('id, payment_reference, category, amount, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)

        setTransactions(txData || [])

        const walletFundTransactions =
          txData?.filter((t) => {
            const isWalletFund = t.category === 'WALLET_FUND'
            const isSuccess = t.status === 'SUCCESS' || t.status === 'success'
            return isWalletFund && isSuccess
          }) || []

        const totalAmount = walletFundTransactions.reduce((sum, t) => {
          const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount || 0
          return sum + amount
        }, 0)

        setStats({
          totalDeposits: walletFundTransactions.length,
          totalTransactions: txData?.length || 0,
          totalAmount,
        })

        setLoading(false)
      } catch (error) {
        console.error('[v0] Unexpected error loading user data:', error)
        setLoading(false)
      }
    }

    loadUserData()
  }, [userId])

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="empty-state">
              <p>Loading user details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">User Not Found</h2>
            <button onClick={onClose} className="modal-close" aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div className="empty-state">
              <p>User data not available</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  const status = (s: string) => {
    const v = s?.toUpperCase()
    if (v === 'SUCCESS') return 'badge-success'
    if (v === 'PENDING') return 'badge-warning'
    if (v === 'FAILED') return 'badge-danger'
    return 'badge-info'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{user.full_name || 'User'}</h2>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* User Stats */}
          <div className="kpi-grid" style={{ marginBottom: 'var(--admin-space-lg)' }}>
            <div className="kpi-card">
              <div className="kpi-label">Total Deposits</div>
              <div className="kpi-value">{stats.totalDeposits}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Amount Deposited</div>
              <div className="kpi-value" style={{ color: 'var(--admin-success)' }}>
                ₦{stats.totalAmount.toLocaleString()}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Transactions</div>
              <div className="kpi-value">{stats.totalTransactions}</div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <User size={16} />
              Profile Information
            </h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>User ID</label>
                <p className="text-mono text-xs">{user.id}</p>
              </div>
              <div className="detail-item">
                <label>Full Name</label>
                <p>{user.full_name || 'N/A'}</p>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <p className="text-mono text-sm">{user.email}</p>
              </div>
              <div className="detail-item">
                <label>Phone</label>
                <p className="text-mono">{user.phone_number || 'N/A'}</p>
              </div>
              <div className="detail-item">
                <label>Username</label>
                <p>{user.username || 'N/A'}</p>
              </div>
              <div className="detail-item">
                <label>Wallet Balance</label>
                <p style={{ fontWeight: 700, color: 'var(--admin-success)' }}>
                  ₦{Number(user.wallet_balance || 0).toLocaleString()}
                </p>
              </div>
              <div className="detail-item">
                <label>Role</label>
                <p>
                  <span className={`badge ${user.is_admin ? 'badge-info' : 'badge-secondary'}`}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </p>
              </div>
              <div className="detail-item">
                <label>Account Status</label>
                <p>
                  <span className={`badge ${user.account_completed ? 'badge-success' : 'badge-warning'}`}>
                    {user.account_completed ? 'Completed' : 'Incomplete'}
                  </span>
                </p>
              </div>
              <div className="detail-item">
                <label>Joined</label>
                <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              {user.bvn && (
                <div className="detail-item">
                  <label>BVN</label>
                  <p className="text-mono">{user.bvn}</p>
                </div>
              )}
              {user.monnify_account_number && (
                <div className="detail-item">
                  <label>Monnify Account</label>
                  <p className="text-mono">{user.monnify_account_number}</p>
                </div>
              )}
              {user.monnify_bank_name && (
                <div className="detail-item">
                  <label>Monnify Bank</label>
                  <p>{user.monnify_bank_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <Activity size={16} />
              Recent Transactions ({transactions.length})
            </h3>
            {transactions.length === 0 ? (
              <div className="empty-state">
                <p>No transactions found</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="data-list">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="data-card">
                      <div className="data-card-row">
                        <div className="data-card-label">Reference</div>
                        <div className="data-card-value text-mono text-xs">
                          {tx.payment_reference?.slice(0, 16) || tx.id.slice(0, 8)}
                        </div>
                      </div>
                      <div className="data-card-row">
                        <div className="data-card-label">Category</div>
                        <div className="data-card-value">{tx.category || 'N/A'}</div>
                      </div>
                      <div className="data-card-row">
                        <div className="data-card-label">Amount</div>
                        <div className="data-card-value" style={{ fontWeight: 700 }}>
                          ₦{Number(tx.amount).toLocaleString()}
                        </div>
                      </div>
                      <div className="data-card-row">
                        <div className="data-card-label">Status</div>
                        <div className="data-card-value">
                          <span className={`badge ${status(tx.status)}`}>{tx.status}</span>
                        </div>
                      </div>
                      <div className="data-card-row">
                        <div className="data-card-label">Date</div>
                        <div className="data-card-value text-sm">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="text-mono text-xs">
                            {tx.payment_reference?.slice(0, 12) || tx.id.slice(0, 8)}
                          </td>
                          <td>{tx.category || 'N/A'}</td>
                          <td style={{ fontWeight: 700 }}>₦{Number(tx.amount).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${status(tx.status)}`}>{tx.status}</span>
                          </td>
                          <td className="text-sm" style={{ color: 'var(--admin-text-secondary)' }}>
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
