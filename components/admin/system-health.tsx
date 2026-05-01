'use client'

import { Activity, AlertTriangle, CheckCircle, Clock, Server, Shield } from 'lucide-react'

export function SystemHealth() {
  const metrics = [
    {
      name: 'API Health',
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '120ms',
      icon: Server,
    },
    {
      name: 'Database',
      status: 'healthy',
      uptime: '99.95%',
      responseTime: '45ms',
      icon: Shield,
    },
    {
      name: 'Payment Gateway',
      status: 'healthy',
      uptime: '99.8%',
      responseTime: '250ms',
      icon: Activity,
    },
    {
      name: 'Cache Layer',
      status: 'healthy',
      uptime: '99.98%',
      responseTime: '5ms',
      icon: Clock,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--admin-text)', margin: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} />
          System Health
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: 0 }}>Real-time infrastructure monitoring</p>
      </div>

      {/* Health Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {metrics.map((metric) => {
          const Icon = metric.icon
          const isHealthy = metric.status === 'healthy'

          return (
            <div
              key={metric.name}
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderLeft: `4px solid ${isHealthy ? 'var(--admin-success)' : 'var(--admin-danger)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {metric.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                    {isHealthy ? (
                      <CheckCircle size={14} style={{ color: 'var(--admin-success)' }} />
                    ) : (
                      <AlertTriangle size={14} style={{ color: 'var(--admin-danger)' }} />
                    )}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: isHealthy ? 'var(--admin-success)' : 'var(--admin-danger)',
                    }}>
                      {isHealthy ? 'Healthy' : 'Warning'}
                    </span>
                  </div>
                </div>
                <Icon size={20} style={{ color: 'var(--admin-secondary)', opacity: 0.7 }} />
              </div>

              {/* Metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Uptime:</span>
                  <span style={{ color: 'var(--admin-text)', fontWeight: '600' }}>{metric.uptime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Response:</span>
                  <span style={{ color: 'var(--admin-text)', fontWeight: '600' }}>{metric.responseTime}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Global Status */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            background: 'var(--admin-success)',
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
          }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--admin-text)', margin: 0 }}>All Systems Operational</p>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', margin: '2px 0 0 0' }}>Last checked 2 minutes ago</p>
          </div>
        </div>
        <button style={{
          background: 'transparent',
          border: '1px solid var(--admin-success)',
          color: 'var(--admin-success)',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}>
          View Logs
        </button>
      </div>
    </div>
  )
}
