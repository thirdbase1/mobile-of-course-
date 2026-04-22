'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

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

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Revenue Mix</h2>
        <p className="text-sm text-slate-500 mt-1">All-time breakdown</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-slate-600">{item.name}</span>
            <span className="font-semibold text-slate-900">₦{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
