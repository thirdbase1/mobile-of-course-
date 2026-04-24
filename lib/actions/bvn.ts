'use server'

import { createServerClient } from '@/lib/supabase/server'

/**
 * Generate a random 11-digit BVN and save it to the user's profile
 */
export async function generateBVN(userId: string) {
  const supabase = await createServerClient()

  try {
    // Check if user already has a BVN
    const { data: profile } = await supabase
      .from('profiles')
      .select('bvn')
      .eq('id', userId)
      .single()

    if (profile?.bvn) {
      return { success: false, error: 'BVN already generated', bvn: profile.bvn }
    }

    // Generate random 11-digit BVN
    // Valid BVN format: starts with digit 1-9, followed by 10 more digits
    const firstDigit = Math.floor(Math.random() * 9) + 1
    const remainingDigits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('')
    const bvn = `${firstDigit}${remainingDigits}`

    console.log('[BVN] BVN generated for user')

    // Save BVN to profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ bvn })
      .eq('id', userId)

    if (updateError) {
      console.error('[BVN] Error saving BVN:', updateError.message)
      
      // Check if error is due to unique constraint (BVN already exists)
      if (updateError.message.includes('unique')) {
        return { success: false, error: 'This BVN is already in use. Please try again.' }
      }
      
      return { success: false, error: 'Failed to save BVN' }
    }

    return { success: true, bvn }
  } catch (error) {
    console.error('[BVN] Exception:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
