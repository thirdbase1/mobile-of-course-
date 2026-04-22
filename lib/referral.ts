'use server'

import { createServerClient } from '@/lib/supabase/server'

const COMMISSION_RATES: Record<string, number> = {
  AIRTIME: 0.50,
  DATA: 2.00,
  CABLE: 2.00,
  ELECTRICITY: 2.00,
  WALLET_FUND: 2.00,
  RECHARGE_PINS: 1.00,
}

/**
 * Create a referral record when someone signs up with a referrer username
 * Super simple: just look up the username and link them
 */
export async function createReferralOnSignup(
  refereeId: string,
  referrerUsername: string
): Promise<void> {
  const supabase = await createServerClient()

  try {
    const trimmedUsername = referrerUsername.trim().toLowerCase()

    // Step 1: Find referrer by username
    const { data: referrers, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmedUsername)
      .limit(1)

    if (lookupError) {
      console.log(`[REFERRAL] Lookup error for username ${trimmedUsername}:`, lookupError)
      return
    }

    if (!referrers || referrers.length === 0) {
      console.log(`[REFERRAL] Username not found: ${trimmedUsername}`)
      return
    }

    const referrerId = referrers[0].id

    // Step 2: Prevent self-referral
    if (referrerId === refereeId) {
      console.log(`[REFERRAL] Self-referral blocked`)
      return
    }

    // Step 3: Check if referee already has a referral
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_id', refereeId)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`[REFERRAL] Referee already referred`)
      return
    }

    // Step 4: Update referred_by in profiles
    await supabase
      .from('profiles')
      .update({ referred_by: referrerId })
      .eq('id', refereeId)

    // Step 5: Create referral record (username stored for reference)
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referee_id: refereeId,
        referral_code_used: trimmedUsername,
        status: 'PENDING',
      })

    if (insertError) {
      console.error(`[REFERRAL] Failed to insert referral:`, insertError)
      return
    }

    console.log(`[REFERRAL] Referral created: ${trimmedUsername} -> ${refereeId}`)
  } catch (error) {
    console.error(`[REFERRAL] Error in createReferralOnSignup:`, error)
  }
}

/**
 * Process referral earnings when a transaction completes
 */
export async function processReferralEarning(transaction: {
  id: string
  user_id: string
  category: string
  status: string
}): Promise<void> {
  try {
    if (transaction.status !== 'SUCCESS') {
      return
    }

    const supabase = await createServerClient()

    // Step 1: Look up referral for this user
    const { data: referrals, error: lookupError } = await supabase
      .from('referrals')
      .select('id, referrer_id, status')
      .eq('referee_id', transaction.user_id)
      .limit(1)

    if (lookupError) {
      console.log(`[REFERRAL] Lookup error:`, lookupError)
      return
    }

    if (!referrals || referrals.length === 0) {
      return
    }

    const referral = referrals[0]

    // Step 2: Get commission rate
    const commission = COMMISSION_RATES[transaction.category]
    if (!commission) {
      return
    }

    // Step 3: Activate referral if pending
    if (referral.status === 'PENDING') {
      await supabase
        .from('referrals')
        .update({ status: 'ACTIVE', activated_at: new Date().toISOString() })
        .eq('id', referral.id)
    }

    // Step 4: Insert earning record
    await supabase.from('referral_earnings').insert({
      referrer_id: referral.referrer_id,
      referee_id: transaction.user_id,
      transaction_id: transaction.id,
      category: transaction.category,
      commission: commission,
    })

    // Step 5: Update referrer's total earnings
    await supabase.rpc('increment_referral_earnings', {
      user_id: referral.referrer_id,
      amount: commission,
    })

    console.log(`[REFERRAL] Earning recorded: ₦${commission} for referrer`)
  } catch (error) {
    console.error(`[REFERRAL] Error processing earning:`, error)
  }
}

/**
 * Get referral stats for a user - OPTIMIZED
 */
export async function getReferralStats(userId: string): Promise<{
  username: string | null
  share_url: string | null
  total_referred: number
  active_referees: number
  total_earned: number
  unpaid_earned: number
  referrals: Array<{
    id: string
    status: string
    created_at: string
    activated_at: string | null
  }>
  recent_earnings: Array<{
    id: string
    category: string
    commission: number
    created_at: string
    paid: boolean
  }>
}> {
  const supabase = await createServerClient()

  try {
    // First, get user profile (fast query)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username, referral_earnings_total')
      .eq('id', userId)
      .single()

    // Quick early return if no username
    if (!userProfile) {
      return {
        username: null,
        share_url: null,
        total_referred: 0,
        active_referees: 0,
        total_earned: 0,
        unpaid_earned: 0,
        referrals: [],
        recent_earnings: [],
      }
    }

    // Build share URL early
    const username = userProfile?.username || null
    const share_url = username ? `https://mozosubz.xyz/register?ref=${username}` : null

    // If no username, return early
    if (!username) {
      return {
        username: null,
        share_url: null,
        total_referred: 0,
        active_referees: 0,
        total_earned: 0,
        unpaid_earned: 0,
        referrals: [],
        recent_earnings: [],
      }
    }

    // Now fetch referrals and earnings in parallel (these may be larger queries)
    const [referralsResult, earningsResult] = await Promise.all([
      supabase
        .from('referrals')
        .select('id, status, created_at, activated_at', { count: 'exact' })
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(100), // Add limit for performance

      supabase
        .from('referral_earnings')
        .select('id, category, commission, created_at, paid')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const referrals = referralsResult.data || []
    const earnings = earningsResult.data || []

    const total_referred = referrals.length
    const active_referees = referrals.filter(r => r.status === 'ACTIVE').length
    const total_earned = userProfile?.referral_earnings_total || 0
    const unpaid_earned = earnings
      .filter(e => !e.paid)
      .reduce((sum, e) => sum + e.commission, 0)

    return {
      username,
      share_url,
      total_referred,
      active_referees,
      total_earned,
      unpaid_earned,
      referrals,
      recent_earnings: earnings,
    }
  } catch (error) {
    console.error(`[REFERRAL] Error getting stats:`, error)
    return {
      username: null,
      share_url: null,
      total_referred: 0,
      active_referees: 0,
      total_earned: 0,
      unpaid_earned: 0,
      referrals: [],
      recent_earnings: [],
    }
  }
}
