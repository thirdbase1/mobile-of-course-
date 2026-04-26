'use server'

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/utils/rate-limit'
import { fetchCablePlans } from '@/lib/actions/cable'

/**
 * Rate-limited API endpoint for fetching cable plans
 * Strict limit: 10 requests per minute per IP
 */
export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = getRateLimitIdentifier(request)
    
    // Check rate limit (10 per minute for plan fetches - higher since this is read-only)
    const { allowed, remaining } = await checkRateLimit(ip, {
      interval: 60000,
      maxRequests: 10,
      keyPrefix: 'rl:api:cable:plans'
    })

    if (!allowed) {
      console.error(`[v0] Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Maximum 10 per minute. Please wait before trying again.',
          remaining: 0
        },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Get provider from request
    const { provider } = await request.json()

    // Call server action
    const result = await fetchCablePlans(provider)

    return NextResponse.json(
      { ...result, remaining },
      { status: result.success ? 200 : 400 }
    )
  } catch (error) {
    console.error('[v0] Cable plans endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
