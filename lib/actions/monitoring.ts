'use server'

const API_ENDPOINTS = [
  // Authentication Endpoints
  { name: 'Check Username', path: '/api/auth/check-username', method: 'POST' },
  { name: 'Sign Out', path: '/api/auth/signout', method: 'POST' },

  // VTU Service Endpoints
  { name: 'Airtime Purchase', path: '/api/airtime', method: 'POST' },
  { name: 'Data Purchase', path: '/api/data', method: 'POST' },
  { name: 'Cable Subscription', path: '/api/cable', method: 'POST' },
  { name: 'Electricity Bill', path: '/api/electricity', method: 'POST' },
  { name: 'Recharge Pins', path: '/api/recharge-pins', method: 'POST' },

  // Wallet & Payment Endpoints
  { name: 'Wallet Fund Start', path: '/api/deposit/start', method: 'POST' },
  { name: 'Monnify Init Payment', path: '/api/monnify/init-payment', method: 'POST' },
  { name: 'Monnify Init Transaction', path: '/api/monnify/init-transaction', method: 'POST' },
  { name: 'Monnify Webhook', path: '/api/monnify/webhook', method: 'POST' },

  // Checkout Endpoints
  { name: 'Checkout Query', path: '/api/checkout/query', method: 'POST' },
  { name: 'Checkout Verify', path: '/api/checkout/verify', method: 'POST' },

  // Admin Endpoints
  { name: 'Promote User to Admin', path: '/api/admin/promote-user', method: 'POST' },

  // Debug Endpoints
  { name: 'Monnify Debug', path: '/api/debug/monnify-credentials', method: 'GET' },
  { name: 'Auth Test', path: '/api/debug/test-monnify-auth', method: 'GET' },
]

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

// Store checks in memory with a simple cache
let checksCache: EndpointCheck[] = []
let lastCheckTime = 0

export async function checkEndpointHealth(path: string, method: string = 'GET'): Promise<{ responseTime: number; success: boolean; error?: string }> {
  const startTime = Date.now()
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    }).finally(() => clearTimeout(timeout))
    
    const responseTime = Date.now() - startTime
    const success = response.ok || response.status === 400 || response.status === 401 || response.status === 404
    
    return { responseTime, success, error: success ? undefined : `Status ${response.status}` }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return { 
      responseTime, 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

export async function getAllEndpointHealth(): Promise<EndpointCheck[]> {
  const now = Date.now()
  
  // Return cached data if fresh (less than 30 seconds old)
  if (checksCache.length > 0 && now - lastCheckTime < 30000) {
    return checksCache
  }
  
  // Perform all checks
  const checks = await Promise.all(
    API_ENDPOINTS.map(async (endpoint) => {
      const { responseTime, success, error } = await checkEndpointHealth(endpoint.path, endpoint.method)
      
      // Determine status - endpoint is down only if it doesn't respond
      let status: 'ONLINE' | 'SLOW' | 'DOWN' = 'ONLINE'
      if (!success && responseTime > 5000) {
        status = 'DOWN'
      } else if (!success) {
        status = 'DOWN'
      } else if (responseTime > 2000) {
        status = 'SLOW'
      }
      
      return {
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        status,
        responseTime: Math.max(1, responseTime),
        lastChecked: new Date().toISOString(),
        uptime: status === 'ONLINE' ? 99.9 : status === 'SLOW' ? 95.0 : 50.0,
        failureCount: status === 'DOWN' ? 1 : 0,
        errorMessage: error,
      }
    })
  )
  
  checksCache = checks
  lastCheckTime = now
  
  return checks
}

export async function getEndpointStats() {
  const checks = await getAllEndpointHealth()
  
  return {
    totalEndpoints: checks.length,
    onlineCount: checks.filter((c) => c.status === 'ONLINE').length,
    slowCount: checks.filter((c) => c.status === 'SLOW').length,
    downCount: checks.filter((c) => c.status === 'DOWN').length,
    avgResponseTime: Math.round(checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length || 0),
  }
}
