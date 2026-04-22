import { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRevenueData, getRevenueActivity } from '@/lib/actions/revenue'
import { StatCard } from '@/components/admin/stat-card'
import { RevenueOverview } from '@/components/admin/revenue-overview'
import { RevenueBreakdown } from '@/components/admin/revenue-breakdown'
import { RevenueActivityTable } from '@/components/admin/revenue-activity-table'
import { Users, DollarSign, TrendingUp, Zap, Settings, BarChart3, Activity } from 'lucide-react'

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
      <div className="min-h-screen w-full bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Mozosubz Admin</h1>
                <p className="text-xs text-slate-600">Dashboard & Controls</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/users" className="p-2 hover:bg-slate-100 rounded-lg transition">
                <Users className="w-5 h-5 text-slate-600" />
              </Link>
              <Link href="/admin/settings" className="p-2 hover:bg-slate-100 rounded-lg transition">
                <Settings className="w-5 h-5 text-slate-600" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Revenue Dashboard
            </h2>
            <p className="text-slate-600 mt-2">Real-time overview of system performance and earnings</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-600">All-Time Revenue</h3>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">₦{revenueData.allTime.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-2">Total system earnings</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-600">Deposit Fees</h3>
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">₦{revenueData.depositFeeRevenue.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-2">{((revenueData.depositFeeRevenue / revenueData.allTime) * 100 || 0).toFixed(1)}% of total</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-600">Markup Revenue</h3>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">₦{revenueData.markupRevenue.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-2">{((revenueData.markupRevenue / revenueData.allTime) * 100 || 0).toFixed(1)}% of total</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-600">Active Users</h3>
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{userCount.toLocaleString()}</div>
              <p className="text-xs text-slate-600 mt-2">{successTransactions.length} successful transactions</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 w-full">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Revenue Trend
              </h3>
              <RevenueOverview transactions={allTransactions || []} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Breakdown</h3>
              <RevenueBreakdown depositFee={revenueData.depositFeeRevenue} markup={revenueData.markupRevenue} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
            <Link href="/admin/transactions" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition group">
              <p className="text-sm text-slate-600 mb-2">Total Deposits</p>
              <p className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition">₦{totalDepositAmount.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-3">{successTransactions.filter((tx) => tx.category === 'WALLET_FUND').length} successful deposits</p>
            </Link>

            <Link href="/admin/transactions" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition group">
              <p className="text-sm text-slate-600 mb-2">Total Purchases</p>
              <p className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition">{successTransactions.filter((tx) => tx.category !== 'WALLET_FUND').length}</p>
              <p className="text-xs text-slate-500 mt-3">Data, airtime, cable transactions</p>
            </Link>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <p className="text-sm text-blue-100 mb-2">System Earnings</p>
              <p className="text-3xl font-bold">₦{(revenueData.depositFeeRevenue + revenueData.markupRevenue).toLocaleString()}</p>
              <p className="text-xs text-blue-100 mt-3">Fees + Markups combined</p>
            </div>
          </div>

          {/* Activity Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
            <RevenueActivityTable activity={activityRes || []} />
          </div>

          {/* Admin Navigation */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <Link href="/admin/users" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-lg transition text-center group">
              <Users className="w-6 h-6 text-slate-600 mx-auto mb-2 group-hover:text-blue-600 transition" />
              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition">Manage Users</p>
              <p className="text-xs text-slate-600">View & manage user accounts</p>
            </Link>

            <Link href="/admin/transactions" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-lg transition text-center group">
              <Activity className="w-6 h-6 text-slate-600 mx-auto mb-2 group-hover:text-blue-600 transition" />
              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition">Transactions</p>
              <p className="text-xs text-slate-600">View all transactions</p>
            </Link>

            <Link href="/admin/deposit-rules" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-lg transition text-center group">
              <DollarSign className="w-6 h-6 text-slate-600 mx-auto mb-2 group-hover:text-blue-600 transition" />
              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition">Deposit Rules</p>
              <p className="text-xs text-slate-600">Configure fee & markup rules</p>
            </Link>

            <Link href="/admin/monitoring" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-lg transition text-center group">
              <BarChart3 className="w-6 h-6 text-slate-600 mx-auto mb-2 group-hover:text-blue-600 transition" />
              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition">Monitoring</p>
              <p className="text-xs text-slate-600">System health & status</p>
            </Link>
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('[v0] Admin Dashboard Error:', error)
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Mozosubz Admin</h1>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold">Error loading dashboard</p>
            <p className="text-red-600 text-sm mt-2">Failed to fetch dashboard data. Please refresh or try again later.</p>
          </div>
        </main>
      </div>
    )
  }
}
