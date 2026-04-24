'use client'

/**
 * Extract network name from service_id
 */
export function getNetworkName(serviceId: string): string {
  const networkMap: Record<string, string> = {
    'mtn': 'MTN',
    'glo': 'Glo',
    'airtel': 'Airtel',
    'etisalat': '9mobile',
    '9mobile': '9mobile',
  }
  
  const lower = serviceId.toLowerCase()
  for (const [key, value] of Object.entries(networkMap)) {
    if (lower.includes(key)) {
      return value
    }
  }
  return 'MTN'
}

/**
 * Extract provider name from service_id (for cable)
 */
export function getCableProviderName(serviceId: string): string {
  const lower = serviceId.toLowerCase()
  if (lower.includes('dstv')) return 'DStv'
  if (lower.includes('gotv')) return 'GOtv'
  if (lower.includes('startimes')) return 'Startimes'
  return 'Cable'
}

/**
 * Extract DISCO name from service_id (for electricity)
 */
export function getDISCOName(serviceId: string): string {
  const discoMap: Record<string, string> = {
    'ikeja': 'Ikeja Electric',
    'eko': 'Eko Electric',
    'abuja': 'Abuja Electric',
    'kano': 'Kano Electric',
    'portharcourt': 'Port Harcourt Electric',
    'jos': 'Jos Electric',
    'ibadan': 'Ibadan Electric',
    'kaduna': 'Kaduna Electric',
    'enugu': 'Enugu Electric',
    'benin': 'Benin Electric',
    'aba': 'Aba Electric',
    'yola': 'Yola Electric',
  }
  
  const lower = serviceId.toLowerCase()
  for (const [key, value] of Object.entries(discoMap)) {
    if (lower.includes(key)) {
      return value
    }
  }
  return 'Electricity'
}

/**
 * Extract electricity token from api_response
 * Tries multiple possible field names
 */
export function extractElectricityToken(apiResponse: any): string | null {
  if (!apiResponse) return null
  
  if (typeof apiResponse === 'string') {
    try {
      apiResponse = JSON.parse(apiResponse)
    } catch {
      return null
    }
  }
  
  // Try multiple field names
  const tokenPaths = [
    apiResponse.token,
    apiResponse.Token,
    apiResponse.generated_token,
    apiResponse.mainToken,
    apiResponse.purchasedToken,
    apiResponse.data?.token,
    apiResponse.api_response?.token,
  ]
  
  for (const token of tokenPaths) {
    if (token && typeof token === 'string') {
      return token
    }
  }
  
  return null
}

/**
 * Format date for receipt display
 */
export function formatReceiptDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format time for receipt display
 */
export function formatReceiptTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Extract plan details from description
 * Description format: "MTN Data · 2GB 30 days" or "DStv Starter"
 */
export function extractPlanDetails(description: string | undefined | null): string {
  if (!description) return 'Plan'
  
  // For data and cable: format is "Network Service · Plan Details"
  // e.g., "MTN Data · 2GB 30 days" or "DStv Starter Plan"
  if (description.includes('·')) {
    const parts = description.split('·')
    return parts[1]?.trim() || 'Plan'
  }
  
  // For cable/electricity: format might be "Provider Package"
  // e.g., "DStv Starter" or "GOtv Max"
  return description.trim()
}

/**
 * Format amount with naira sign
 */
export function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString()}`
}
