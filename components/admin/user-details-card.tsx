'use client'

import { User } from 'lucide-react'

interface UserDetailsCardProps {
  user: any
}

export function UserDetailsCard({ user }: UserDetailsCardProps) {
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div className="admin-card-icon">
          <User size={18} />
        </div>
        <h2 className="admin-card-title">Profile Information</h2>
      </div>

      <div className="admin-card-body">
        <div className="detail-grid">
          <div className="detail-item">
            <label>Full Name</label>
            <p>{user.full_name || '-'}</p>
          </div>

          <div className="detail-item">
            <label>Email</label>
            <p className="text-mono text-sm">{user.email}</p>
          </div>

          <div className="detail-item">
            <label>Phone Number</label>
            <p className="text-mono">{user.phone_number || '-'}</p>
          </div>

          <div className="detail-item">
            <label>Username</label>
            <p>{user.username || '-'}</p>
          </div>

          <div className="detail-item">
            <label>Wallet Balance</label>
            <p style={{ fontWeight: 700, color: 'var(--admin-success)' }}>
              ₦{Number(user.wallet_balance || 0).toLocaleString()}
            </p>
          </div>

          <div className="detail-item">
            <label>Account Status</label>
            <p>
              {user.is_admin ? (
                <span className="badge badge-info">Admin</span>
              ) : (
                <span className="badge badge-secondary">User</span>
              )}
            </p>
          </div>

          <div className="detail-item">
            <label>Date of Birth</label>
            <p>{user.date_of_birth || '-'}</p>
          </div>

          <div className="detail-item">
            <label>BVN</label>
            <p className="text-mono text-sm">{user.bvn || '-'}</p>
          </div>

          <div className="detail-item">
            <label>Monnify Account</label>
            <p className="text-mono">{user.monnify_account_number || '-'}</p>
          </div>

          <div className="detail-item">
            <label>Account Name</label>
            <p>{user.monnify_account_name || '-'}</p>
          </div>

          <div className="detail-item">
            <label>Bank Name</label>
            <p>{user.monnify_bank_name || '-'}</p>
          </div>

          <div className="detail-item">
            <label>Joined</label>
            <p className="text-sm">{new Date(user.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function UserDetailsCardStyles() {
  return null
}
