import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { payment_reference: string } }
) {
  try {
    const paymentReference = params.payment_reference
    const supabase = await createServerClient()

    // Update transaction status to CANCELLED
    const { error } = await supabase
      .from('monnify_transactions')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_reference', paymentReference)

    if (error) {
      console.error('[CANCEL] Error cancelling transaction:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    console.log('[CANCEL] Payment cancelled:', paymentReference)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CANCEL] Exception:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
