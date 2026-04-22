'use server'

import { createServerClient } from '@/lib/supabase/server'

// Use production endpoints for both auth and API calls
const MONNIFY_AUTH_URL = 'https://api.monnify.com/api/v1/auth/login'
const MONNIFY_API_URL = 'https://api.monnify.com/api/v2'
const API_KEY = process.env.MONNIFY_API_KEY || ''
const SECRET_KEY = process.env.MONNIFY_SECRET_KEY || ''
const CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE || ''

/**
 * Get Monnify access token using Basic Auth
 * Per Monnify docs: Use API_KEY as username and SECRET_KEY as password
 */
export async function getMonnifyAccessToken(): Promise<string | null> {
  try {
    // Validate credentials exist
    if (!API_KEY || !SECRET_KEY) {
      console.error('[MONNIFY] ❌ Missing API credentials:', {
        hasApiKey: !!API_KEY,
        hasSecretKey: !!SECRET_KEY,
        hasContractCode: !!CONTRACT_CODE,
        apiKeyLength: API_KEY?.length || 0,
        secretKeyLength: SECRET_KEY?.length || 0,
      })
      return null
    }

    // Encode credentials in base64 format: API_KEY:SECRET_KEY
    const credentials = Buffer.from(`${API_KEY}:${SECRET_KEY}`).toString('base64')
    
    console.log('[MONNIFY] 🔐 Authenticating with:', {
      apiKeyPrefix: API_KEY?.substring(0, 8) + '...',
      secretKeyPrefix: SECRET_KEY?.substring(0, 8) + '...',
    })

    const response = await fetch(MONNIFY_AUTH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Empty body required by Monnify
    })

    const responseText = await response.text()
    console.log('[MONNIFY] Auth response status:', response.status)
    
    if (!response.ok) {
      console.error('[MONNIFY] ❌ Auth failed:', {
        status: response.status,
        responseLength: responseText?.length || 0,
        firstChars: responseText?.substring(0, 200) || 'empty',
      })
      return null
    }

    try {
      const data = JSON.parse(responseText) as any
      const token = data.responseBody?.accessToken
      
      if (!token) {
        console.error('[MONNIFY] ❌ No access token in response:', data)
        return null
      }
      
      console.log('[MONNIFY] ✅ Auth successful, token received:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
      })
      return token
    } catch (parseError) {
      console.error('[MONNIFY] Failed to parse auth response:', parseError)
      return null
    }
  } catch (error) {
    console.error('[MONNIFY] Auth error:', error instanceof Error ? error.message : error)
    return null
  }
}



/**
 * Initialize transaction with Monnify to get a valid transaction reference
 * Must be called before init-payment
 * @param amount - Transaction amount in naira
 * @param description - Payment description
 * @param paymentReference - Your own unique payment reference
 * @param userId - User ID for tracking deposits
 * @param customerEmail - Customer email (required by Monnify)
 * @param customerName - Customer name (required by Monnify)
 */
export async function initTransaction(
  amount: number,
  description: string,
  paymentReference: string,
  userId: string,
  customerEmail: string,
  customerName: string
) {
  try {
    console.log('[MONNIFY] Initializing transaction:', { amount, description, paymentReference, userId })

    // Get Monnify access token
    const accessToken = await getMonnifyAccessToken()
    if (!accessToken) {
      console.error('[MONNIFY] Failed to get access token for transaction initialization')
      return { success: false, error: 'Failed to authenticate with Monnify' }
    }

    const requestBody = {
      amount,
      paymentDescription: description,
      paymentReference: `${paymentReference}|${userId}`, // Include userId for webhook tracking
      customerEmail,
      customerName,
      currencyCode: 'NGN',
      contractCode: CONTRACT_CODE,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    }

    const response = await fetch('https://api.monnify.com/api/v1/merchant/transactions/init-transaction', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    console.log('[MONNIFY] Init-transaction response status:', response.status)

    if (!response.ok) {
      console.error('[MONNIFY] Init-transaction failed:', response.status, 'Response:', responseText)
      try {
        const errorData = JSON.parse(responseText)
        return { success: false, error: errorData.responseMessage || 'Failed to initialize transaction' }
      } catch {
        return { success: false, error: `Transaction initialization failed with status ${response.status}` }
      }
    }

    try {
      const data = JSON.parse(responseText) as any
      const responseBody = data.responseBody

      console.log('[MONNIFY] Transaction initialized successfully')

      return {
        success: true,
        transactionReference: responseBody.transactionReference,
        paymentLink: responseBody.checkoutUrl,
      }
    } catch (parseError) {
      console.error('[MONNIFY] Failed to parse init-transaction response:', parseError)
      return { success: false, error: 'Failed to parse transaction response' }
    }
  } catch (error) {
    console.error('[MONNIFY] Transaction initialization error:', error instanceof Error ? error.message : error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Initialize a one-time payment with dynamic account number
 * Generates a temporary account number for payment collection
 * @param transactionReference - Unique reference from initialize transaction endpoint
 * @param bankCode - Optional specific bank code for USSD generation
 */
export async function initializePayment(transactionReference: string, bankCode?: string) {
  try {
    console.log('[MONNIFY] Initializing payment for transaction:', transactionReference)

    // Get Monnify access token
    const accessToken = await getMonnifyAccessToken()
    if (!accessToken) {
      console.error('[MONNIFY] Failed to get access token for payment initialization')
      return { success: false, error: 'Failed to authenticate with Monnify' }
    }

    const requestBody: any = {
      transactionReference,
    }

    if (bankCode) {
      requestBody.bankCode = bankCode
    }

    const response = await fetch('https://api.monnify.com/api/v1/merchant/bank-transfer/init-payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    console.log('[MONNIFY] Payment initialization response status:', response.status)

    if (!response.ok) {
      console.error('[MONNIFY] Payment initialization failed:', response.status)
      try {
        const errorData = JSON.parse(responseText)
        return { success: false, error: errorData.responseMessage || 'Failed to initialize payment' }
      } catch {
        return { success: false, error: `Payment initialization failed with status ${response.status}` }
      }
    }

    try {
      const data = JSON.parse(responseText) as any
      const responseBody = data.responseBody

      console.log('[MONNIFY] Payment initialized successfully')

      return {
        success: true,
        accountNumber: responseBody.accountNumber,
        accountName: responseBody.accountName,
        bankName: responseBody.bankName,
        bankCode: responseBody.bankCode,
        ussdCode: responseBody.ussdCode,
      }
    } catch (parseError) {
      console.error('[MONNIFY] Failed to parse payment initialization response:', parseError)
      return { success: false, error: 'Failed to parse payment response' }
    }
  } catch (error) {
    console.error('[MONNIFY] Payment initialization error:', error instanceof Error ? error.message : error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
