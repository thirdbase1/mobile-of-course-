'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllEndpointHealth, getEndpointStats } from '@/lib/actions/monitoring'
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
  'Airtime': number
  'Data': number
  'Cable': number
  'Monnify': number
}

// All Gsubz service endpoints to monitor
const GSUBZ_SERVICES: Array<{ service: string; type: 'DATA' | 'CABLE' }> = [
  // DATA Plans
  { service: 'mtn_sme', type: 'DATA' },
  { service: 'mtn_datashare', type: 'DATA' },
  { service: 'mtn_gifting', type: 'DATA' },
  { service: 'mtn_awoof', type: 'DATA' },
  { service: 'glo_data', type: 'DATA' },
  { service: 'glo_sme', type: 'DATA' },
  { service: 'airtel_sme', type: 'DATA' },
  { service: 'airtel_gifting', type: 'DATA' },
  { service: 'etisalat_data', type: 'DATA' },
  // CABLE Plans
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

            // Determine status based on response validity and plans count
            // If we got plans and they have actual data, it's ONLINE
            let status: 'ONLINE' | 'SLOW' | 'DOWN' = 'ONLINE'
            const hasPlans = data.plans && Array.isArray(data.plans) && data.plans.length > 0
            
            // Check for errors in response
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
          'Airtime': endpointData.find((e) => e.name === 'Airtime Purchase')?.responseTime || 0,
          'Data': endpointData.find((e) => e.name === 'Data Purchase')?.responseTime || 0,
          'Cable': endpointData.find((e) => e.name === 'Cable Subscription')?.responseTime || 0,
          'Monnify': endpointData.find((e) => e.name === 'Monnify Webhook')?.responseTime || 0,
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
    avgResponse: Math.round(gsubzEndpoints.reduce((sum, e) => sum + e.responseTime, 0) / gsubzEndpoints.length),
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <CheckCircle className="text-emerald-500" size={20} />
      case 'SLOW':
        return <Clock className="text-amber-500" size={20} />
      case 'DOWN':
        return <AlertCircle className="text-red-500" size={20} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">API Health Monitor</h1>
          <p className="text-slate-400">Real-time monitoring of system endpoints</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 bg-slate-800 p-2 rounded-lg border border-slate-700 w-fit">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'internal'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Internal Endpoints
          </button>
          <button
            onClick={() => setActiveTab('gsubz')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'gsubz'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Gsubz Services
          </button>
        </div>

        {/* Stats Cards */}
        {activeTab === 'internal' && stats && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Endpoints</div>
              <div className="text-4xl font-bold text-slate-50">{stats.totalEndpoints}</div>
            </div>
            <div className="bg-emerald-900/20 rounded-lg p-6 border border-emerald-500/30">
              <div className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">Online</div>
              <div className="text-4xl font-bold text-emerald-400">{stats.onlineCount}</div>
            </div>
            <div className="bg-amber-900/20 rounded-lg p-6 border border-amber-500/30">
              <div className="text-amber-400 text-sm font-semibold uppercase tracking-wider mb-2">Slow</div>
              <div className="text-4xl font-bold text-amber-400">{stats.slowCount}</div>
            </div>
            <div className="bg-red-900/20 rounded-lg p-6 border border-red-500/30">
              <div className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-2">Down</div>
              <div className="text-4xl font-bold text-red-400">{stats.downCount}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Avg Response</div>
              <div className="text-4xl font-bold text-slate-50">{stats.avgResponseTime}ms</div>
            </div>
          </div>
        )}

        {/* Gsubz Stats Cards */}
        {activeTab === 'gsubz' && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Services</div>
              <div className="text-4xl font-bold text-slate-50">{gsubzStats.total}</div>
            </div>
            <div className="bg-emerald-900/20 rounded-lg p-6 border border-emerald-500/30">
              <div className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">Online</div>
              <div className="text-4xl font-bold text-emerald-400">{gsubzStats.online}</div>
            </div>
            <div className="bg-amber-900/20 rounded-lg p-6 border border-amber-500/30">
              <div className="text-amber-400 text-sm font-semibold uppercase tracking-wider mb-2">Slow</div>
              <div className="text-4xl font-bold text-amber-400">{gsubzStats.slow}</div>
            </div>
            <div className="bg-red-900/20 rounded-lg p-6 border border-red-500/30">
              <div className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-2">Down</div>
              <div className="text-4xl font-bold text-red-400">{gsubzStats.down}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Avg Response</div>
              <div className="text-4xl font-bold text-slate-50">{gsubzStats.avgResponse}ms</div>
            </div>
          </div>
        )}

        {performanceData.length > 1 && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-8">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Response Time Trend (Last 20 Checks)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                  formatter={(value) => `${value}ms`}
                />
                <Legend />
                <Line type="monotone" dataKey="Airtime" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Data" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Cable" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Monnify" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-slate-50">
              {activeTab === 'internal' ? 'Endpoint Status' : 'Gsubz Service Plans'}
            </h3>
          </div>
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading endpoint data...</div>
          ) : activeTab === 'internal' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/50 border-b border-slate-700">
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Endpoint Name</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Path</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Method</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Status</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Response (ms)</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Last Checked</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Uptime</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEndpoints.map((endpoint, idx) => (
                    <tr
                      key={endpoint.path}
                      onClick={() => setSelectedEndpoint(endpoint)}
                      className={`border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors ${
                        idx % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-800'
                      }`}
                    >
                      <td className="p-4 font-semibold text-slate-200">{endpoint.name}</td>
                      <td className="p-4 font-mono text-sm text-slate-400">{endpoint.path}</td>
                      <td className="p-4">
                        <span className="bg-slate-700 px-2 py-1 rounded text-xs font-semibold text-slate-300">
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(endpoint.status)}
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              endpoint.status === 'ONLINE'
                                ? 'bg-emerald-900/40 text-emerald-300'
                                : endpoint.status === 'SLOW'
                                ? 'bg-amber-900/40 text-amber-300'
                                : 'bg-red-900/40 text-red-300'
                            }`}
                          >
                            {endpoint.status}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`p-4 font-semibold font-mono ${
                          endpoint.responseTime > 2000
                            ? 'text-red-400'
                            : endpoint.responseTime > 800
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {endpoint.responseTime}ms
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {new Date(endpoint.lastChecked).toLocaleTimeString()}
                      </td>
                      <td className="p-4 font-semibold text-slate-200">{endpoint.uptime.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/50 border-b border-slate-700">
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Service</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Type</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Plans Available</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Status</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Response (ms)</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Last Checked</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGsubz.map((gsubz, idx) => (
                    <tr
                      key={gsubz.service}
                      className={`border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${
                        idx % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-800'
                      }`}
                    >
                      <td className="p-4 font-semibold text-slate-200">{gsubz.service}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          gsubz.type === 'DATA'
                            ? 'bg-blue-900/40 text-blue-300'
                            : 'bg-purple-900/40 text-purple-300'
                        }`}>
                          {gsubz.type}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-200">{gsubz.plansCount}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(gsubz.status)}
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              gsubz.status === 'ONLINE'
                                ? 'bg-emerald-900/40 text-emerald-300'
                                : gsubz.status === 'SLOW'
                                ? 'bg-amber-900/40 text-amber-300'
                                : 'bg-red-900/40 text-red-300'
                            }`}
                          >
                            {gsubz.status}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`p-4 font-semibold font-mono ${
                          gsubz.responseTime > 2000
                            ? 'text-red-400'
                            : gsubz.responseTime > 800
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {gsubz.responseTime}ms
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {new Date(gsubz.lastChecked).toLocaleTimeString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedGsubz(gsubz)}
                          className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors"
                        >
                          View Plans
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedEndpoint && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedEndpoint(null)}
          >
            <div
              className="bg-slate-800 rounded-lg p-6 max-w-md w-full shadow-xl border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-slate-50 mb-4">{selectedEndpoint.name}</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="font-semibold text-slate-400">Path:</span>
                  <code className="text-sm font-mono text-slate-300">{selectedEndpoint.path}</code>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="font-semibold text-slate-400">Method:</span>
                  <span className="font-semibold text-slate-200">{selectedEndpoint.method}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="font-semibold text-slate-400">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      selectedEndpoint.status === 'ONLINE'
                        ? 'bg-emerald-900/40 text-emerald-300'
                        : selectedEndpoint.status === 'SLOW'
                        ? 'bg-amber-900/40 text-amber-300'
                        : 'bg-red-900/40 text-red-300'
                    }`}
                  >
                    {selectedEndpoint.status}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="font-semibold text-slate-400">Response Time:</span>
                  <span className="font-mono font-semibold text-slate-200">{selectedEndpoint.responseTime}ms</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="font-semibold text-slate-400">Last Checked:</span>
                  <span className="text-sm text-slate-300">{new Date(selectedEndpoint.lastChecked).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="font-semibold text-slate-400">Uptime:</span>
                  <span className="font-semibold text-slate-200">{selectedEndpoint.uptime.toFixed(1)}%</span>
                </div>
                {selectedEndpoint.errorMessage && (
                  <div className="border-t border-slate-700 pt-2 mt-2">
                    <span className="font-semibold text-slate-400 block mb-1">Error:</span>
                    <span className="text-red-400 text-sm">{selectedEndpoint.errorMessage}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedEndpoint(null)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {selectedGsubz && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedGsubz(null)}
          >
            <div
              className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full shadow-xl border border-slate-700 max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-slate-50 mb-4">{selectedGsubz.service} - {selectedGsubz.type}</h2>

              <div className="mb-4 p-4 bg-slate-700 rounded-lg">
                <p className="text-slate-300"><strong>Status:</strong> <span className={selectedGsubz.status === 'ONLINE' ? 'text-emerald-400' : selectedGsubz.status === 'SLOW' ? 'text-amber-400' : 'text-red-400'}>{selectedGsubz.status}</span></p>
                <p className="text-slate-300"><strong>Response Time:</strong> {selectedGsubz.responseTime}ms</p>
                <p className="text-slate-300"><strong>Total Plans:</strong> {selectedGsubz.plansCount}</p>
              </div>

              {selectedGsubz.plans && selectedGsubz.plans.length > 0 ? (
                <div>
                  <h3 className="font-semibold text-slate-200 mb-3">Available Plans:</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedGsubz.plans.map((plan, idx) => (
                      <div key={idx} className="p-3 bg-slate-700/50 rounded border border-slate-600 flex justify-between">
                        <span className="text-slate-300">{plan.displayName}</span>
                        <span className="font-semibold text-emerald-400">₦{plan.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic">No plans available</p>
              )}

              <button
                onClick={() => setSelectedGsubz(null)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg font-semibold transition-colors mt-4"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
