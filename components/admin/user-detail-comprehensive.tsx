'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
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

      console.log('[v0] Loading user data for:', userId)

      try {
        // Get user profile
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
        console.log('[v0] User loaded:', userData.full_name)

        // Get recent transactions for this user (limit to 20 for faster loading)
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('id, payment_reference, category, amount, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (txError) {
          console.error('[v0] Error fetching transactions:', txError)
        }

        console.log('[v0] Transactions loaded:', txData?.length || 0)
        setTransactions(txData || [])

        // Calculate statistics from transactions - count WALLET_FUND deposits with SUCCESS status
        const walletFundTransactions = txData?.filter((t) => {
          const isWalletFund = t.category === 'WALLET_FUND'
          const isSuccess = t.status === 'SUCCESS' || t.status === 'success'
          console.log('[v0] Checking tx:', { 
            ref: t.payment_reference, 
            category: t.category, 
            status: t.status, 
            isWalletFund, 
            isSuccess,
            match: isWalletFund && isSuccess 
          })
          return isWalletFund && isSuccess
        }) || []
        
        const totalAmount = walletFundTransactions.reduce((sum, t) => {
          const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount || 0)
          console.log('[v0] Adding to sum:', { amount, sum, newSum: sum + amount })
          return sum + amount
        }, 0)

        console.log('[v0] Wallet fund transactions:', {
          count: walletFundTransactions.length,
          totalAmount,
          transactions: walletFundTransactions.map(t => ({ ref: t.payment_reference, category: t.category, status: t.status, amount: t.amount })),
        })

        setStats({
          totalDeposits: walletFundTransactions.length,
          totalTransactions: txData?.length || 0,
          totalAmount,
        })

        console.log('[v0] Stats calculated:', {
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
          <div className="text-center py-12">Loading user details...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>User Not Found</h2>
            <button onClick={onClose} className="modal-close">
              <X size={20} />
            </button>
          </div>
          <div className="modal-body text-center py-12">User data not available</div>
          <div className="modal-actions">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-xlarge" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Profile - {user.full_name || 'User'}</h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* User Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-900/20 p-4 rounded border border-blue-500/30">
              <div className="text-sm text-blue-300 mb-2">Total Deposits</div>
              <div className="text-2xl font-bold text-blue-400">{stats.totalDeposits}</div>
            </div>
            <div className="bg-emerald-900/20 p-4 rounded border border-emerald-500/30">
              <div className="text-sm text-emerald-300 mb-2">Total Amount Deposited</div>
              <div className="text-2xl font-bold text-emerald-400">₦{stats.totalAmount.toLocaleString()}</div>
            </div>
            <div className="bg-purple-900/20 p-4 rounded border border-purple-500/30">
              <div className="text-sm text-purple-300 mb-2">Total Transactions</div>
              <div className="text-2xl font-bold text-purple-400">{stats.totalTransactions}</div>
            </div>
          </div>

          {/* User Profile Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Profile Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>User ID</label>
                <p className="font-mono text-sm">{user.id}</p>
              </div>

              <div className="detail-item">
                <label>Full Name</label>
                <p>{user.full_name || 'N/A'}</p>
              </div>

              <div className="detail-item">
                <label>Email</label>
                <p className="font-mono text-sm">{user.email}</p>
              </div>

              <div className="detail-item">
                <label>Phone Number</label>
                <p className="font-mono">{user.phone_number || 'N/A'}</p>
              </div>

              <div className="detail-item">
                <label>Username</label>
                <p className="font-mono">{user.username || 'N/A'}</p>
              </div>

              <div className="detail-item">
                <label>Wallet Balance</label>
                <p className="text-lg font-semibold">₦{user.wallet_balance.toLocaleString()}</p>
              </div>

              <div className="detail-item">
                <label>BVN</label>
                <p className="font-mono">{user.bvn || 'N/A'}</p>
              </div>

              <div className="detail-item">
                <label>Role</label>
                <p>
                  <span className={`badge ${user.is_admin ? 'badge-admin' : 'badge-user'}`}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </p>
              </div>

              <div className="detail-item">
                <label>Account Status</label>
                <p>
                  <span className={`badge ${user.account_completed ? 'badge-success' : 'badge-pending'}`}>
                    {user.account_completed ? 'Completed' : 'Incomplete'}
                  </span>
                </p>
              </div>

              <div className="detail-item">
                <label>Joined</label>
                <p>{new Date(user.created_at).toLocaleString()}</p>
              </div>

              <div className="detail-item">
                <label>Last Updated</label>
                <p>{new Date(user.updated_at).toLocaleString()}</p>
              </div>

              {user.monnify_account_number && (
                <div className="detail-item">
                  <label>Monnify Account Number</label>
                  <p className="font-mono">{user.monnify_account_number}</p>
                </div>
              )}

              {user.monnify_bank_name && (
                <div className="detail-item">
                  <label>Monnify Bank Name</label>
                  <p>{user.monnify_bank_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Recent Transactions ({transactions.length} total)</h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No transactions found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left p-2">Reference</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-700 hover:bg-gray-800">
                        <td className="p-2 font-mono text-xs">{tx.payment_reference?.slice(0, 12) || tx.id.slice(0, 8)}</td>
                        <td className="p-2">{tx.category || 'N/A'}</td>
                        <td className="p-2 text-right font-semibold">₦{tx.amount.toLocaleString()}</td>
                        <td className="p-2">
                          <span className={`badge badge-${tx.status.toLowerCase()}`}>{tx.status}</span>
                        </td>
                        <td className="p-2 text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
