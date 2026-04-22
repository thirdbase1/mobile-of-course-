'use server'

import { NextRequest, NextResponse } from 'next/server'
import { initializePayment } from '@/lib/actions/monnify'

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: result.error || 'Failed to initialize payment' },
        { status: 400 }
      )
    }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
