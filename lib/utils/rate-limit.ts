/**
 * SECURITY: Rate Limiting using Upstash Redis
 * Prevents brute force attacks, DoS attacks, and API abuse
 * Distributed across multiple instances using Upstash Redis
 */

import { Redis } from "@upstash/redis"

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per interval
  keyPrefix: string // Redis key prefix
}

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

/**
 * Check if request exceeds rate limit using Upstash Redis
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `${config.keyPrefix}:${identifier}`
  const now = Date.now()
  const intervalSeconds = Math.ceil(config.interval / 1000)

  try {
    // Use INCR and EXPIRE with Redis
    const count = await redis.incr(key)

    // Set expiration on first request
    if (count === 1) {
      await redis.expire(key, intervalSeconds)
    }

    const ttl = await redis.ttl(key)
    const resetAt = now + (ttl > 0 ? ttl * 1000 : config.interval)

    const allowed = count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - count)

    return {
      allowed,
      remaining,
      resetAt,
    }
  } catch (error) {
    // If Redis fails, allow the request but log the error
    console.error("[v0] Rate limit Redis error:", error)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.interval,
    }
  }
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMIT_CONFIG = {
  // API endpoint protection
  API_GENERAL: { interval: 60000, maxRequests: 100, keyPrefix: "rl:api:general" },

  // Authentication endpoints (strict)
  AUTH_LOGIN: { interval: 60000, maxRequests: 5, keyPrefix: "rl:auth:login" },
  AUTH_REGISTER: { interval: 3600000, maxRequests: 3, keyPrefix: "rl:auth:register" },

  // Transaction endpoints (medium)
  TRANSACTION_BUY: { interval: 60000, maxRequests: 30, keyPrefix: "rl:tx:buy" },
  TRANSACTION_VERIFY: { interval: 60000, maxRequests: 50, keyPrefix: "rl:tx:verify" },

  // Payment endpoints (very strict - 8 each)
  PAYMENT_INITIATE: { interval: 60000, maxRequests: 8, keyPrefix: "rl:payment:init" },
  PAYMENT_VERIFY: { interval: 60000, maxRequests: 8, keyPrefix: "rl:payment:verify" },

  // Admin endpoints (very strict)
  ADMIN_ACTION: { interval: 60000, maxRequests: 20, keyPrefix: "rl:admin:action" },

  // Email verification (prevent spam)
  EMAIL_SEND: { interval: 3600000, maxRequests: 5, keyPrefix: "rl:email:send" },

  // Public endpoints
  PUBLIC_PLANS: { interval: 60000, maxRequests: 1000, keyPrefix: "rl:public:plans" },

  // Gsubz API protection (all 8 per minute)
  GSUBZ_DATA_PURCHASE: { interval: 60000, maxRequests: 8, keyPrefix: "rl:gsubz:data:purchase" },
  GSUBZ_DATA_FETCH: { interval: 60000, maxRequests: 8, keyPrefix: "rl:gsubz:data:fetch" },
  GSUBZ_AIRTIME_PURCHASE: { interval: 60000, maxRequests: 8, keyPrefix: "rl:gsubz:airtime:purchase" },
  GSUBZ_CABLE_SUBSCRIBE: { interval: 60000, maxRequests: 8, keyPrefix: "rl:gsubz:cable:subscribe" },
  GSUBZ_CABLE_FETCH: { interval: 60000, maxRequests: 8, keyPrefix: "rl:gsubz:cable:fetch" },
  GSUBZ_CABLE_VERIFY: { interval: 60000, maxRequests: 8, keyPrefix: "rl:gsubz:cable:verify" },
  GSUBZ_ELECTRICITY: { interval: 60000, maxRequests: 8, keyPrefix: "rl:gsubz:electricity" },
  GSUBZ_PIN_PRINT: { interval: 60000, maxRequests: 8, keyPrefix: "rl:gsubz:pin:print" },
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
