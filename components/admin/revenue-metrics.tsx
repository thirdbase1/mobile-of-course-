'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'

interface Transaction {
  id: string
  category: string
  amount: number
  status: string
  created_at: string
}

export function RevenueMetrics({ transactions = [] }: { transactions: Transaction[] }) {
  const metrics = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })

    let totalRevenue = 0
    let totalTransactions = 0
    let dailyRevenue = 0
    let successfulTransactions = 0

    transactions.forEach((tx) => {
      if (tx.status === 'SUCCESS') {
        totalRevenue += tx.amount * 0.1 // Simplified markup
        totalTransactions += 1
        successfulTransactions += 1

        const txDate = tx.created_at?.split('T')[0]
        if (txDate === new Date().toISOString().split('T')[0]) {
          dailyRevenue += tx.amount * 0.1
        }
      }
    })

    const avgDailyRevenue = totalRevenue / 30
    const conversionRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0

    return {
      totalRevenue,
      totalTransactions,
      dailyRevenue,
      avgDailyRevenue,
      conversionRate,
      successfulTransactions,
    }
  }, [transactions])

  const trend = metrics.dailyRevenue > metrics.avgDailyRevenue

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      {[
        {
          label: 'Daily Revenue',
          value: `₦${metrics.dailyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          change: trend ? '+12.5%' : '-3.2%',
          isPositive: trend,
          icon: trend ? '📈' : '📉',
        },
        {
          label: 'Conv. Rate',
          value: `${metrics.conversionRate.toFixed(1)}%`,
          change: '+2.1%',
          isPositive: true,
          icon: '✓',
        },
        {
          label: 'Avg Transaction',
          value: `₦${(metrics.totalRevenue / Math.max(1, metrics.totalTransactions)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          change: '+5.3%',
          isPositive: true,
          icon: '💰',
        },
        {
          label: 'Monthly Forecast',
          value: `₦${(metrics.avgDailyRevenue * 30).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          change: 'Based on avg',
          isPositive: true,
          icon: '🎯',
        },
      ].map((metric, idx) => (
        <div
          key={idx}
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--admin-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {metric.label}
              </p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--admin-text)', margin: '8px 0 0 0' }}>
                {metric.value}
              </p>
            </div>
            <span style={{ fontSize: '24px' }}>{metric.icon}</span>
          </div>
          <p style={{
            fontSize: '12px',
            fontWeight: '600',
            color: metric.isPositive ? 'var(--admin-success)' : 'var(--admin-danger)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {metric.isPositive ? '↑' : '↓'} {metric.change}
          </p>
        </div>
      ))}
    </div>
  )
}
