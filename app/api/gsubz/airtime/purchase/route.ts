'use server'

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMIT_CONFIG, getRateLimitIdentifier } from '@/lib/utils/rate-limit'
import { purchaseAirtime } from '@/lib/actions/airtime'

/**
 * Rate-limited API endpoint for airtime purchases
 * Strict limit: 5 requests per minute per IP
 */
export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = getRateLimitIdentifier(request)
    
    // Check rate limit (5 per minute for airtime purchases)
    const { allowed, remaining } = await checkRateLimit(ip, {
      interval: 60000,
      maxRequests: 5,
      keyPrefix: 'rl:api:airtime:purchase'
    })

    if (!allowed) {
      console.error(`[v0] Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many airtime purchase requests. Maximum 5 per minute. Please wait before trying again.',
          remaining: 0
        },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Parse form data
    const formData = await request.formData()

    // Call server action
    const result = await purchaseAirtime(formData)

    return NextResponse.json(
      { ...result, remaining },
      { status: result.success ? 200 : 400 }
    )
  } catch (error) {
    console.error('[v0] Airtime purchase endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
