'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Transaction {
  category: string
  amount: number
  status: string
  created_at: string
}

export function CategoryPerformance({ transactions = [] }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    const categories: Record<string, { revenue: number; count: number; transactions: Transaction[] }> = {
      DATA: { revenue: 0, count: 0, transactions: [] },
      AIRTIME: { revenue: 0, count: 0, transactions: [] },
      CABLE: { revenue: 0, count: 0, transactions: [] },
      'WALLET_FUND': { revenue: 0, count: 0, transactions: [] },
    }

    transactions.forEach((tx) => {
      if (tx.status === 'SUCCESS' && categories[tx.category]) {
        const category = categories[tx.category]
        category.count += 1
        category.transactions.push(tx)
        
        if (tx.category === 'WALLET_FUND') {
          category.revenue += 50 // Deposit fee
        } else {
          category.revenue += tx.amount * 0.1 // Markup
        }
      }
    })

    return Object.entries(categories)
      .map(([name, { revenue, count }]) => ({
        name,
        revenue: Math.round(revenue),
        count,
        avg: count > 0 ? Math.round(revenue / count) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [transactions])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-text)', margin: 0, marginBottom: '12px' }}>
          Category Performance
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: 0 }}>Revenue breakdown by service category</p>
      </div>

      {/* Chart */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', padding: '20px', border: '1px solid var(--admin-border)' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
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
            <Bar dataKey="count" fill="#8b5cf6" name="Transactions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {data.map((category) => (
          <div
            key={category.name}
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--admin-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', margin: 0, fontWeight: '600' }}>
              {category.name}
            </p>
            <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-secondary)', margin: 0 }}>
              ₦{category.revenue.toLocaleString()}
            </p>
            <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{category.count} txs</span>
              <span>Avg: ₦{category.avg.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
