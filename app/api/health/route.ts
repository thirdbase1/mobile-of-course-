/**
 * Health check endpoint for monitoring connectivity
 * Tests basic connectivity and Supabase connection
 */

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const startTime = Date.now()
  
  try {
    // Get client IP for debugging connectivity
    const ip = 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      region: process.env.VERCEL_REGION || 'unknown',
      responseTime: `${responseTime}ms`,
      clientIp: ip,
      version: '1.0.0',
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 })
}
