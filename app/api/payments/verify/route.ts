import { NextRequest, NextResponse } from 'next/server'
import { queryMonnifyTransaction } from '@/lib/actions/transactions'
import { verifyAndCreditPayment } from '@/lib/actions/transactions'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/payments/verify
 * 
 * Secure payment verification endpoint
 * User clicks "I Have Paid" → this endpoint queries Monnify API directly
 * Only credits wallet if Monnify confirms paymentStatus === 'PAID'
 * 
 * SECURITY:
 * - Verifies user owns the transaction
 * - Queries Monnify directly (no trust on client claims)
 * - Idempotent: marks transaction SUCCESS immediately to prevent double-crediting
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentReference } = await request.json()

    if (!paymentReference) {
      return NextResponse.json(
        { success: false, error: 'Payment reference required' },
        { status: 400 }
      )
    }

    console.log('[VERIFY_API] User clicked "I Have Paid" for:', paymentReference)

    // Step 1: Verify user owns this transaction
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: transaction, error: txError } = await supabase
      .from('monnify_transactions')
      .select('user_id, status, amount')
      .eq('payment_reference', paymentReference)
      .maybeSingle()

    if (txError || !transaction) {
      console.error('[VERIFY_API] Transaction not found:', paymentReference)
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Verify user owns this transaction
    if (transaction.user_id !== user.id) {
      console.error('[VERIFY_API] User mismatch - unauthorized access attempt:', {
        paymentReference,
        ownerId: transaction.user_id,
        attemptedUserId: user.id,
      })
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Step 2: Query Monnify directly to confirm payment status
    console.log('[VERIFY_API] Querying Monnify for status verification...')
    const monnifyResult = await queryMonnifyTransaction(paymentReference)

    if (!monnifyResult.success) {
      console.log('[VERIFY_API] Monnify query failed:', monnifyResult.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify with Monnify. Please try again or contact support.',
          paymentReference,
        },
        { status: 400 }
      )
    }

    // Step 3: Check if Monnify says the payment is PAID
    console.log('[VERIFY_API] Monnify payment status:', monnifyResult.paymentStatus)

    if (monnifyResult.paymentStatus !== 'PAID') {
      console.log('[VERIFY_API] Payment not yet confirmed by Monnify:', {
        paymentReference,
        status: monnifyResult.paymentStatus,
      })
      return NextResponse.json(
        {
          success: false,
          error: `Payment status is ${monnifyResult.paymentStatus}. Please check your bank app and try again.`,
          paymentReference,
          monnifyStatus: monnifyResult.paymentStatus,
        },
        { status: 400 }
      )
    }

    // Step 4: Monnify confirms PAID - now credit the wallet with idempotency check
    console.log('[VERIFY_API] Monnify confirmed PAID. Crediting wallet...')
    const creditResult = await verifyAndCreditPayment(paymentReference)

    if (!creditResult.success) {
      console.error('[VERIFY_API] Failed to credit wallet:', creditResult.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Payment verified but failed to credit wallet. Contacting support...',
          paymentReference,
        },
        { status: 500 }
      )
    }

    console.log('[VERIFY_API] Payment complete and wallet credited:', {
      paymentReference,
      amount: transaction.amount,
      alreadyProcessed: creditResult.alreadyProcessed,
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified and wallet credited successfully',
      paymentReference,
      amount: transaction.amount,
      alreadyProcessed: creditResult.alreadyProcessed,
    })
  } catch (error) {
    console.error('[VERIFY_API] Exception:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
