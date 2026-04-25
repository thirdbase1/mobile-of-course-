/**
 * SECURITY: Rate Limiting - Prevents brute force and DoS attacks
 * Uses in-memory cache with timestamp-based bucketing
 * In production, use Upstash Redis for distributed rate limiting
 */

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per interval
  keyPrefix: string // Redis/cache key prefix
}

// In-memory rate limit store (for single-instance deployments)
// For multi-instance, switch to Upstash Redis
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Check if request exceeds rate limit
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${config.keyPrefix}:${identifier}`
  const now = Date.now()

  let bucket = rateLimitStore.get(key)

  // Reset bucket if expired
  if (!bucket || bucket.resetAt < now) {
    bucket = {
      count: 0,
      resetAt: now + config.interval,
    }
    rateLimitStore.set(key, bucket)
  }

  const allowed = bucket.count < config.maxRequests
  const remaining = Math.max(0, config.maxRequests - bucket.count - 1)

  if (allowed) {
    bucket.count++
  }

  return {
    allowed,
    remaining,
    resetAt: bucket.resetAt,
  }
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMIT_CONFIG = {
  // API endpoint protection
  API_GENERAL: { interval: 60000, maxRequests: 100, keyPrefix: "api:general" },

  // Authentication endpoints (strict)
  AUTH_LOGIN: { interval: 60000, maxRequests: 5, keyPrefix: "auth:login" },
  AUTH_REGISTER: { interval: 3600000, maxRequests: 3, keyPrefix: "auth:register" },

  // Transaction endpoints (medium)
  TRANSACTION_BUY: { interval: 60000, maxRequests: 30, keyPrefix: "tx:buy" },
  TRANSACTION_VERIFY: { interval: 60000, maxRequests: 50, keyPrefix: "tx:verify" },

  // Payment endpoints (strict)
  PAYMENT_INITIATE: { interval: 60000, maxRequests: 10, keyPrefix: "payment:init" },
  PAYMENT_VERIFY: { interval: 60000, maxRequests: 20, keyPrefix: "payment:verify" },

  // Admin endpoints (very strict)
  ADMIN_ACTION: { interval: 60000, maxRequests: 20, keyPrefix: "admin:action" },

  // Email verification (prevent spam)
  EMAIL_SEND: { interval: 3600000, maxRequests: 5, keyPrefix: "email:send" },

  // Public endpoints
  PUBLIC_PLANS: { interval: 60000, maxRequests: 1000, keyPrefix: "public:plans" },
}

/**
 * Get user identifier for rate limiting (IP + User ID)
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  // Use X-Forwarded-For header for IP behind proxy/CDN
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"

  if (userId) {
    return `${userId}:${ip}`
  }

  return ip
}
