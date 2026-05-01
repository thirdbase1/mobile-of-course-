'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllEndpointHealth, getEndpointStats } from '@/lib/actions/monitoring'
import { RefreshCw, AlertCircle, CheckCircle, Clock, X, Activity, Zap } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface EndpointCheck {
  name: string
  path: string
  method: string
  status: 'ONLINE' | 'SLOW' | 'DOWN'
  responseTime: number
  lastChecked: string
  uptime: number
  failureCount: number
  errorMessage?: string
}

interface GsubzEndpoint {
  service: string
  type: 'DATA' | 'CABLE'
  plansCount: number
  status: 'ONLINE' | 'SLOW' | 'DOWN'
  responseTime: number
  lastChecked: string
  plans?: Array<{ displayName: string; price: string }>
}

interface Stats {
  totalEndpoints: number
  onlineCount: number
  slowCount: number
  downCount: number
  avgResponseTime: number
}

interface PerformanceData {
  time: string
  Airtime: number
  Data: number
  Cable: number
  Monnify: number
}

const GSUBZ_SERVICES: Array<{ service: string; type: 'DATA' | 'CABLE' }> = [
  { service: 'mtn_sme', type: 'DATA' },
  { service: 'mtn_datashare', type: 'DATA' },
  { service: 'mtn_gifting', type: 'DATA' },
  { service: 'mtn_awoof', type: 'DATA' },
  { service: 'glo_data', type: 'DATA' },
  { service: 'glo_sme', type: 'DATA' },
  { service: 'airtel_sme', type: 'DATA' },
  { service: 'airtel_gifting', type: 'DATA' },
  { service: 'etisalat_data', type: 'DATA' },
  { service: 'dstv', type: 'CABLE' },
  { service: 'gotv', type: 'CABLE' },
  { service: 'startimes', type: 'CABLE' },
]

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<'internal' | 'gsubz'>('internal')
  const [endpoints, setEndpoints] = useState<EndpointCheck[]>([])
  const [gsubzEndpoints, setGsubzEndpoints] = useState<GsubzEndpoint[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointCheck | null>(null)
  const [selectedGsubz, setSelectedGsubz] = useState<GsubzEndpoint | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'ONLINE' | 'SLOW' | 'DOWN'>('all')
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])

  const loadGsubzData = useCallback(async () => {
    try {
      const results = await Promise.all(
        GSUBZ_SERVICES.map(async ({ service, type }) => {
          const start = performance.now()
          try {
            const response = await fetch(`/api/gsubz/plans?service=${service}&type=${type}`, {
              headers: { 'Content-Type': 'application/json' },
            })
            const responseTime = performance.now() - start
            const data = await response.json()

            let status: 'ONLINE' | 'SLOW' | 'DOWN' = 'ONLINE'
            const hasPlans = data.plans && Array.isArray(data.plans) && data.plans.length > 0

            if (data.error || !hasPlans) {
              status = 'DOWN'
            } else if (responseTime > 2000) {
              status = 'SLOW'
            }

            const plansCount = data.plans?.length || 0

            return {
              service,
              type,
              plansCount,
              status,
              responseTime: Math.round(responseTime),
              lastChecked: new Date().toISOString(),
              plans: data.plans || [],
            }
          } catch (error) {
            console.error(`Error fetching ${service}:`, error)
            return {
              service,
              type,
              plansCount: 0,
              status: 'DOWN' as const,
              responseTime: 5000,
              lastChecked: new Date().toISOString(),
              plans: [],
            }
          }
        })
      )

      setGsubzEndpoints(results)
    } catch (error) {
      console.error('Error loading gsubz data:', error)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [endpointData, statsData] = await Promise.all([
        getAllEndpointHealth(),
        getEndpointStats(),
      ])

      setEndpoints(endpointData)
      setStats(statsData)

      const time = new Date().toLocaleTimeString()
      setPerformanceData((prev) => [
        ...prev.slice(-19),
        {
          time,
          Airtime: endpointData.find((e) => e.name === 'Airtime Purchase')?.responseTime || 0,
          Data: endpointData.find((e) => e.name === 'Data Purchase')?.responseTime || 0,
          Cable: endpointData.find((e) => e.name === 'Cable Subscription')?.responseTime || 0,
          Monnify: endpointData.find((e) => e.name === 'Monnify Webhook')?.responseTime || 0,
        },
      ])
    } catch (error) {
      console.error('Error loading monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'internal') {
      loadData()
    } else {
      loadGsubzData()
    }
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (activeTab === 'internal') {
        loadData()
      } else {
        loadGsubzData()
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [autoRefresh, loadData, loadGsubzData, activeTab])

  const filteredEndpoints = endpoints.filter((e) => statusFilter === 'all' || e.status === statusFilter)
  const filteredGsubz = gsubzEndpoints.filter((e) => statusFilter === 'all' || e.status === statusFilter)

  const gsubzStats = {
    total: gsubzEndpoints.length,
    online: gsubzEndpoints.filter((e) => e.status === 'ONLINE').length,
    slow: gsubzEndpoints.filter((e) => e.status === 'SLOW').length,
    down: gsubzEndpoints.filter((e) => e.status === 'DOWN').length,
    avgResponse: gsubzEndpoints.length
      ? Math.round(gsubzEndpoints.reduce((sum, e) => sum + e.responseTime, 0) / gsubzEndpoints.length)
      : 0,
  }

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'ONLINE' ? 'badge badge-success' : status === 'SLOW' ? 'badge badge-warning' : 'badge badge-danger'
    const Icon = status === 'ONLINE' ? CheckCircle : status === 'SLOW' ? Clock : AlertCircle
    return (
      <span className={cls}>
        <Icon size={11} />
        {status}
      </span>
    )
  }

  const responseTimeColor = (rt: number) =>
    rt > 2000 ? 'var(--admin-danger)' : rt > 800 ? 'var(--admin-warning)' : 'var(--admin-success)'

  const currentStats =
    activeTab === 'internal'
      ? {
          total: stats?.totalEndpoints || 0,
          online: stats?.onlineCount || 0,
          slow: stats?.slowCount || 0,
          down: stats?.downCount || 0,
          avgResponse: stats?.avgResponseTime || 0,
        }
      : gsubzStats

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-row">
          <div>
            <h1>API Health Monitor</h1>
            <p>Real-time monitoring of system endpoints</p>
          </div>
          <div className="admin-header-actions">
            <button
              className={`btn ${autoRefresh ? 'btn-success' : 'btn-secondary'} btn-sm`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              type="button"
            >
              <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
              <span>{autoRefresh ? 'Auto-refresh on' : 'Paused'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'internal' ? 'active' : ''}`}
          onClick={() => setActiveTab('internal')}
          type="button"
        >
          <Activity size={14} />
          <span>Internal</span>
        </button>
        <button
          className={`admin-tab ${activeTab === 'gsubz' ? 'active' : ''}`}
          onClick={() => setActiveTab('gsubz')}
          type="button"
        >
          <Zap size={14} />
          <span>Gsubz Services</span>
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Total</h3>
            <div className="stat-icon">
              <Activity size={18} />
            </div>
          </div>
          <div className="stat-value">{currentStats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Online</h3>
            <div className="stat-icon stat-icon-success">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="stat-value text-success">{currentStats.online}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Slow</h3>
            <div className="stat-icon stat-icon-warning">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value text-warning">{currentStats.slow}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Down</h3>
            <div className="stat-icon stat-icon-danger">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="stat-value text-danger">{currentStats.down}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <h3 className="stat-title">Avg Response</h3>
            <div className="stat-icon">
              <Zap size={18} />
            </div>
          </div>
          <div className="stat-value">{currentStats.avgResponse}ms</div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="filter-chips">
        {(['all', 'ONLINE', 'SLOW', 'DOWN'] as const).map((s) => (
          <button
            key={s}
            className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
            type="button"
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Performance chart */}
      {activeTab === 'internal' && performanceData.length > 1 && (
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Response Time Trend</h3>
              <p className="chart-subtitle">Last 20 checks</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a3d" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#131c2e',
                  border: '1px solid #1f2a3d',
                  borderRadius: 8,
                  color: '#f1f5f9',
                }}
                formatter={(value) => `${value}ms`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Airtime" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Data" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Cable" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Monnify" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Endpoint list */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <span>Loading endpoint data...</span>
        </div>
      ) : activeTab === 'internal' ? (
        <div className="table-container">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Path</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Response</th>
                  <th>Last Checked</th>
                  <th>Uptime</th>
                </tr>
              </thead>
              <tbody>
                {filteredEndpoints.map((endpoint) => (
                  <tr
                    key={endpoint.path}
                    onClick={() => setSelectedEndpoint(endpoint)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600 }}>{endpoint.name}</td>
                    <td className="text-mono" style={{ fontSize: 12, color: 'var(--admin-text-tertiary)' }}>
                      {endpoint.path}
                    </td>
                    <td>
                      <span className="badge badge-info">{endpoint.method}</span>
                    </td>
                    <td>{getStatusBadge(endpoint.status)}</td>
                    <td
                      className="text-mono"
                      style={{ fontWeight: 600, color: responseTimeColor(endpoint.responseTime) }}
                    >
                      {endpoint.responseTime}ms
                    </td>
                    <td style={{ color: 'var(--admin-text-tertiary)', fontSize: 12 }}>
                      {new Date(endpoint.lastChecked).toLocaleTimeString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>{endpoint.uptime.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="data-list" style={{ padding: 12 }}>
            {filteredEndpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="data-card"
                onClick={() => setSelectedEndpoint(endpoint)}
                style={{ cursor: 'pointer' }}
              >
                <div className="data-card-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="data-card-title">{endpoint.name}</h3>
                    <p className="data-card-subtitle text-mono" style={{ fontSize: 11 }}>
                      {endpoint.method} {endpoint.path}
                    </p>
                  </div>
                  {getStatusBadge(endpoint.status)}
                </div>
                <div className="data-card-grid">
                  <div className="data-card-field">
                    <span className="data-card-label">Response</span>
                    <span
                      className="data-card-value mono"
                      style={{ color: responseTimeColor(endpoint.responseTime), fontWeight: 700 }}
                    >
                      {endpoint.responseTime}ms
                    </span>
                  </div>
                  <div className="data-card-field">
                    <span className="data-card-label">Uptime</span>
                    <span className="data-card-value">{endpoint.uptime.toFixed(1)}%</span>
                  </div>
                  <div className="data-card-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="data-card-label">Last checked</span>
                    <span className="data-card-value">
                      {new Date(endpoint.lastChecked).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Plans</th>
                  <th>Status</th>
                  <th>Response</th>
                  <th>Last Checked</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredGsubz.map((gsubz) => (
                  <tr key={gsubz.service}>
                    <td style={{ fontWeight: 600 }}>{gsubz.service}</td>
                    <td>
                      <span className={`badge ${gsubz.type === 'DATA' ? 'badge-info' : 'badge-category'}`}>
                        {gsubz.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{gsubz.plansCount}</td>
                    <td>{getStatusBadge(gsubz.status)}</td>
                    <td
                      className="text-mono"
                      style={{ fontWeight: 600, color: responseTimeColor(gsubz.responseTime) }}
                    >
                      {gsubz.responseTime}ms
                    </td>
                    <td style={{ color: 'var(--admin-text-tertiary)', fontSize: 12 }}>
                      {new Date(gsubz.lastChecked).toLocaleTimeString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedGsubz(gsubz)}
                        type="button"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="data-list" style={{ padding: 12 }}>
            {filteredGsubz.map((gsubz) => (
              <div
                key={gsubz.service}
                className="data-card"
                onClick={() => setSelectedGsubz(gsubz)}
                style={{ cursor: 'pointer' }}
              >
                <div className="data-card-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="data-card-title">{gsubz.service}</h3>
                    <p className="data-card-subtitle">
                      <span className={`badge ${gsubz.type === 'DATA' ? 'badge-info' : 'badge-category'}`}>
                        {gsubz.type}
                      </span>
                    </p>
                  </div>
                  {getStatusBadge(gsubz.status)}
                </div>
                <div className="data-card-grid">
                  <div className="data-card-field">
                    <span className="data-card-label">Plans</span>
                    <span className="data-card-value" style={{ fontWeight: 700 }}>
                      {gsubz.plansCount}
                    </span>
                  </div>
                  <div className="data-card-field">
                    <span className="data-card-label">Response</span>
                    <span
                      className="data-card-value mono"
                      style={{ color: responseTimeColor(gsubz.responseTime), fontWeight: 700 }}
                    >
                      {gsubz.responseTime}ms
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Endpoint Modal */}
      {selectedEndpoint && (
        <div className="modal-overlay" onClick={() => setSelectedEndpoint(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEndpoint.name}</h2>
              <button className="modal-close" onClick={() => setSelectedEndpoint(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item full-width">
                  <label>Path</label>
                  <p className="text-mono" style={{ fontSize: 13 }}>{selectedEndpoint.path}</p>
                </div>
                <div className="detail-item">
                  <label>Method</label>
                  <p>{selectedEndpoint.method}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p>{getStatusBadge(selectedEndpoint.status)}</p>
                </div>
                <div className="detail-item">
                  <label>Response Time</label>
                  <p
                    className="text-mono"
                    style={{ color: responseTimeColor(selectedEndpoint.responseTime), fontWeight: 700 }}
                  >
                    {selectedEndpoint.responseTime}ms
                  </p>
                </div>
                <div className="detail-item">
                  <label>Uptime</label>
                  <p style={{ fontWeight: 700 }}>{selectedEndpoint.uptime.toFixed(1)}%</p>
                </div>
                <div className="detail-item full-width">
                  <label>Last Checked</label>
                  <p>{new Date(selectedEndpoint.lastChecked).toLocaleString()}</p>
                </div>
                {selectedEndpoint.errorMessage && (
                  <div className="detail-item full-width">
                    <label>Error</label>
                    <p style={{ color: 'var(--admin-danger)' }}>{selectedEndpoint.errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setSelectedEndpoint(null)} type="button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gsubz Modal */}
      {selectedGsubz && (
        <div className="modal-overlay" onClick={() => setSelectedGsubz(null)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedGsubz.service} — {selectedGsubz.type}
              </h2>
              <button className="modal-close" onClick={() => setSelectedGsubz(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid" style={{ marginBottom: 16 }}>
                <div className="detail-item">
                  <label>Status</label>
                  <p>{getStatusBadge(selectedGsubz.status)}</p>
                </div>
                <div className="detail-item">
                  <label>Response Time</label>
                  <p className="text-mono" style={{ color: responseTimeColor(selectedGsubz.responseTime), fontWeight: 700 }}>
                    {selectedGsubz.responseTime}ms
                  </p>
                </div>
                <div className="detail-item">
                  <label>Total Plans</label>
                  <p style={{ fontWeight: 700 }}>{selectedGsubz.plansCount}</p>
                </div>
              </div>

              {selectedGsubz.plans && selectedGsubz.plans.length > 0 ? (
                <>
                  <h3 className="section-title">Available Plans</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                    {selectedGsubz.plans.map((plan, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 10,
                          background: 'var(--admin-bg-tertiary)',
                          border: '1px solid var(--admin-border)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>{plan.displayName}</span>
                        <span style={{ fontWeight: 700, color: 'var(--admin-success)' }}>₦{plan.price}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--admin-text-tertiary)', fontStyle: 'italic' }}>No plans available</p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setSelectedGsubz(null)} type="button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
