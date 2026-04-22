'use server'

import { createServerClient } from '@/lib/supabase/server'

/**
 * Server-side referral creation - bypasses RLS
 */
export async function createReferralOnSignupAction(
  refereeId: string,
  referrerUsername: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()

  try {
    const trimmedUsername = referrerUsername.trim().toLowerCase()

    console.log(`[REFERRAL] Looking up username: ${trimmedUsername} for referee: ${refereeId}`)

    // Step 1: Find referrer by username (using server client - bypasses RLS)
    const { data: referrers, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmedUsername)
      .limit(1)

    if (lookupError) {
      console.log(`[REFERRAL] Lookup error for username ${trimmedUsername}:`, lookupError.message)
      return { success: false }
    }

    if (!referrers || referrers.length === 0) {
      console.log(`[REFERRAL] Username not found: ${trimmedUsername}`)
      return { success: false }
    }

    const referrerId = referrers[0].id

    // Step 2: Prevent self-referral
    if (referrerId === refereeId) {
      console.log(`[REFERRAL] Self-referral blocked`)
      return { success: false }
    }

    // Step 3: Check if referee already has a referral
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_id', refereeId)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`[REFERRAL] Referee already referred`)
      return { success: false }
    }

    // Step 4: Update referred_by in profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ referred_by: referrerId })
      .eq('id', refereeId)

    if (updateError) {
      console.error(`[REFERRAL] Failed to update referred_by:`, updateError)
      return { success: false }
    }

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
      console.error(`[REFERRAL] Failed to create referral:`, insertError)
      return { success: false }
    }

    console.log(`[REFERRAL] Referral created: ${referrerId} -> ${refereeId}`)
    return { success: true }
  } catch (error) {
    console.error(`[REFERRAL] Exception in createReferralOnSignupAction:`, error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
