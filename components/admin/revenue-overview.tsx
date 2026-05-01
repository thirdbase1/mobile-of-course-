'use client'

import { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'

interface Transaction {
  id: string
  category: string
  amount: number
  status: string
  created_at: string
}

export function RevenueOverview({ transactions = [] }: { transactions: Transaction[] }) {
  const chartData = useMemo(() => {
    // Get last 30 days for better trending
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })

    const dailyData = last30Days.map((dateStr) => {
      const date = new Date(dateStr)
      const monthDay = `${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate()}`

      return {
        date: monthDay,
        dateStr,
        depositFees: 0,
        markupEarnings: 0,
        transactionCount: 0,
        avgTransactionValue: 0,
        total: 0,
      }
    })

    const BASE_DEPOSIT_FEE = 50

    if (transactions && transactions.length > 0) {
      transactions.forEach((tx) => {
        if (tx.status !== 'SUCCESS') return

        const txDate = tx.created_at?.split('T')[0]
        const dayIndex = last30Days.indexOf(txDate)

        if (dayIndex >= 0) {
          if (tx.category === 'WALLET_FUND') {
            dailyData[dayIndex].depositFees += BASE_DEPOSIT_FEE
          } else if (['AIRTIME', 'DATA', 'CABLE'].includes(tx.category)) {
            dailyData[dayIndex].markupEarnings += tx.amount * 0.1
          }
          dailyData[dayIndex].transactionCount += 1
          dailyData[dayIndex].total = dailyData[dayIndex].depositFees + dailyData[dayIndex].markupEarnings
        }
      })
    }

    return dailyData
  }, [transactions])

  // Calculate trend indicators
  const trend = useMemo(() => {
    const mid = Math.floor(chartData.length / 2)
    const firstHalf = chartData.slice(0, mid).reduce((sum, d) => sum + d.total, 0)
    const secondHalf = chartData.slice(mid).reduce((sum, d) => sum + d.total, 0)
    const change = ((secondHalf - firstHalf) / (firstHalf || 1)) * 100

    return {
      trend: change > 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(1),
      isPositive: change > 0,
    }
  }, [chartData])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="update-badge" style={{ gap: '12px', padding: '12px', background: 'var(--admin-bg-secondary)', border: '1px solid var(--admin-border)' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', margin: 0 }}>{payload[0].payload.date}</p>
            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--admin-text)', margin: '4px 0 0 0' }}>
              ₦{(payload[0].value + payload[1].value).toLocaleString()}
            </p>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
            <p style={{ margin: '4px 0' }}>Fees: ₦{payload[0].value.toLocaleString()}</p>
            <p style={{ margin: '4px 0' }}>Markup: ₦{payload[1].value.toLocaleString()}</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with trend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--admin-border)' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-text)', margin: 0 }}>Revenue Trend (30 Days)</h2>
          <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0' }}>Deposit fees vs Markup earnings with growth indicators</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: trend.isPositive ? 'var(--admin-success)' : 'var(--admin-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {trend.isPositive ? '↑' : '↓'} {trend.percentage}%
          </span>
        </div>
      </div>

      {/* Main Chart */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', padding: '20px', border: '1px solid var(--admin-border)' }}>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <defs>
              <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorMarkup" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--admin-text-tertiary)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="var(--admin-text-tertiary)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Area 
              type="monotone" 
              dataKey="depositFees" 
              fill="url(#colorFees)" 
              stroke="#3b82f6"
              strokeWidth={2}
              name="Deposit Fees"
            />
            <Area 
              type="monotone" 
              dataKey="markupEarnings" 
              fill="url(#colorMarkup)" 
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Markup Earnings"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', padding: '16px', border: '1px solid var(--admin-border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Daily Revenue</p>
          <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--admin-text)', margin: '8px 0 0 0' }}>
            ₦{(chartData.reduce((sum, d) => sum + d.total, 0) / chartData.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', padding: '16px', border: '1px solid var(--admin-border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Peak Day</p>
          <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--admin-secondary)', margin: '8px 0 0 0' }}>
            ₦{Math.max(...chartData.map(d => d.total)).toLocaleString()}
          </p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', padding: '16px', border: '1px solid var(--admin-border)' }}>
          <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Period</p>
          <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--admin-success)', margin: '8px 0 0 0' }}>
            ₦{chartData.reduce((sum, d) => sum + d.total, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
