'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, AlertCircle } from 'lucide-react'

interface Transaction {
  category: string
  amount: number
  status: string
  created_at: string
}

export function RevenueForecast({ transactions = [] }: { transactions: Transaction[] }) {
  const forecastData = useMemo(() => {
    // Get last 14 days
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (13 - i))
      return date.toISOString().split('T')[0]
    })

    const dailyRevenue: Record<string, number> = {}

    last14Days.forEach((date) => {
      dailyRevenue[date] = 0
    })

    transactions.forEach((tx) => {
      if (tx.status === 'SUCCESS') {
        const txDate = tx.created_at?.split('T')[0]
        if (dailyRevenue.hasOwnProperty(txDate)) {
          if (tx.category === 'WALLET_FUND') {
            dailyRevenue[txDate] += 50
          } else {
            dailyRevenue[txDate] += tx.amount * 0.1
          }
        }
      }
    })

    const chartData = last14Days.map((date) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: dailyRevenue[date],
    }))

    // Calculate simple forecast (using average trend)
    const avgRevenue = Object.values(dailyRevenue).reduce((a, b) => a + b, 0) / 14
    const trend = (Object.values(dailyRevenue)[13] - Object.values(dailyRevenue)[0]) / 14

    // Add forecast for next 7 days
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + i)
      const forecastValue = Math.max(0, avgRevenue + trend * i)

      chartData.push({
        date: futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        forecast: Math.round(forecastValue),
        actual: null,
      })
    }

    return { chartData, avgRevenue, trend }
  }, [transactions])

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
          fontSize: '12px',
        }}>
          <p style={{ margin: 0, fontWeight: '600' }}>{data.date}</p>
          {data.actual !== null && (
            <p style={{ margin: '4px 0 0 0', color: 'var(--admin-secondary)' }}>
              Actual: ₦{Math.round(data.actual).toLocaleString()}
            </p>
          )}
          {data.forecast !== null && (
            <p style={{ margin: '4px 0 0 0', color: 'var(--admin-success)', opacity: 0.7 }}>
              Forecast: ₦{data.forecast.toLocaleString()}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} />
            Revenue Forecast
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0' }}>14-day historical with 7-day forecast</p>
        </div>
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: 'var(--admin-success)',
          fontWeight: '600',
        }}>
          {forecastData.trend > 0 ? '↑' : '↓'} {Math.abs(forecastData.trend).toFixed(0)}₦ daily avg
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', padding: '20px', border: '1px solid var(--admin-border)' }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecastData.chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
            <XAxis dataKey="date" stroke="var(--admin-text-secondary)" />
            <YAxis stroke="var(--admin-text-secondary)" />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              x={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              stroke="var(--admin-danger)"
              strokeDasharray="5 5"
              label={{ value: 'Today', position: 'top', fill: 'var(--admin-danger)', fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="Actual Revenue"
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#10b981', r: 4 }}
              name="Forecast"
            />
          </LineChart>
        </ResponsiveContainer>
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
        <AlertCircle size={20} style={{ color: 'var(--admin-info)', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--admin-secondary)', margin: '0 0 4px 0' }}>Forecast Insight</p>
          <p style={{ fontSize: '13px', color: 'var(--admin-text)', margin: 0, lineHeight: '1.5' }}>
            {forecastData.trend > 0
              ? `Revenue is trending upward. Expected average ₦${Math.round(forecastData.avgRevenue).toLocaleString()}/day. Monitor deposit volume for sustainability.`
              : `Revenue shows downward trend. Focus on marketing and user retention strategies.`}
          </p>
        </div>
      </div>
    </div>
  )
}
