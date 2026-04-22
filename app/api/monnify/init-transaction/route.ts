'use server'

import { NextRequest, NextResponse } from 'next/server'
import { initTransaction } from '@/lib/actions/monnify'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, description, paymentReference } = body

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    if (!paymentReference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    console.log('[API] Initializing transaction:', { amount, description, paymentReference })

    // Get authenticated user from session
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user?.id) {
      console.error('[API] User not authenticated:', userError)
      return NextResponse.json(
        { error: 'User not authenticated' },
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
      console.error('[API] Failed to fetch user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 400 }
      )
    }

    // Call the initTransaction function with all required fields including userId
    const result = await initTransaction(
      amount,
      description,
      paymentReference,
      user.id,
      profile.email,
      profile.full_name || 'User'
    )

    if (!result.success) {
      console.error('[API] Transaction initialization failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to initialize transaction' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      transactionReference: result.transactionReference,
      paymentLink: result.paymentLink,
    })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
