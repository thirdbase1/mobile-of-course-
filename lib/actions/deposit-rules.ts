'use server'

import { createClient } from '@/lib/supabase/server'
import { isHardcodedAdmin } from '@/lib/utils/hardcoded-admin'
import type { DepositRules } from '@/lib/utils/deposit-fee'

/**
 * Get current active deposit rules
 * Used by both admin page and user deposit page for fee calculations
 */
export async function getDepositRules(): Promise<DepositRules | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deposit_rules')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('[v0] Error fetching deposit rules:', error)
    return null
  }

  return data
}

/**
 * Update deposit rules (admin only)
 * Uses upsert to ensure a default rule always exists
 */
export async function updateDepositRules(
  updates: Partial<Omit<DepositRules, 'id' | 'created_at' | 'updated_at' | 'is_active'>>
): Promise<{ success: boolean; error?: string; data?: DepositRules }> {
  const supabase = await createClient()

  // Check admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if hardcoded admin first
  if (isHardcodedAdmin(user.email)) {
    // Proceed with update
  } else {
    // Get user role from database
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return { success: false, error: 'Only admins can update deposit rules' }
    }
  }

  // First, get the current active rule ID (if exists)
  const { data: existingRule, error: fetchError } = await supabase
    .from('deposit_rules')
    .select('id')
    .eq('is_active', true)
    .single()

  // If no rule exists, create default first
  if (!existingRule && fetchError?.code === 'PGRST116') {
    console.log('[v0] No active deposit rule found, creating default...')
    const { data: newRule, error: insertError } = await supabase
      .from('deposit_rules')
      .insert({
        base_fee: 50.0,
        percentage_fee: 1.5,
        threshold_amount: 2500.0,
        max_fee: null,
        is_active: true,
        ...updates,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[v0] Error creating default deposit rule:', insertError)
      return { success: false, error: 'Failed to create default rule: ' + insertError.message }
    }

    return { success: true, data: newRule }
  }

  // Update the existing active rule
  const { data, error } = await supabase
    .from('deposit_rules')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('is_active', true)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating deposit rules:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Get all deposit rules history (admin only)
 */
export async function getAllDepositRules(): Promise<DepositRules[] | null> {
  const supabase = await createClient()

  // Check admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Check if hardcoded admin
  if (!isHardcodedAdmin(user.email)) {
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return null
    }
  }

  const { data, error } = await supabase
    .from('deposit_rules')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching all deposit rules:', error)
    return null
  }

  return data
}
