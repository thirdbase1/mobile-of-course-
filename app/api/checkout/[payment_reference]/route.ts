import { NextRequest, NextResponse } from 'next/server'
import { getTransaction, verifyAndCreditPayment } from '@/lib/actions/transactions'
import { initializePayment } from '@/lib/actions/monnify'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payment_reference: string }> }
) {
  try {
    const { payment_reference } = await params

    console.log('[CHECKOUT API] Fetching transaction:', payment_reference)

    // Get transaction from DB
    const result = await getTransaction(payment_reference)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, status: result.status },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('[CHECKOUT API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payment_reference: string }> }
) {
  try {
    const { payment_reference } = await params
    const body = await request.json()
    const { action } = body

    console.log('[CHECKOUT API] Action:', action, 'Payment Reference:', payment_reference)

    if (action === 'verify') {
      // Verify payment with Monnify and credit wallet
      const result = await verifyAndCreditPayment(payment_reference)

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        credited: result.credited,
        alreadyProcessed: result.alreadyProcessed,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[CHECKOUT API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
