'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Transaction {
  id: string
  user_id: string
  amount: number
  status: string
  category: string
  created_at: string
}

interface RevenueChartProps {
  transactions: Transaction[]
}

export function RevenueChart({ transactions = [] }: RevenueChartProps) {
  const chartData = useMemo(() => {
    // Get last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    // Initialize data for each day
    const dailyData = last7Days.map((dateStr) => {
      const date = new Date(dateStr)
      const monthDay = `${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate()}`

      return {
        date: monthDay,
        deposits: 0,
        spending: 0,
        profit: 0,
      }
    })

    // Process transactions - use actual schema with category field
    if (transactions && transactions.length > 0) {
      transactions.forEach((tx) => {
        const txDate = tx.created_at?.split('T')[0]
        const dayIndex = last7Days.indexOf(txDate)

        if (dayIndex >= 0 && tx.status === 'SUCCESS') {
          const amount = tx.amount || 0
          // Use category field with WALLET_FUND for deposits
          if (tx.category === 'WALLET_FUND') {
            dailyData[dayIndex].deposits += amount
          } else {
            // All other categories are spending
            dailyData[dayIndex].spending += amount
          }
          dailyData[dayIndex].profit = dailyData[dayIndex].deposits - dailyData[dayIndex].spending
        }
      })
    }

    return dailyData
  }, [transactions])

  return (
    <div className="chart-card">
      <h2 className="chart-title">Revenue Overview (7 Days)</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="deposits" stroke="#3b82f6" strokeWidth={2} name="Deposits" />
          <Line type="monotone" dataKey="spending" stroke="#ef4444" strokeWidth={2} name="Spending" />
          <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
