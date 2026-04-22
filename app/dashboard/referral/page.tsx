import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getReferralStats } from '@/lib/referral'
import { AlertCircle, Users } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'

async function ReferralHeader({ username, shareUrl }: { username: string | null, shareUrl: string | null }) {
  if (!username) {
    return (
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
        <p className="text-xs font-semibold text-[#64748b] mb-3">Your Referral Username</p>
        <div className="bg-[#eef3ff] rounded-2xl p-4 mb-4 border border-[rgba(26,86,219,0.2)] animate-pulse">
          <p className="text-2xl font-bold text-transparent">@loading</p>
        </div>
        <div className="h-10 bg-[#f1f5f9] rounded-lg animate-pulse mb-3" />
        <p className="text-xs text-[#94a3b8] text-center mt-3">
          Share your username. Earn ₦1-2 per transaction.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
      <p className="text-xs font-semibold text-[#64748b] mb-3">Your Referral Username</p>
      <div className="bg-[#eef3ff] rounded-2xl p-4 mb-4 border border-[rgba(26,86,219,0.2)]">
        <p className="text-2xl font-bold text-[#1a56db] text-center">
          @{username}
        </p>
      </div>
      <CopyButton shareUrl={shareUrl} />
      <p className="text-xs text-[#94a3b8] text-center mt-3">
        Share your username. Earn ₦1-2 per transaction.
      </p>
    </div>
  )
}

export default async function ReferralPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const stats = await getReferralStats(user.id)

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-24">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b]">Referral Program</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Share your code and earn money every time your friends make a transaction
          </p>
        </div>

        {/* Your Code */}
        <ReferralHeader username={stats.username} shareUrl={stats.share_url} />

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 text-center">
            <p className="text-2xl font-bold text-[#1e293b]">{stats.total_referred}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Friends Referred</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 text-center">
            <p className="text-2xl font-bold text-[#16a34a]">{stats.active_referees}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Active</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 text-center">
            <p className="text-2xl font-bold text-[#1e293b]">₦{stats.total_earned.toFixed(2)}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Total Earned</p>
          </div>
        </div>

        {/* Unpaid Balance */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <p className="text-xs font-semibold text-[#64748b] mb-2">Unpaid Balance</p>
          <p className="text-3xl font-bold text-[#16a34a] mb-3">
            ₦{stats.unpaid_earned.toFixed(2)}
          </p>
          {stats.unpaid_earned < 20 && (
            <div className="flex gap-2 text-xs text-[#d97706] bg-[#fef3c7] p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Below ₦20 minimum — balance rolls until ₦20</span>
            </div>
          )}
          {stats.unpaid_earned >= 20 && (
            <p className="text-xs text-[#94a3b8]">
              Contact support to request payout
            </p>
          )}
        </div>

        {/* Referred Friends */}
        <div>
          <h2 className="text-lg font-bold text-[#1e293b] mb-4">Friends</h2>
          {stats.referrals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center">
              <Users className="w-10 h-10 text-[#94a3b8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#1e293b]">No referrals yet</p>
              <p className="text-xs text-[#94a3b8]">Share your code to start earning</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.referrals.map((referral, idx) => (
                <div
                  key={referral.id}
                  className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex items-center gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      referral.status === 'ACTIVE'
                        ? 'bg-[#1a56db]'
                        : 'bg-[#94a3b8]'
                    }`}
                  >
                    F{idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1e293b]">
                      Friend {idx + 1}
                    </p>
                    <p className="text-xs text-[#94a3b8]">
                      Joined{' '}
                      {new Date(referral.created_at).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      referral.status === 'ACTIVE'
                        ? 'bg-[#dcfce7] text-[#16a34a]'
                        : 'bg-[#f3f4f6] text-[#6b7280]'
                    }`}
                  >
                    {referral.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Earnings */}
        <div>
          <h2 className="text-lg font-bold text-[#1e293b] mb-4">Earnings</h2>
          {stats.recent_earnings.length === 0 ? (
            <div className="text-center text-sm text-[#94a3b8]">
              No earnings yet. Earnings appear after friends transact.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recent_earnings.map((earning) => (
                <div
                  key={earning.id}
                  className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-[#f0f9ff] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#1a56db]">₦</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1e293b]">
                      {earning.category}
                    </p>
                    <p className="text-xs text-[#94a3b8]">
                      {new Date(earning.created_at).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#16a34a]">
                      +₦{earning.commission.toFixed(2)}
                    </p>
                    <p className="text-xs text-[#94a3b8]">
                      {earning.paid ? 'Paid' : 'Unpaid'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
