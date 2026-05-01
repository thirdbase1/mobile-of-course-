'use client'

import { useState, useMemo } from 'react'
import { type RevenueActivity } from '@/lib/actions/revenue'
import { Search, Filter, Download, TrendingUp } from 'lucide-react'

interface RevenueActivityTableProps {
  activity: RevenueActivity[]
}

export function RevenueActivityTable({ activity = [] }: RevenueActivityTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'deposit_fee' | 'markup'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = activity

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType)
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      if (sortBy === 'date') {
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
      } else {
        aValue = a.amount
        bValue = b.amount
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
    })

    return filtered
  }, [activity, searchTerm, filterType, sortBy, sortOrder])

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalAmount: filteredData.reduce((sum, item) => sum + item.amount, 0),
      totalCount: filteredData.length,
      avgAmount: filteredData.length > 0 ? filteredData.reduce((sum, item) => sum + item.amount, 0) / filteredData.length : 0,
      depositFeeTotal: filteredData.filter(i => i.type === 'deposit_fee').reduce((sum, i) => sum + i.amount, 0),
      markupTotal: filteredData.filter(i => i.type === 'markup').reduce((sum, i) => sum + i.amount, 0),
    }
  }, [filteredData])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with search and filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-text)', margin: 0 }}>Recent Activity</h2>
            <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0' }}>Latest earnings from deposits and purchases</p>
          </div>
          <button style={{
            background: 'var(--admin-secondary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}>
            <Download size={16} />
            Export
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--admin-bg)',
            border: '1px solid var(--admin-border)',
            borderRadius: '8px',
            padding: '10px 12px',
            gap: '8px',
          }}>
            <Search size={16} style={{ color: 'var(--admin-text-secondary)' }} />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--admin-text)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as any)
              setCurrentPage(1)
            }}
            style={{
              background: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: '8px',
              color: 'var(--admin-text)',
              padding: '10px 12px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Types</option>
            <option value="deposit_fee">Deposit Fees</option>
            <option value="markup">Markup</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              background: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: '8px',
              color: 'var(--admin-text)',
              padding: '10px 12px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            style={{
              background: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: '8px',
              color: 'var(--admin-text)',
              padding: '10px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {sortOrder === 'desc' ? '↓' : '↑'} {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </button>
        </div>

        {/* Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', margin: 0, fontWeight: '600' }}>Total</p>
            <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--admin-success)', margin: 0 }}>
              ₦{stats.totalAmount.toLocaleString()}
            </p>
          </div>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', margin: 0, fontWeight: '600' }}>Avg Amount</p>
            <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--admin-secondary)', margin: 0 }}>
              ₦{stats.avgAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', margin: 0, fontWeight: '600' }}>Count</p>
            <p style={{ fontSize: '16px', fontWeight: '700', color: '#a78bfa', margin: 0 }}>
              {stats.totalCount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {filteredData.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <TrendingUp size={48} style={{ opacity: '0.5', marginBottom: '16px', color: 'var(--admin-text-secondary)' }} />
            <p style={{ color: 'var(--admin-text-secondary)', margin: '0 0 12px 0' }}>No revenue activity found</p>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-tertiary)', margin: 0 }}>Try adjusting your filters or search</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => setSortBy('date')}>Type</th>
                  <th>Description</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => setSortBy('amount')}>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`badge ${item.type === 'deposit_fee' ? 'badge-info' : 'badge-warning'}`}>
                        {item.type === 'deposit_fee' ? 'Deposit Fee' : 'Markup'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--admin-text)', fontSize: '14px' }}>{item.description}</td>
                    <td style={{ fontWeight: '600', color: 'var(--admin-success)' }}>
                      +₦{item.amount.toLocaleString()}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--admin-border)', flexWrap: 'wrap', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: 0 }}>
                  Page {currentPage} of {totalPages} · Showing {paginatedData.length} of {filteredData.length}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    style={{
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '6px',
                      color: 'var(--admin-text)',
                      padding: '6px 12px',
                      fontSize: '13px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    style={{
                      background: 'var(--admin-secondary)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      padding: '6px 12px',
                      fontSize: '13px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
