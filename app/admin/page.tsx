import { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRevenueData, getRevenueActivity } from '@/lib/actions/revenue'
import { StatCard } from '@/components/admin/stat-card'
import { RevenueOverview } from '@/components/admin/revenue-overview'
import { RevenueBreakdown } from '@/components/admin/revenue-breakdown'
import { RevenueActivityTable } from '@/components/admin/revenue-activity-table'
import { RevenueMetrics } from '@/components/admin/revenue-metrics'
import { CategoryPerformance } from '@/components/admin/category-performance'
import { RevenueForecast } from '@/components/admin/revenue-forecast'
import { WeekComparison } from '@/components/admin/week-comparison'
import { Users, DollarSign, TrendingUp, Zap, Settings, BarChart3, Activity, Clock, Target } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Dashboard | Mozosubz',
  description: 'Mozosubz admin dashboard - manage system, track revenue and monitor transactions',
}

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  try {
    // Fetch all system metrics in parallel
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

    return (
      <div className="admin-page">
        {/* Page Header */}
        <div className="admin-header">
          <div className="admin-header-content">
            <h1>Revenue Dashboard</h1>
            <p>Real-time overview of system performance and earnings</p>
          </div>
          <div className="admin-header-actions">
            <Link href="/admin/transactions" className="btn">
              <Activity size={18} />
              View Transactions
            </Link>
          </div>
        </div>

        {/* Key Metrics Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">All-Time Revenue</h3>
              <div className="stat-icon">
                <DollarSign />
              </div>
            </div>
            <div className="stat-value">₦{revenueData.allTime.toLocaleString()}</div>
            <p className="stat-trend positive">Total system earnings</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Deposit Fees</h3>
              <div className="stat-icon">
                <Zap />
              </div>
            </div>
            <div className="stat-value">₦{revenueData.depositFeeRevenue.toLocaleString()}</div>
            <p className="stat-trend positive">{((revenueData.depositFeeRevenue / revenueData.allTime) * 100 || 0).toFixed(1)}% of total</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Markup Revenue</h3>
              <div className="stat-icon">
                <TrendingUp />
              </div>
            </div>
            <div className="stat-value">₦{revenueData.markupRevenue.toLocaleString()}</div>
            <p className="stat-trend positive">{((revenueData.markupRevenue / revenueData.allTime) * 100 || 0).toFixed(1)}% of total</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Active Users</h3>
              <div className="stat-icon">
                <Users />
              </div>
            </div>
            <div className="stat-value">{userCount.toLocaleString()}</div>
            <p className="stat-trend positive">{successTransactions.length} successful transactions</p>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ gridColumn: 'span 1' }} className="table-container" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} />
              Revenue Trend
            </h3>
            <RevenueOverview transactions={allTransactions || []} />
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--admin-text)', marginBottom: '16px' }}>Key Performance Indicators</h2>
          <RevenueMetrics transactions={allTransactions || []} />
        </div>

        {/* Main Analytics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Revenue Overview */}
          <div style={{ gridColumn: 'span 1' }}>
            <RevenueOverview transactions={allTransactions || []} />
          </div>

          {/* Revenue Breakdown */}
          <div style={{ gridColumn: 'span 1' }}>
            <RevenueBreakdown depositFee={revenueData.depositFeeRevenue} markup={revenueData.markupRevenue} />
          </div>
        </div>

        {/* Category Performance */}
        <div style={{ marginBottom: '32px' }}>
          <CategoryPerformance transactions={allTransactions || []} />
        </div>

        {/* Revenue Forecast */}
        <div style={{ marginBottom: '32px' }}>
          <RevenueForecast transactions={allTransactions || []} />
        </div>

        {/* Week-over-Week Comparison */}
        <div style={{ marginBottom: '32px' }}>
          <WeekComparison transactions={allTransactions || []} />
        </div>

        {/* Activity Section */}
        <div style={{ marginBottom: '32px' }}>
          <RevenueActivityTable activity={activityRes || []} />
        </div>

        {/* Quick Stats */}
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
          <Link href="/admin/transactions" className="stat-card" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-header">
              <h3 className="stat-title">Total Deposits</h3>
              <div className="stat-icon">
                <DollarSign />
              </div>
            </div>
            <div className="stat-value">₦{totalDepositAmount.toLocaleString()}</div>
            <p className="stat-trend positive">{successTransactions.filter((tx) => tx.category === 'WALLET_FUND').length} successful deposits</p>
          </Link>

          <Link href="/admin/transactions" className="stat-card" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-header">
              <h3 className="stat-title">Total Purchases</h3>
              <div className="stat-icon">
                <TrendingUp />
              </div>
            </div>
            <div className="stat-value">{successTransactions.filter((tx) => tx.category !== 'WALLET_FUND').length}</div>
            <p className="stat-trend positive">Data, airtime, cable transactions</p>
          </Link>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-secondary) 100%)', color: 'white' }}>
            <div className="stat-header">
              <h3 className="stat-title" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>System Earnings</h3>
              <div className="stat-icon" style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}>
                <Zap />
              </div>
            </div>
            <div className="stat-value" style={{ color: 'white' }}>₦{(revenueData.depositFeeRevenue + revenueData.markupRevenue).toLocaleString()}</div>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginTop: '8px' }}>Fees + Markups combined</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Active Users</h3>
              <div className="stat-icon">
                <Users />
              </div>
            </div>
            <div className="stat-value">{userCount.toLocaleString()}</div>
            <p className="stat-trend positive">Growing community</p>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[v0] Admin Dashboard Error:', error)
    return (
      <div className="admin-page">
        <div className="empty-state" style={{ padding: '80px 20px' }}>
          <h3>Error loading dashboard</h3>
          <p>Failed to fetch dashboard data. Please refresh or try again later.</p>
          <button onClick={() => window.location.reload()} className="btn" style={{ marginTop: '20px' }}>
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}
