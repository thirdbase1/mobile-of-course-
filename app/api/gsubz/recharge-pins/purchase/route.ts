'use server'

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMIT_CONFIG, getRateLimitIdentifier } from '@/lib/utils/rate-limit'
import { generateRechargePins } from '@/lib/actions/recharge-pins'

/**
 * Rate-limited API endpoint for recharge pins generation
 * Limit: 5 requests per minute per IP
 */
export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = getRateLimitIdentifier(request)
    
    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(ip, {
      interval: 60000,
      maxRequests: 5,
      keyPrefix: 'rl:api:recharge:pins'
    })

    if (!allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Maximum 5 per minute. Please wait before trying again.',
          remaining: 0
        },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Parse JSON body
    const body = await request.json()

    // Call server action
    const result = await generateRechargePins({
      network: body.network,
      value: body.value,
      number: body.number
    })

    return NextResponse.json(
      { ...result, remaining },
      { status: result.success ? 200 : 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
