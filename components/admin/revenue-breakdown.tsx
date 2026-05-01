'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface RevenueBreakdownProps {
  depositFee: number
  markup: number
}

export function RevenueBreakdown({ depositFee, markup }: RevenueBreakdownProps) {
  const total = depositFee + markup
  
  const data = [
    { name: 'Deposit Fees', value: depositFee, percentage: ((depositFee / total) * 100).toFixed(1) },
    { name: 'Markup Earnings', value: markup, percentage: ((markup / total) * 100).toFixed(1) },
  ]

  const COLORS = ['#3b82f6', '#8b5cf6']

  // Calculate growth metrics
  const metrics = useMemo(() => {
    const avgPercentage = {
      depositFee: parseFloat(data[0].percentage),
      markup: parseFloat(data[1].percentage),
    }

    return {
      depositFeePercentage: avgPercentage.depositFee,
      markupPercentage: avgPercentage.markup,
      avgRevenuePerSource: total / 2,
    }
  }, [depositFee, markup, total, data])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div style={{
          background: 'var(--admin-bg-secondary)',
          border: '1px solid var(--admin-border)',
          borderRadius: '8px',
          padding: '12px',
          color: 'var(--admin-text)',
          fontSize: '13px',
        }}>
          <p style={{ margin: 0, fontWeight: '600' }}>{data.name}</p>
          <p style={{ margin: '4px 0 0 0', color: 'var(--admin-text-secondary)' }}>
            ₦{data.value.toLocaleString()}
          </p>
          <p style={{ margin: '4px 0 0 0', color: 'var(--admin-secondary)', fontWeight: '600' }}>
            {data.percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Pie Chart */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', padding: '20px', border: '1px solid var(--admin-border)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px', color: 'var(--admin-text)' }}>Revenue Mix</h2>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${percentage}%`}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${COLORS[idx]}33`,
            borderLeft: `4px solid ${COLORS[idx]}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {item.name}
              </h3>
              <span style={{
                fontSize: '13px',
                fontWeight: '700',
                color: COLORS[idx],
                padding: '2px 8px',
                background: `${COLORS[idx]}20`,
                borderRadius: '4px',
              }}>
                {item.percentage}%
              </span>
            </div>
            <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--admin-text)', margin: 0 }}>
              ₦{item.value.toLocaleString()}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '8px 0 0 0' }}>
              Avg per transaction: ₦{(item.value / Math.max(1, item.value / 50)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* Key Insights */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--admin-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          💡 Key Insight
        </p>
        <p style={{ fontSize: '13px', color: 'var(--admin-text)', margin: 0, lineHeight: '1.5' }}>
          {metrics.depositFeePercentage > 50
            ? `Deposit fees generate ${metrics.depositFeePercentage.toFixed(1)}% of total revenue. Consider increasing deposit limits to boost this stream.`
            : `Markup earnings are your dominant revenue stream at ${metrics.markupPercentage.toFixed(1)}%. Focus on improving service delivery and user retention.`}
        </p>
      </div>
    </div>
  )
}
