'use client'

import { useState } from 'react'
import Link from 'next/link'
import { creditUserWallet, debitUserWallet, toggleAdminRole } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
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
    await toggleAdminRole(userId, !currentIsAdmin)
    window.location.reload()
  }

  return (
    <>
      <div className="table-container">
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
                <td className="font-semibold">{user.full_name || 'N/A'}</td>
                <td>{user.email}</td>
                <td>{user.phone_number || 'N/A'}</td>
                <td className="font-mono">₦{user.wallet_balance.toLocaleString()}</td>
                <td>
                  {user.is_admin ? (
                    <span className="badge badge-admin">
                      <Crown size={14} /> Admin
                    </span>
                  ) : (
                    <span className="badge badge-user">User</span>
                  )}
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailUserId(user.id)}
                      title="View full user details"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setAction('credit')
                      }}
                    >
                      <Plus size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setAction('debit')
                      }}
                    >
                      <Minus size={16} />
                    </Button>
                    <Button
                      variant={user.is_admin ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                    >
                      <Crown size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
