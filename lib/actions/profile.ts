'use server'

import { createServerClient } from '@/lib/supabase/server'

export async function updateUserProfile(userId: string, username: string) {
  const supabase = await createServerClient()
  
  try {
    const cleanUsername = username.toLowerCase().trim()
    
    console.log('[PROFILE] Updating username for user:', userId, 'username:', cleanUsername)
    
    // Update the profile
    const { error, data } = await supabase
      .from('profiles')
      .update({ username: cleanUsername })
      .eq('id', userId)
      .select()
    
    if (error) {
      console.error('[PROFILE] Supabase error updating username:', error.code, error.message)
      return false
    }

    console.log('[PROFILE] Username update successful:', data)
    return true
  } catch (error) {
    console.error('[PROFILE] Exception in updateUserProfile:', error)
    return false
  }
}
