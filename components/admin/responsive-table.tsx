'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface TableColumn {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  sortable?: boolean
  width?: string
  hideMobile?: boolean
}

interface ResponsiveTableProps {
  columns: TableColumn[]
  data: any[]
  rowKey?: string
  onRowClick?: (row: any) => void
  loading?: boolean
  emptyMessage?: string
  expandableRow?: (row: any) => React.ReactNode
}

export function ResponsiveTable({
  columns,
  data,
  rowKey = 'id',
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  expandableRow,
}: ResponsiveTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [expandedRow, setExpandedRow] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768)

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        Loading data...
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
        {emptyMessage}
      </div>
    )
  }

  const visibleColumns = isMobile ? columns.filter((col) => !col.hideMobile) : columns

  // Desktop table view
  if (!isMobile) {
    return (
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  style={{ cursor: col.sortable ? 'pointer' : 'default', width: col.width }}
                  onClick={() => {
                    if (col.sortable) {
                      setSortConfig(
                        sortConfig?.key === col.key && sortConfig.direction === 'asc'
                          ? { key: col.key, direction: 'desc' }
                          : { key: col.key, direction: 'asc' },
                      )
                    }
                  }}
                >
                  {col.label}
                  {sortConfig?.key === col.key && (
                    <span style={{ marginLeft: '8px' }}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
              {expandableRow && <th style={{ width: '40px' }} />}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <React.Fragment key={row[rowKey]}>
                <tr
                  onClick={() => {
                    if (onRowClick) onRowClick(row)
                    if (expandableRow) setExpandedRow(expandedRow === row[rowKey] ? null : row[rowKey])
                  }}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {visibleColumns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                  {expandableRow && (
                    <td>
                      {expandedRow === row[rowKey] && (
                        <ChevronDown size={16} style={{ transform: 'rotate(180deg)' }} />
                      )}
                    </td>
                  )}
                </tr>
                {expandableRow && expandedRow === row[rowKey] && (
                  <tr>
                    <td colSpan={visibleColumns.length + (expandableRow ? 1 : 0)} style={{ padding: '0' }}>
                      <div style={{ background: 'rgba(14, 165, 233, 0.05)', padding: '20px', borderTop: '1px solid var(--admin-border)' }}>
                        {expandableRow(row)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Mobile card view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((row) => (
        <div
          key={row[rowKey]}
          className="stat-card"
          onClick={() => {
            if (onRowClick) onRowClick(row)
            if (expandableRow) setExpandedRow(expandedRow === row[rowKey] ? null : row[rowKey])
          }}
          style={{ cursor: onRowClick ? 'pointer' : 'default', padding: '16px' }}
        >
          {visibleColumns.map((col, idx) => (
            <div key={col.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: idx < visibleColumns.length - 1 ? '12px' : '0' }}>
              <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                {col.label}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--admin-text)', fontWeight: '600', textAlign: 'right' }}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
              </span>
            </div>
          ))}
          {expandableRow && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--admin-border)' }}>
              {expandedRow === row[rowKey] && expandableRow(row)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
