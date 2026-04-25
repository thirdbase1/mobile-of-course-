/**
 * SECURITY: Gsubz API Security Layer
 * Protects against injection attacks, rate limiting, and unauthorized access
 */

import { isValidPhone, isValidAmount, isValidUUID } from '@/lib/utils/input-validation'
import { checkRateLimit, RATE_LIMIT_CONFIG, getRateLimitIdentifier } from '@/lib/utils/rate-limit'
import { logAPIRequest } from '@/lib/utils/api-tracking'

export interface GsubzSecurityContext {
  userId: string
  ipAddress: string
  request: Request
  endpoint: string
}

/**
 * Validate Gsubz data purchase request
 * SECURITY: Comprehensive input validation to prevent injection attacks
 */
export async function validateGsubzDataRequest(
  serviceID: string,
  plan: string,
  phone: string,
  amount: number,
  context: GsubzSecurityContext
): Promise<{ valid: boolean; error?: string }> {
  // Validate service ID (must be known network)
  const validServices = ['1', '2', '3', '4'] // MTN, Glo, Airtel, 9mobile
  if (!validServices.includes(serviceID)) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid service ID',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Invalid service ID' }
  }

  // Validate phone number (must be valid Nigerian format)
  if (!isValidPhone(phone)) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid phone number format',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Invalid phone number' }
  }

  // Validate amount
  if (!isValidAmount(amount) || amount <= 0) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid amount',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Invalid amount' }
  }

  // Validate plan format (prevent injection)
  if (!plan || typeof plan !== 'string' || plan.length > 100) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid plan format',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Invalid plan' }
  }

  return { valid: true }
}

/**
 * Check rate limit for Gsubz data endpoint
 */
export async function checkGsubzRateLimit(
  request: Request,
  endpoint: 'data' | 'airtime' | 'cable'
): Promise<{ allowed: boolean; error?: string }> {
  const key = getRateLimitIdentifier(request)
  
  let config
  switch (endpoint) {
    case 'data':
      config = RATE_LIMIT_CONFIG.GSUBZ_DATA
      break
    case 'airtime':
      config = RATE_LIMIT_CONFIG.GSUBZ_AIRTIME
      break
    case 'cable':
      config = RATE_LIMIT_CONFIG.GSUBZ_CABLE
      break
  }

  const { allowed } = await checkRateLimit(key, config)
  
  if (!allowed) {
    return { allowed: false, error: 'Rate limit exceeded. Please try again later.' }
  }

  return { allowed: true }
}

/**
 * Validate Gsubz airtime request
 */
export async function validateGsubzAirtimeRequest(
  serviceID: string,
  phone: string,
  amount: number,
  context: GsubzSecurityContext
): Promise<{ valid: boolean; error?: string }> {
  // Validate service ID
  const validServices = ['1', '2', '3', '4'] // MTN, Glo, Airtel, 9mobile
  if (!validServices.includes(serviceID)) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid service ID for airtime',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Invalid network' }
  }

  // Validate phone
  if (!isValidPhone(phone)) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid phone for airtime',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Invalid phone number' }
  }

  // Validate amount (airtime min 50, max 50,000)
  if (!isValidAmount(amount) || amount < 50 || amount > 50000) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid airtime amount',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Airtime amount must be between 50 and 50,000' }
  }

  return { valid: true }
}

/**
 * Validate Gsubz cable request
 */
export async function validateGsubzCableRequest(
  serviceID: string,
  smartCardNumber: string,
  plan: string,
  amount: number,
  context: GsubzSecurityContext
): Promise<{ valid: boolean; error?: string }> {
  // Validate cable provider ID
  const validServices = ['5', '6', '7', '8', '9'] // DStv, GOtv, Startimes, etc
  if (!validServices.includes(serviceID)) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid cable provider ID',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Invalid cable provider' }
  }

  // Validate smart card number (must be 10-20 digits)
  if (!/^\d{10,20}$/.test(smartCardNumber)) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid smart card number format',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Invalid smart card number' }
  }

  // Validate plan
  if (!plan || typeof plan !== 'string' || plan.length > 100) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid cable plan',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Invalid plan' }
  }

  // Validate amount
  if (!isValidAmount(amount) || amount <= 0) {
    await logAPIRequest({
      endpoint: context.endpoint,
      method: 'POST',
      statusCode: 400,
      ipAddress: context.ipAddress,
      userId: context.userId,
      errorMessage: 'Invalid cable amount',
      suspiciousFlag: true,
    })
    return { valid: false, error: 'Invalid amount' }
  }

  return { valid: true }
}

/**
 * Sanitize Gsubz response before returning to client
 * Removes sensitive data
 */
export function sanitizeGsubzResponse(response: any) {
  // Remove sensitive fields from Gsubz API response
  const sanitized = { ...response }
  
  // Don't expose internal IDs, timestamps of failures, etc
  delete sanitized.internalId
  delete sanitized.debugInfo
  delete sanitized.serverTimestamp
  
  return sanitized
}
