'use client'

import { User } from 'lucide-react'

interface UserDetailsCardProps {
  user: any
}

export function UserDetailsCard({ user }: UserDetailsCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <User size={24} />
        <h2>Profile Information</h2>
      </div>

      <div className="card-content">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Full Name</span>
            <p className="info-value">{user.full_name || '-'}</p>
          </div>

          <div className="info-item">
            <span className="info-label">Email</span>
            <p className="info-value">{user.email}</p>
          </div>

          <div className="info-item">
            <span className="info-label">Phone Number</span>
            <p className="info-value">{user.phone_number || '-'}</p>
          </div>

          <div className="info-item">
            <span className="info-label">Username</span>
            <p className="info-value">{user.username || '-'}</p>
          </div>

          <div className="info-item">
            <span className="info-label">Wallet Balance</span>
            <p className="info-value text-lg font-bold text-green-400">
              ₦{user.wallet_balance.toLocaleString()}
            </p>
          </div>

          <div className="info-item">
            <span className="info-label">Account Status</span>
            <p className="info-value">
              {user.is_admin ? (
                <span className="badge badge-admin">Admin</span>
              ) : (
                <span className="badge badge-user">User</span>
              )}
            </p>
          </div>

          <div className="info-item">
            <span className="info-label">Date of Birth</span>
            <p className="info-value">{user.date_of_birth || '-'}</p>
          </div>

          <div className="info-item">
            <span className="info-label">BVN</span>
            <p className="info-value font-mono text-sm">{user.bvn || '-'}</p>
          </div>

          <div className="info-item">
            <span className="info-label">Monnify Account</span>
            <p className="info-value">{user.monnify_account_number || '-'}</p>
          </div>

          <div className="info-item">
            <span className="info-label">Account Name</span>
            <p className="info-value">{user.monnify_account_name || '-'}</p>
          </div>

          <div className="info-item">
            <span className="info-label">Bank Name</span>
            <p className="info-value">{user.monnify_bank_name || '-'}</p>
          </div>

          <div className="info-item">
            <span className="info-label">Joined</span>
            <p className="info-value text-sm">{new Date(user.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = `
.card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid var(--admin-border);
  background: rgba(14, 165, 233, 0.05);
}

.card-header h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--admin-text);
  margin: 0;
}

.card-content {
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--admin-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: var(--admin-text);
  font-size: 14px;
  margin: 0;
  word-break: break-all;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
`

export function UserDetailsCardStyles() {
  return <style>{styles}</style>
}
