import { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRevenueData, getRevenueActivity } from '@/lib/actions/revenue'
import { RevenueOverview } from '@/components/admin/revenue-overview'
import { RevenueBreakdown } from '@/components/admin/revenue-breakdown'
import { RevenueActivityTable } from '@/components/admin/revenue-activity-table'
import { RevenueMetrics } from '@/components/admin/revenue-metrics'
import { CategoryPerformance } from '@/components/admin/category-performance'
import { RevenueForecast } from '@/components/admin/revenue-forecast'
import { WeekComparison } from '@/components/admin/week-comparison'
import { Users, DollarSign, TrendingUp, Zap, Activity } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Dashboard | Mozosubz',
  description: 'Mozosubz admin dashboard - manage system, track revenue and monitor transactions',
}

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  try {
    const [profilesRes, transactionsRes, revenueRes, activityRes] = await Promise.all([
      supabase.from('profiles').select('id, wallet_balance, created_at').order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('id, category, amount, status, created_at')
        .order('created_at', { ascending: false }),
      getRevenueData('all'),
      getRevenueActivity(20),
    ])

    const { data: allProfiles } = profilesRes
    const { data: allTransactions } = transactionsRes

    const userCount = allProfiles?.length || 0
    const successTransactions = allTransactions?.filter((tx) => tx.status === 'SUCCESS') || []
    const totalDepositAmount = successTransactions
      .filter((tx) => tx.category === 'WALLET_FUND')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0)

    const revenueData = revenueRes || {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      allTime: 0,
      depositFeeRevenue: 0,
      markupRevenue: 0,
      todayGrowth: 0,
      weekGrowth: 0,
      monthGrowth: 0,
    }

    const totalEarnings = revenueData.depositFeeRevenue + revenueData.markupRevenue
    const depositPct = revenueData.allTime > 0 ? (revenueData.depositFeeRevenue / revenueData.allTime) * 100 : 0
    const markupPct = revenueData.allTime > 0 ? (revenueData.markupRevenue / revenueData.allTime) * 100 : 0

    return (
      <div className="admin-page">
        {/* Page Header */}
        <div className="admin-header">
          <div className="admin-header-row">
            <div>
              <h1>Revenue Dashboard</h1>
              <p>Real-time overview of system performance and earnings</p>
            </div>
            <div className="admin-header-actions">
              <Link href="/admin/transactions" className="btn">
                <Activity size={16} />
                <span>View Transactions</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Earnings Card + Key Metrics */}
        <div className="stats-grid">
          <div className="stat-card stat-card-gradient">
            <div className="stat-header">
              <h3 className="stat-title">Total Earnings</h3>
              <div className="stat-icon">
                <Zap size={18} />
              </div>
            </div>
            <div className="stat-value">₦{totalEarnings.toLocaleString()}</div>
            <p className="stat-trend">Fees + Markups combined</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">All-Time Revenue</h3>
              <div className="stat-icon">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="stat-value">₦{revenueData.allTime.toLocaleString()}</div>
            <p className="stat-trend positive">Total system revenue</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Deposit Fees</h3>
              <div className="stat-icon stat-icon-success">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="stat-value">₦{revenueData.depositFeeRevenue.toLocaleString()}</div>
            <p className="stat-trend">{depositPct.toFixed(1)}% of total</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Markup Revenue</h3>
              <div className="stat-icon stat-icon-warning">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="stat-value">₦{revenueData.markupRevenue.toLocaleString()}</div>
            <p className="stat-trend">{markupPct.toFixed(1)}% of total</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Key Performance Indicators</h2>
              <p className="admin-card-subtitle">Today's performance at a glance</p>
            </div>
          </div>
          <RevenueMetrics transactions={allTransactions || []} />
        </div>

        {/* Charts grid */}
        <div className="stats-grid">
          <RevenueOverview transactions={allTransactions || []} />
          <RevenueBreakdown
            depositFee={revenueData.depositFeeRevenue}
            markup={revenueData.markupRevenue}
          />
        </div>

        {/* Category Performance */}
        <CategoryPerformance transactions={allTransactions || []} />

        {/* Revenue Forecast */}
        <RevenueForecast transactions={allTransactions || []} />

        {/* Week-over-Week Comparison */}
        <WeekComparison transactions={allTransactions || []} />

        {/* Activity Section */}
        <RevenueActivityTable activity={activityRes || []} />

        {/* Quick Stats Footer */}
        <div className="stats-grid">
          <Link href="/admin/transactions" className="stat-card stat-card-clickable">
            <div className="stat-header">
              <h3 className="stat-title">Total Deposits</h3>
              <div className="stat-icon stat-icon-success">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="stat-value">₦{totalDepositAmount.toLocaleString()}</div>
            <p className="stat-trend positive">
              {successTransactions.filter((tx) => tx.category === 'WALLET_FUND').length} successful deposits
            </p>
          </Link>

          <Link href="/admin/transactions" className="stat-card stat-card-clickable">
            <div className="stat-header">
              <h3 className="stat-title">Total Purchases</h3>
              <div className="stat-icon">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="stat-value">
              {successTransactions.filter((tx) => tx.category !== 'WALLET_FUND').length}
            </div>
            <p className="stat-trend positive">Data, airtime, cable</p>
          </Link>

          <Link href="/admin/users" className="stat-card stat-card-clickable">
            <div className="stat-header">
              <h3 className="stat-title">Active Users</h3>
              <div className="stat-icon">
                <Users size={18} />
              </div>
            </div>
            <div className="stat-value">{userCount.toLocaleString()}</div>
            <p className="stat-trend positive">Registered accounts</p>
          </Link>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[v0] Admin Dashboard Error:', error)
    return (
      <div className="admin-page">
        <div className="empty-state">
          <h3>Error loading dashboard</h3>
          <p>Failed to fetch dashboard data. Please refresh or try again later.</p>
        </div>
      </div>
    )
  }
}
