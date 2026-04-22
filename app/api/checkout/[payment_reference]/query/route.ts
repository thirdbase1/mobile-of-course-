import { NextRequest, NextResponse } from 'next/server'
import { queryMonnifyTransaction } from '@/lib/actions/transactions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payment_reference: string }> }
) {
  try {
    const { payment_reference } = await params

    console.log('[QUERY] Verifying payment:', payment_reference)

    // Query Monnify directly for faster verification
    const result = await queryMonnifyTransaction(payment_reference)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Return the updated transaction status
    return NextResponse.json({
      success: true,
      data: {
        id: payment_reference,
        paymentReference: payment_reference,
        status: result.paymentStatus === 'PAID' ? 'SUCCESS' : 'PENDING',
      },
    })
  } catch (error) {
    console.error('[QUERY] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
