'use client'

import { useState } from 'react'
import { creditUserWallet, debitUserWallet, toggleAdminRole } from '@/lib/actions/admin'
import { Crown, Eye, Plus, Minus } from 'lucide-react'
import { WalletActionModal } from './wallet-action-modal'
import { UserDetailComprehensive } from './user-detail-comprehensive'

interface User {
  id: string
  full_name: string
  email: string
  phone_number: string
  wallet_balance: number
  is_admin: boolean
  created_at: string
}

interface UserTableProps {
  users: User[]
}

export function UserTable({ users }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [action, setAction] = useState<'credit' | 'debit' | null>(null)
  const [detailUserId, setDetailUserId] = useState<string | null>(null)

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    if (!confirm(`${currentIsAdmin ? 'Remove' : 'Grant'} admin privileges?`)) return
    await toggleAdminRole(userId, !currentIsAdmin)
    window.location.reload()
  }

  return (
    <>
      <div className="table-container">
        {/* Desktop table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Wallet</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.full_name || 'N/A'}</td>
                  <td style={{ color: 'var(--admin-text-secondary)' }}>{user.email}</td>
                  <td className="text-mono" style={{ fontSize: 13 }}>
                    {user.phone_number || 'N/A'}
                  </td>
                  <td className="text-mono" style={{ fontWeight: 600 }}>
                    ₦{user.wallet_balance.toLocaleString()}
                  </td>
                  <td>
                    {user.is_admin ? (
                      <span className="badge badge-admin">
                        <Crown size={12} /> Admin
                      </span>
                    ) : (
                      <span className="badge badge-user">User</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--admin-text-secondary)', fontSize: 13 }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => setDetailUserId(user.id)}
                        title="View user details"
                        type="button"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => {
                          setSelectedUser(user)
                          setAction('credit')
                        }}
                        title="Credit wallet"
                        type="button"
                        style={{ color: 'var(--admin-success)' }}
                      >
                        <Plus size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => {
                          setSelectedUser(user)
                          setAction('debit')
                        }}
                        title="Debit wallet"
                        type="button"
                        style={{ color: 'var(--admin-danger)' }}
                      >
                        <Minus size={15} />
                      </button>
                      <button
                        className={`btn btn-icon ${user.is_admin ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        title={user.is_admin ? 'Remove admin' : 'Make admin'}
                        type="button"
                      >
                        <Crown size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="data-list" style={{ padding: 12 }}>
          {users.map((user) => (
            <div key={user.id} className="data-card">
              <div className="data-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="data-card-title">{user.full_name || 'Unnamed user'}</h3>
                  <p className="data-card-subtitle" style={{ wordBreak: 'break-all' }}>
                    {user.email}
                  </p>
                </div>
                {user.is_admin ? (
                  <span className="badge badge-admin">
                    <Crown size={12} /> Admin
                  </span>
                ) : (
                  <span className="badge badge-user">User</span>
                )}
              </div>

              <div className="data-card-grid">
                <div className="data-card-field">
                  <span className="data-card-label">Wallet</span>
                  <span className="data-card-value mono" style={{ fontWeight: 700 }}>
                    ₦{user.wallet_balance.toLocaleString()}
                  </span>
                </div>
                <div className="data-card-field">
                  <span className="data-card-label">Phone</span>
                  <span className="data-card-value mono">{user.phone_number || 'N/A'}</span>
                </div>
                <div className="data-card-field" style={{ gridColumn: '1 / -1' }}>
                  <span className="data-card-label">Joined</span>
                  <span className="data-card-value">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="data-card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDetailUserId(user.id)}
                  type="button"
                  style={{ flex: 1 }}
                >
                  <Eye size={14} />
                  <span>Details</span>
                </button>
                <button
                  className="btn btn-success btn-sm btn-icon"
                  onClick={() => {
                    setSelectedUser(user)
                    setAction('credit')
                  }}
                  type="button"
                  title="Credit wallet"
                >
                  <Plus size={14} />
                </button>
                <button
                  className="btn btn-danger btn-sm btn-icon"
                  onClick={() => {
                    setSelectedUser(user)
                    setAction('debit')
                  }}
                  type="button"
                  title="Debit wallet"
                >
                  <Minus size={14} />
                </button>
                <button
                  className={`btn btn-sm btn-icon ${user.is_admin ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                  type="button"
                  title={user.is_admin ? 'Remove admin' : 'Make admin'}
                >
                  <Crown size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedUser && action && (
        <WalletActionModal
          user={selectedUser}
          action={action}
          onClose={() => {
            setSelectedUser(null)
            setAction(null)
          }}
          onAction={action === 'credit' ? creditUserWallet : debitUserWallet}
        />
      )}

      {detailUserId && (
        <UserDetailComprehensive
          userId={detailUserId}
          onClose={() => setDetailUserId(null)}
        />
      )}
    </>
  )
}
