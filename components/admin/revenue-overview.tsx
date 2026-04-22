'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Transaction {
  id: string
  category: string
  amount: number
  status: string
  created_at: string
}

export function RevenueOverview({ transactions = [] }: { transactions: Transaction[] }) {
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
        depositFees: 0,
        markupEarnings: 0,
        total: 0,
      }
    })

    // Simplified deposit fee calculation (₦50 base per successful deposit)
    const BASE_DEPOSIT_FEE = 50

    if (transactions && transactions.length > 0) {
      transactions.forEach((tx) => {
        if (tx.status !== 'SUCCESS') return

        const txDate = tx.created_at?.split('T')[0]
        const dayIndex = last7Days.indexOf(txDate)

        if (dayIndex >= 0) {
          if (tx.category === 'WALLET_FUND') {
            // Deposit fee revenue
            dailyData[dayIndex].depositFees += BASE_DEPOSIT_FEE
          } else if (['AIRTIME', 'DATA', 'CABLE'].includes(tx.category)) {
            // Markup revenue (simplified 10% markup)
            dailyData[dayIndex].markupEarnings += tx.amount * 0.1
          }
          dailyData[dayIndex].total = dailyData[dayIndex].depositFees + dailyData[dayIndex].markupEarnings
        }
      })
    }

    return dailyData
  }, [transactions])

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Revenue Breakdown (7 Days)</h2>
        <p className="text-sm text-slate-500 mt-1">Deposit fees vs Markup earnings</p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
          <Legend />
          <Bar dataKey="depositFees" fill="#3b82f6" name="Deposit Fees" />
          <Bar dataKey="markupEarnings" fill="#8b5cf6" name="Markup Earnings" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
