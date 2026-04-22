import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { initTransaction, initializePayment } from '@/lib/actions/monnify'
import { createTransaction, updateTransactionWithMonnifyData } from '@/lib/actions/transactions'
import { generatePaymentReference } from '@/lib/utils/payment-reference'
import { getDepositRules } from '@/lib/actions/deposit-rules'
import { calculateDepositFee } from '@/lib/utils/deposit-fee'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, description } = body

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Calculate deposit fee based on current rules
    const depositRules = await getDepositRules()
    let processingFee = 50 // Default fallback
    let netAmount = parseFloat(amount) - processingFee

    if (depositRules) {
      const feeCalc = calculateDepositFee(parseFloat(amount), depositRules)
      processingFee = feeCalc.processingFee
      netAmount = feeCalc.netAmount
      console.log('[DEPOSIT_API] Fee calculated:', {
        depositAmount: parseFloat(amount),
        processingFee,
        netAmount,
      })
    }

    console.log('[DEPOSIT_API] Creating deposit transaction:', { amount, description })

    // Get authenticated user from session
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user?.id) {
      console.error('[DEPOSIT_API] User not authenticated:', userError)
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get user profile to get email and name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      console.error('[DEPOSIT_API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to get user information' },
        { status: 400 }
      )
    }

    // Generate unique payment reference
    const paymentReference = generatePaymentReference(user.id)
    console.log('[DEPOSIT_API] Generated payment reference:', paymentReference)

    // Calculate expiry: 20 minutes from now
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString()

    // Step 1: Create transaction in monnify_transactions table
    const createTxResult = await createTransaction(
      paymentReference,
      parseFloat(amount),
      expiresAt,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      processingFee,
      netAmount
    )

    if (!createTxResult.success) {
      console.error('[DEPOSIT_API] Failed to create transaction:', createTxResult.error)
      return NextResponse.json(
        { success: false, error: 'Failed to create transaction' },
        { status: 500 }
      )
    }

    console.log('[DEPOSIT_API] Transaction created:', createTxResult.transactionId)

    // FIX 1: Immediately verify the row exists right after creation
    const { data: createdRow, error: createdRowError } = await supabase
      .from('monnify_transactions')
      .select('id, payment_reference, user_id, transaction_reference')
      .eq('payment_reference', paymentReference)
      .maybeSingle()

    if (createdRowError || !createdRow) {
      console.error('[DEPOSIT_API] ❌ Row not found right after create:', {
        paymentReference,
        createdRowError,
      })
      return NextResponse.json(
        { success: false, error: 'Transaction row not found after create - DB insert failed' },
        { status: 500 }
      )
    }

    console.log('[DEPOSIT_API] ✅ Created row verified:', {
      id: createdRow.id,
      payment_reference: createdRow.payment_reference,
      user_id: createdRow.user_id,
      transaction_reference: createdRow.transaction_reference,
    })

    // Step 2: Initialize transaction with Monnify to get transactionReference
    const initTxResult = await initTransaction(
      parseFloat(amount),
      description || `Wallet deposit`,
      paymentReference,
      user.id,
      profile.email,
      profile.full_name || 'User'
    )

    if (!initTxResult.success) {
      console.error('[DEPOSIT_API] Monnify init-transaction failed:', initTxResult.error)
      return NextResponse.json(
        { success: false, error: initTxResult.error || 'Failed to initialize payment' },
        { status: 400 }
      )
    }

    const monnifyTransactionRef = initTxResult.transactionReference
    console.log('[DEPOSIT_API] Monnify transaction reference:', monnifyTransactionRef)

    // Step 3: Initialize payment to get temporary account details
    const initPayResult = await initializePayment(monnifyTransactionRef)

    if (!initPayResult.success) {
      console.error('[DEPOSIT_API] Monnify init-payment failed:', initPayResult.error)
      return NextResponse.json(
        { success: false, error: initPayResult.error || 'Failed to initialize payment' },
        { status: 400 }
      )
    }

    console.log('[DEPOSIT_API] Payment initialized successfully')

    // Step 4: Update transaction with Monnify data
    const updateResult = await updateTransactionWithMonnifyData(paymentReference, {
      transactionReference: monnifyTransactionRef,
      accountNumber: initPayResult.accountNumber,
      bankName: initPayResult.bankName,
      accountName: initPayResult.accountName,
      bankCode: initPayResult.bankCode,
      ussdCode: initPayResult.ussdCode,
      monnifyResponse: initPayResult,
    })

    if (!updateResult.success) {
      console.error('[DEPOSIT_API] Failed to update transaction with Monnify data:', updateResult.error)
      return NextResponse.json(
        { success: false, error: 'Failed to update payment details in database' },
        { status: 500 }
      )
    }

    console.log('[DEPOSIT_API] ✅ DB Updated with Monnify data:', {
      paymentReference,
      transactionReference: monnifyTransactionRef,
      accountNumber: initPayResult.accountNumber,
      bankName: initPayResult.bankName,
      accountName: initPayResult.accountName,
    })

    console.log('[DEPOSIT_API] Transaction complete. Payment reference:', paymentReference)

    return NextResponse.json({
      success: true,
      paymentReference,
      transactionId: createTxResult.transactionId,
      checkoutUrl: `/checkout/${paymentReference}`,
    })
  } catch (error) {
    console.error('[DEPOSIT_API] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
