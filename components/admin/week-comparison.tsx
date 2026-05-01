'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { Calendar, TrendingUp } from 'lucide-react'

interface Transaction {
  category: string
  amount: number
  status: string
  created_at: string
}

export function WeekComparison({ transactions = [] }: { transactions: Transaction[] }) {
  const comparisonData = useMemo(() => {
    const today = new Date()
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())
    
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(thisWeekStart.getDate() - 7)

    const thisWeekEnd = new Date(thisWeekStart)
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6)

    const calculateWeekRevenue = (startDate: Date, endDate: Date) => {
      let revenue = 0
      let count = 0

      transactions.forEach((tx) => {
        if (tx.status === 'SUCCESS') {
          const txDate = new Date(tx.created_at)
          if (txDate >= startDate && txDate <= endDate) {
            if (tx.category === 'WALLET_FUND') {
              revenue += 50
            } else {
              revenue += tx.amount * 0.1
            }
            count += 1
          }
        }
      })

      return { revenue, count }
    }

    const thisWeek = calculateWeekRevenue(thisWeekStart, thisWeekEnd)
    const lastWeek = calculateWeekRevenue(lastWeekStart, new Date(lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))

    const change = lastWeek.revenue > 0 ? ((thisWeek.revenue - lastWeek.revenue) / lastWeek.revenue) * 100 : 0
    const isGrowth = change > 0

    return [
      {
        name: 'Last Week',
        revenue: Math.round(lastWeek.revenue),
        transactions: lastWeek.count,
        avg: lastWeek.count > 0 ? Math.round(lastWeek.revenue / lastWeek.count) : 0,
      },
      {
        name: 'This Week',
        revenue: Math.round(thisWeek.revenue),
        transactions: thisWeek.count,
        avg: thisWeek.count > 0 ? Math.round(thisWeek.revenue / thisWeek.count) : 0,
      },
    ]
  }, [transactions])

  const change = comparisonData[1].revenue > comparisonData[0].revenue
  const changePercent = comparisonData[0].revenue > 0 
    ? ((comparisonData[1].revenue - comparisonData[0].revenue) / comparisonData[0].revenue * 100).toFixed(1)
    : 0

  const COLORS = ['var(--admin-text-tertiary)', 'var(--admin-secondary)']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} />
            Week-over-Week
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0' }}>Compare current and previous week performance</p>
        </div>
        <div style={{
          background: change ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: change ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '13px',
          color: change ? 'var(--admin-success)' : 'var(--admin-danger)',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          {change ? '📈' : '📉'} {Math.abs(parseFloat(changePercent as string)).toFixed(1)}%
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', padding: '20px', border: '1px solid var(--admin-border)' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
            <XAxis dataKey="name" stroke="var(--admin-text-secondary)" />
            <YAxis stroke="var(--admin-text-secondary)" />
            <Tooltip
              contentStyle={{
                background: 'var(--admin-bg-secondary)',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'var(--admin-text)' }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
            <Bar dataKey="transactions" fill="#8b5cf6" name="Transactions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {comparisonData.map((week, idx) => (
          <div
            key={idx}
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${idx === 1 ? 'var(--admin-secondary)' : 'var(--admin-border)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>
              {week.name}
            </p>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-text)', margin: 0 }}>
                ₦{week.revenue.toLocaleString()}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)', margin: '4px 0 0 0' }}>
                {week.transactions} transactions
              </p>
            </div>
            <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '12px', fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Avg Transaction:</span>
                <span style={{ color: 'var(--admin-text)', fontWeight: '600' }}>₦{week.avg.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Daily Avg:</span>
                <span style={{ color: 'var(--admin-text)', fontWeight: '600' }}>₦{(week.revenue / 7).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        gap: '12px',
      }}>
        <TrendingUp size={20} style={{ color: 'var(--admin-info)', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--admin-secondary)', margin: '0 0 4px 0' }}>Performance Insight</p>
          <p style={{ fontSize: '13px', color: 'var(--admin-text)', margin: 0, lineHeight: '1.5' }}>
            {change
              ? `This week is outperforming last week by ${changePercent}%. Maintain current strategies and user engagement.`
              : `This week shows a decline. Review marketing campaigns and user retention strategies.`}
          </p>
        </div>
      </div>
    </div>
  )
}
