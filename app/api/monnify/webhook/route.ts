import { createServerClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAndCreditPayment } from '@/lib/actions/transactions'

const SECRET_KEY = process.env.MONNIFY_SECRET_KEY || ''

/**
 * Verify Monnify webhook signature using HMAC-SHA512
 * Per Monnify docs: SHA-512(client secret key + stringified JSON body)
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    // HMAC-SHA512 of: SECRET_KEY + body
    const hash = crypto
      .createHmac('sha512', SECRET_KEY)
      .update(body)
      .digest('hex')
    
    const isValid = hash === signature
    console.log('[WEBHOOK] Signature verification:', {
      isValid,
      receivedLength: signature?.length || 0,
      computedLength: hash.length,
    })
    return isValid
  } catch (error) {
    console.error('[WEBHOOK] Signature verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read the raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('monnify-signature')

    console.log('[WEBHOOK] Received webhook from Monnify')
    console.log('[WEBHOOK] Signature header present:', !!signature)

    // SECURITY 1: Validate signature before processing
    if (!signature || !verifyWebhookSignature(body, signature)) {
      console.error('[WEBHOOK] ❌ Invalid signature - rejecting webhook')
      // Return 200 anyway to prevent Monnify from retrying
      return NextResponse.json({ status: 'success' })
    }

    console.log('[WEBHOOK] ✅ Signature verified')

    // Parse the webhook payload
    const data = JSON.parse(body)
    const eventType = data.eventType
    const eventData = data.eventData

    console.log('[WEBHOOK] Event type:', eventType)

    // Only process SUCCESSFUL_TRANSACTION events
    if (eventType !== 'SUCCESSFUL_TRANSACTION') {
      console.log('[WEBHOOK] ⏭️  Ignoring non-transaction event:', eventType)
      return NextResponse.json({ status: 'success' })
    }

    const paymentReference = eventData?.paymentReference
    const paymentStatus = eventData?.paymentStatus
    const monnifyTransactionRef = eventData?.transactionReference

    if (!paymentReference) {
      console.error('[WEBHOOK] No payment reference in webhook')
      return NextResponse.json({ status: 'success' })
    }

    console.log('[WEBHOOK] Processing successful payment:', {
      paymentReference,
      paymentStatus,
      monnifyTransactionRef,
      amount: eventData?.amountPaid,
    })

    // SECURITY 2: Check for duplicate webhook processing
    // Get DB transaction to see if already processed
    const supabase = await createServerClient()
    const { data: existingTx, error: queryError } = await supabase
      .from('monnify_transactions')
      .select('status, webhook_received_at')
      .eq('payment_reference', paymentReference)
      .maybeSingle()

    if (queryError) {
      console.error('[WEBHOOK] Error querying transaction:', queryError)
      return NextResponse.json({ status: 'success' })
    }

    // CRITICAL: If already SUCCESS, this is a duplicate webhook - don't process again
    if (existingTx?.status === 'SUCCESS') {
      console.log('[WEBHOOK] ⏭️  Duplicate webhook - transaction already credited:', paymentReference)
      return NextResponse.json({ status: 'success' })
    }

    // SECURITY 3: Verify payment status is PAID before crediting
    if (paymentStatus !== 'PAID') {
      console.warn('[WEBHOOK] Payment status not PAID, not crediting:', {
        paymentReference,
        paymentStatus,
      })
      return NextResponse.json({ status: 'success' })
    }

    // Credit the wallet (idempotent - marks SUCCESS immediately)
    console.log('[WEBHOOK] Crediting wallet for:', paymentReference)
    const creditResult = await verifyAndCreditPayment(paymentReference)

    if (!creditResult.success) {
      console.error('[WEBHOOK] Failed to credit wallet:', {
        paymentReference,
        error: creditResult.error,
      })
      // Still return 200 to prevent Monnify retries
      // Error will be visible in logs for manual review
      return NextResponse.json({ status: 'success' })
    }

    // Record webhook received timestamp (for debugging duplicate scenarios)
    await supabase
      .from('monnify_transactions')
      .update({ webhook_received_at: new Date().toISOString() })
      .eq('payment_reference', paymentReference)

    console.log('[WEBHOOK] ✅ Payment processed successfully:', {
      paymentReference,
      credited: true,
    })

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('[WEBHOOK] Exception:', error)
    // Return success to prevent retry loop - error logged for manual review
    return NextResponse.json({ status: 'success' })
  }
}
