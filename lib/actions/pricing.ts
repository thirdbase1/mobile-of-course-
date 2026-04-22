'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { PricingRule } from '@/lib/pricing/calculator'

export async function createPricingRule(
  serviceId: string,
  planName: string,
  basePrice: number,
  markupType: 'fixed' | 'percentage',
  markupValue: number
): Promise<{ success: boolean; error?: string; data?: PricingRule }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return { success: false, error: 'Not authenticated' }
    }

    // Layout already protects /admin/* routes - no need for extra admin check
    // If they reached this page, they're already authorized

    // Use admin client to insert
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase.from('pricing_rules').insert([
      {
        service_id: serviceId,
        plan_name: planName,
        base_price: basePrice,
        markup_type: markupType,
        markup_value: markupValue,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]).select().single()

    if (error) {
      console.error('[v0] Error creating pricing rule:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/pricing')
    return { success: true, data }
  } catch (error) {
    console.error('[v0] Error in createPricingRule:', error)
    return { success: false, error: String(error) }
  }
}

export async function updatePricingRule(
  ruleId: string,
  updates: {
    basePrice?: number
    markupType?: 'fixed' | 'percentage'
    markupValue?: number
    isActive?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return { success: false, error: 'Not authenticated' }
    }

    // Layout already protects /admin/* routes - no need for extra admin check

    // Use admin client to update
    const adminSupabase = createAdminClient()
    const updateData: any = { updated_at: new Date().toISOString() }

    if (updates.basePrice !== undefined) updateData.base_price = updates.basePrice
    if (updates.markupType !== undefined) updateData.markup_type = updates.markupType
    if (updates.markupValue !== undefined) updateData.markup_value = updates.markupValue
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    const { error } = await adminSupabase
      .from('pricing_rules')
      .update(updateData)
      .eq('id', ruleId)

    if (error) {
      console.error('[v0] Error updating pricing rule:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/pricing')
    return { success: true }
  } catch (error) {
    console.error('[v0] Error in updatePricingRule:', error)
    return { success: false, error: String(error) }
  }
}

export async function deletePricingRule(ruleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return { success: false, error: 'Not authenticated' }
    }

    // Layout already protects /admin/* routes - no need for extra admin check

    // Use admin client to delete
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('pricing_rules')
      .delete()
      .eq('id', ruleId)

    if (error) {
      console.error('[v0] Error deleting pricing rule:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/pricing')
    return { success: true }
  } catch (error) {
    console.error('[v0] Error in deletePricingRule:', error)
    return { success: false, error: String(error) }
  }
}

export async function bulkUpdatePricingRules(
  ruleIds: string[],
  markupType: 'fixed' | 'percentage',
  markupValue: number
): Promise<{ success: boolean; error?: string; updated?: number }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return { success: false, error: 'Not authenticated' }
    }

    // Use admin client to bulk update
    const adminSupabase = createAdminClient()
    
    const { error } = await adminSupabase
      .from('pricing_rules')
      .update({
        markup_type: markupType,
        markup_value: markupValue,
        updated_at: new Date().toISOString(),
      })
      .in('id', ruleIds)

    if (error) {
      console.error('[v0] Error bulk updating pricing rules:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/pricing')
    return { success: true, updated: ruleIds.length }
  } catch (error) {
    console.error('[v0] Error in bulkUpdatePricingRules:', error)
    return { success: false, error: String(error) }
  }
}
