'use server'

import { NextRequest, NextResponse } from 'next/server'
import { initializePayment } from '@/lib/actions/monnify'
import { checkRateLimit, RATE_LIMIT_CONFIG, getRateLimitIdentifier } from '@/lib/utils/rate-limit'
import { logAPIRequest, getUserIPAddress } from '@/lib/utils/api-tracking'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ipAddress = getUserIPAddress(request)

  try {
    // SECURITY: Rate limit payment initialization (8 per minute)
    const rateLimitKey = getRateLimitIdentifier(request)
    const { allowed, remaining } = await checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG.PAYMENT_INITIATE)

    if (!allowed) {
      await logAPIRequest({
        endpoint: "/api/monnify/init-payment",
        method: "POST",
        statusCode: 429,
        duration: Date.now() - startTime,
        ipAddress,
        suspiciousFlag: true,
      })
      return NextResponse.json(
        { error: 'Too many payment requests. Please wait before initiating another payment.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { transactionReference, amount } = body

    if (!transactionReference) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      )
    }

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    console.log('[API] Initializing payment for:', transactionReference, 'Amount:', amount)

    // Call the initializePayment function
    const result = await initializePayment(transactionReference)

    if (!result.success) {
      console.error('[API] Payment initialization failed:', result.error)
      
      await logAPIRequest({
        endpoint: "/api/monnify/init-payment",
        method: "POST",
        statusCode: 400,
        duration: Date.now() - startTime,
        ipAddress,
        errorMessage: result.error,
      })

      return NextResponse.json(
        { error: result.error || 'Failed to initialize payment' },
        { status: 400 }
      )
    }

    await logAPIRequest({
      endpoint: "/api/monnify/init-payment",
      method: "POST",
      statusCode: 200,
      duration: Date.now() - startTime,
      ipAddress,
    })

    return NextResponse.json({
      accountNumber: result.accountNumber,
      accountName: result.accountName,
      bankName: result.bankName,
      bankCode: result.bankCode,
      ussdCode: result.ussdCode,
      amount,
    })
  } catch (error) {
    console.error('[API] Error:', error)

    await logAPIRequest({
      endpoint: "/api/monnify/init-payment",
      method: "POST",
      statusCode: 500,
      duration: Date.now() - startTime,
      ipAddress,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
