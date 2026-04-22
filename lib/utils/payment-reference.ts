/**
 * Generate a unique payment reference
 * Format: MOZO_<userId8>_<timestamp>_<rand>
 * Example: MOZO_badbd027_1711903456789_x7k2
 * 
 * This format is:
 * - Unique (timestamp + random)
 * - Traceable (includes user ID)
 * - Production-ready
 * - URL-safe
 */
export function generatePaymentReference(userId: string): string {
  // Extract first 8 characters of userId
  const userIdShort = userId.substring(0, 8)
  
  // Get current timestamp in milliseconds
  const timestamp = Date.now()
  
  // Generate random string (4 chars)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let rand = ''
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return `MOZO_${userIdShort}_${timestamp}_${rand}`
}

/**
 * Parse a payment reference to extract components
 */
export function parsePaymentReference(paymentRef: string) {
  const parts = paymentRef.split('_')
  if (parts.length !== 4 || parts[0] !== 'MOZO') {
    return null
  }
  
  return {
    prefix: parts[0],
    userIdShort: parts[1],
    timestamp: parseInt(parts[2], 10),
    rand: parts[3],
  }
}

/**
 * Validate payment reference format
 */
export function isValidPaymentReference(paymentRef: string): boolean {
  const parsed = parsePaymentReference(paymentRef)
  if (!parsed) return false
  
  // Check if timestamp is reasonable (not in future, not too old)
  const now = Date.now()
  const ageMs = now - parsed.timestamp
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  return ageMs >= 0 && ageMs < maxAge
}
