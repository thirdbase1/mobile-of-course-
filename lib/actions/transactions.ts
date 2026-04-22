'use server'

import { createServerClient } from '@/lib/supabase/server'
import { getMonnifyAccessToken } from './monnify'
import { sendTransactionEmail } from '@/lib/email/send-transaction-email'

/**
 * Get a transaction by payment_reference
 */
export async function getTransaction(paymentReference: string) {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('monnify_transactions')
      .select('*')
      .eq('payment_reference', paymentReference)
      .maybeSingle()

    if (error) {
      console.error('[TRANSACTION] Error fetching transaction:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Transaction not found', status: 'NOT_FOUND' }
    }

    // Check if expired
    if (data.status === 'PENDING' && new Date(data.expires_at) < new Date()) {
      // Update status to EXPIRED
      await supabase
        .from('monnify_transactions')
        .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
        .eq('id', data.id)

      data.status = 'EXPIRED'
    }

    return {
      success: true,
      data: {
        id: data.id,
        paymentReference: data.payment_reference,
        transactionReference: data.transaction_reference,
        amount: data.amount,
        status: data.status,
        accountNumber: data.account_number,
        bankName: data.bank_name,
        accountName: data.account_name,
        bankCode: data.bank_code,
        ussdCode: data.ussd_code,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        paidAt: data.paid_at,
      },
    }
  } catch (error) {
    console.error('[TRANSACTION] Exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Create a new transaction in the database
 */
export async function createTransaction(
  paymentReference: string,
  amount: number,
  expiresAt: string,
  transactionReference?: string,
  accountNumber?: string,
  bankName?: string,
  accountName?: string,
  bankCode?: string,
  ussdCode?: string,
  processingFee?: number,
  netAmount?: number
) {
  try {
    const supabase = await createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user?.id) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('monnify_transactions')
      .insert({
        user_id: user.id,
        payment_reference: paymentReference,
        transaction_reference: transactionReference,
        amount,
        status: 'PENDING',
        account_number: accountNumber,
        bank_name: bankName,
        account_name: accountName,
        bank_code: bankCode,
        ussd_code: ussdCode,
        expires_at: expiresAt,
        processing_fee: processingFee,
        net_amount: netAmount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('[TRANSACTION] Error creating transaction:', error)
      return { success: false, error: error.message }
    }

    return { success: true, transactionId: data?.id }
  } catch (error) {
    console.error('[TRANSACTION] Exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  paymentReference: string,
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'CANCELLED'
) {
  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('monnify_transactions')
      .update({
        status,
        updated_at: new Date().toISOString(),
        paid_at: status === 'SUCCESS' ? new Date().toISOString() : undefined,
      })
      .eq('payment_reference', paymentReference)

    if (error) {
      console.error('[TRANSACTION] Error updating status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[TRANSACTION] Exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Cancel a transaction
 */
export async function cancelTransaction(paymentReference: string) {
  try {
    const supabase = await createServerClient()
    
    // Verify user owns this transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('monnify_transactions')
      .select('user_id, status')
      .eq('payment_reference', paymentReference)
      .maybeSingle()

    if (fetchError || !transaction) {
      return { success: false, error: 'Transaction not found' }
    }

    // Verify it's the current user's transaction
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user?.id || user.id !== transaction.user_id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only allow cancelling PENDING transactions
    if (transaction.status !== 'PENDING') {
      return { success: false, error: `Cannot cancel ${transaction.status} transaction` }
    }

    const { error: updateError } = await supabase
      .from('monnify_transactions')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_reference', paymentReference)

    if (updateError) {
      console.error('[TRANSACTION] Error cancelling:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[TRANSACTION] Exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update transaction with Monnify response data
 */
export async function updateTransactionWithMonnifyData(
  paymentReference: string,
  data: {
    transactionReference?: string
    accountNumber?: string
    bankName?: string
    accountName?: string
    bankCode?: string
    ussdCode?: string
    monnifyResponse?: any
  }
) {
  try {
    const supabase = await createServerClient()
    
    console.log('[TRANSACTION_UPDATE] Starting update for payment_reference:', paymentReference)
    console.log('[TRANSACTION_UPDATE] Fields to update:', {
      transaction_reference: data.transactionReference,
      account_number: data.accountNumber,
      bank_name: data.bankName,
      account_name: data.accountName,
      bank_code: data.bankCode,
      ussd_code: data.ussdCode,
    })
    
    // FIX 2: Use .select() to get back the updated row and verify the update matched
    const { data: updated, error } = await supabase
      .from('monnify_transactions')
      .update({
        transaction_reference: data.transactionReference ?? null,
        account_number: data.accountNumber ?? null,
        bank_name: data.bankName ?? null,
        account_name: data.accountName ?? null,
        bank_code: data.bankCode ?? null,
        ussd_code: data.ussdCode ?? null,
        monnify_response: data.monnifyResponse ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('payment_reference', paymentReference)
      .select('id, payment_reference, transaction_reference, account_number, bank_name')
      .maybeSingle()

    if (error) {
      console.error('[TRANSACTION_UPDATE] Supabase error:', error)
      return { success: false, error: error.message }
    }

    // CRITICAL: If updated is null, it means the WHERE clause matched 0 rows
    if (!updated) {
      console.error('[TRANSACTION_UPDATE] ❌ Update matched 0 rows:', { paymentReference })
      return { success: false, error: 'Update matched 0 rows - payment_reference not found' }
    }

    console.log('[TRANSACTION_UPDATE] ✅ Successfully updated', {
      payment_reference: paymentReference,
      transaction_reference: updated.transaction_reference,
      account_number: updated.account_number,
      bank_name: updated.bank_name,
    })

    return { success: true, updated }
  } catch (error) {
    console.error('[TRANSACTION_UPDATE] Exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Verify and credit payment - updates wallet balance and logs transaction
 * CRITICAL: Set monnify_transactions.status = SUCCESS immediately after payment confirmation
 * to prevent duplicate processing from polling
 */
export async function verifyAndCreditPayment(paymentReference: string) {
  try {
    const supabase = await createServerClient()

    // Get transaction details from monnify_transactions table
    const { data: transaction, error: txError } = await supabase
      .from('monnify_transactions')
      .select('user_id, amount, status, bank_name, account_number, account_name, transaction_reference, processing_fee, net_amount')
      .eq('payment_reference', paymentReference)
      .maybeSingle()

    if (txError || !transaction) {
      console.error('[TRANSACTION] Transaction not found:', paymentReference)
      return { success: false, error: 'Transaction not found' }
    }

    // CRITICAL IDEMPOTENCY CHECK: If already marked SUCCESS, skip entirely
    if (transaction.status === 'SUCCESS') {
      console.log('[TRANSACTION] Already credited (status=SUCCESS):', paymentReference)
      return { success: true, credited: true, alreadyProcessed: true }
    }

    // CRITICAL: Immediately mark as SUCCESS to prevent duplicate processing from polling
    // This MUST happen before updating wallet to ensure idempotency
    const { error: markSuccessError } = await supabase
      .from('monnify_transactions')
      .update({ status: 'SUCCESS', paid_at: new Date().toISOString() })
      .eq('payment_reference', paymentReference)
      .eq('status', transaction.status) // Only update if status hasn't changed (prevent race conditions)

    if (markSuccessError) {
      console.error('[TRANSACTION] Error marking payment as success:', markSuccessError)
      return { success: false, error: 'Error marking payment as success' }
    }

    // Get current wallet balance from profiles.wallet_balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', transaction.user_id)
      .maybeSingle()

    if (profileError) {
      console.error('[TRANSACTION] Error fetching profile:', profileError)
      return { success: false, error: 'Error fetching wallet' }
    }

    const balanceBefore = profile?.wallet_balance || 0
    // Use net_amount if available (new calculation), fallback to full amount for legacy transactions
    const creditAmount = transaction.net_amount || transaction.amount
    const balanceAfter = balanceBefore + creditAmount

    console.log('[TRANSACTION] Crediting wallet:', {
      paymentReference,
      depositAmount: transaction.amount,
      processingFee: transaction.processing_fee || 0,
      netAmount: creditAmount,
      balanceBefore,
      balanceAfter,
    })

    // Update wallet balance in profiles.wallet_balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_balance: balanceAfter, updated_at: new Date().toISOString() })
      .eq('id', transaction.user_id)

    if (updateError) {
      console.error('[TRANSACTION] Error updating wallet:', updateError)
      // Continue to log transaction even if wallet update fails
    }

    // Log transaction to transactions table with full schema
    // Check if profile exists (if they have a wallet balance, they're a valid user)
    const { data: profileExists } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', transaction.user_id)
      .maybeSingle()

    if (profileExists) {
      const { error: saveError } = await supabase
        .from('transactions')
        .insert({
          user_id: transaction.user_id,
          transaction_id: paymentReference,
          category: 'WALLET_FUND',
          service_id: transaction.transaction_reference || 'bank_transfer',
          service_name: transaction.bank_name || 'Bank Transfer',
          amount: creditAmount,
          phone: '',
          status: 'SUCCESS',
          description: `Wallet funded via bank transfer from ${transaction.bank_name}`,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          api_response: JSON.stringify({
            account: transaction.account_number,
            accountName: transaction.account_name,
            bankName: transaction.bank_name,
            depositAmount: transaction.amount,
            processingFee: transaction.processing_fee || 0,
            netAmount: creditAmount,
          }),
          created_at: new Date().toISOString(),
          payment_reference: paymentReference,
          transaction_reference: transaction.transaction_reference,
          monnify_account_number: transaction.account_number,
          monnify_bank_name: transaction.bank_name,
          monnify_account_name: transaction.account_name,
          payment_method: 'BANK_TRANSFER',
        })

      if (saveError) {
        console.error('[TRANSACTION] Error logging transaction:', saveError)
        // Don't fail the payment if transaction logging fails - wallet is already updated
      }
    } else {
      console.warn('[TRANSACTION] Profile not found, skipping transaction log:', transaction.user_id)
    }

    console.log('[TRANSACTION] Payment credited successfully:', {
      paymentReference,
      amount: transaction.amount,
      newBalance: balanceAfter,
    })

    // Fire-and-forget receipt. This path only runs for NEWLY credited deposits
    // (the idempotency check above returns early for duplicates), so the email
    // will only be sent once per successful deposit.
    sendTransactionEmail({
      userId: transaction.user_id,
      category: 'WALLET_FUND',
      serviceName: transaction.bank_name || 'Bank Transfer',
      amount: creditAmount,
      status: 'SUCCESS',
      transactionId: paymentReference,
      paymentMethod: 'Bank Transfer',
      extras: [
        { label: 'New balance', value: `₦${balanceAfter.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      ],
    }).catch((err) => {
      console.error('[TRANSACTION] deposit email failed (swallowed):', err)
    })

    return { success: true, credited: true }
  } catch (error) {
    console.error('[TRANSACTION] Exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Query Monnify for real-time transaction status using transactionReference
 * This is the Monnify reference, not our internal paymentReference
 */
export async function queryMonnifyTransaction(paymentReference: string) {
  try {
    // First, get the transaction from our DB to get the transactionReference
    const supabase = await createServerClient()
    const { data: dbTransaction, error: dbError } = await supabase
      .from('monnify_transactions')
      .select('transaction_reference, user_id, amount, bank_name')
      .eq('payment_reference', paymentReference)
      .maybeSingle()

    if (dbError || !dbTransaction || !dbTransaction.transaction_reference) {
      console.error('[MONNIFY_QUERY] DB transaction not found or no transactionReference:', paymentReference)
      return { success: false, error: 'Transaction not found in database' }
    }

    const accessToken = await getMonnifyAccessToken()
    if (!accessToken) {
      return { success: false, error: 'Failed to authenticate with Monnify' }
    }

    // Query Monnify using their transactionReference (not our paymentReference)
    const encodedRef = encodeURIComponent(dbTransaction.transaction_reference)
    const response = await fetch(
      `https://api.monnify.com/api/v2/merchant/transactions/query?transactionReference=${encodedRef}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const responseText = await response.text()
    console.log('[MONNIFY_QUERY] Response status:', response.status)

    if (!response.ok) {
      console.error('[MONNIFY_QUERY] Query failed:', response.status, responseText)
      return { success: false, error: 'Failed to query transaction' }
    }

    const data = JSON.parse(responseText) as any
    const responseBody = data.responseBody

    // Check if payment is PAID
    if (responseBody.paymentStatus === 'PAID') {
      // Credit the wallet immediately
      const creditResult = await verifyAndCreditPayment(paymentReference)
      
      if (!creditResult.success) {
        console.error('[MONNIFY_QUERY] Error crediting:', creditResult.error)
        return { success: false, error: creditResult.error }
      }

      return {
        success: true,
        paymentStatus: 'PAID',
        credited: true,
        transactionData: responseBody,
      }
    }

    return {
      success: true,
      paymentStatus: responseBody.paymentStatus || 'PENDING',
      transactionData: responseBody,
    }
  } catch (error) {
    console.error('[MONNIFY_QUERY] Exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
