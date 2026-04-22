'use server'

import { createClient } from '@/lib/supabase/server'

export type ServiceType = 'MTN_DATA' | 'AIRTEL_DATA' | 'GLO_DATA' | '9MOBILE_DATA' | 'DSTV' | 'GOTV' | 'STARTIMES' | 'ELECTRICITY'

export interface PricingRule {
  id: string
  service_type: ServiceType
  service_id: string
  plan_name: string
  base_price: number
  markup_type: 'fixed' | 'percentage'
  markup_value: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ServicePrice {
  service_id: string
  plan_name: string
  base_price: number
  markup: number
  final_price: number
  display_name: string
}

// Available services excluding airtime and recharge pins
export const AVAILABLE_SERVICES = [
  { id: 'mtn', name: 'MTN', type: 'DATA' },
  { id: 'airtel', name: 'Airtel', type: 'DATA' },
  { id: 'glo', name: 'Glo', type: 'DATA' },
  { id: 'etisalat', name: '9mobile', type: 'DATA' },
  { id: 'dstv', name: 'DSTV', type: 'CABLE' },
  { id: 'gotv', name: 'GOTV', type: 'CABLE' },
  { id: 'startimes', name: 'Startimes', type: 'CABLE' },
  { id: 'electricity', name: 'Electricity', type: 'ELECTRICITY' },
]

// Server-side pricing calculation (for transactions)
export async function calculateFinalPrice(basePrice: number, pricingRule: PricingRule | null): Promise<number> {
  if (!pricingRule) return basePrice

  if (pricingRule.markup_type === 'fixed') {
    return basePrice + pricingRule.markup_value
  } else {
    // Percentage markup
    return basePrice * (1 + pricingRule.markup_value / 100)
  }
}

// Get pricing rules for a specific service from database
export async function getPricingRulesForService(serviceId: string): Promise<PricingRule[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching pricing rules:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[v0] Error in getPricingRulesForService:', error)
    return []
  }
}

// Get all active pricing rules
export async function getAllPricingRules(): Promise<PricingRule[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true)
      .order('service_id', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching all pricing rules:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[v0] Error in getAllPricingRules:', error)
    return []
  }
}

// Client-side pricing calculation (for display purposes)
export function calculatePricingClient(basePrice: number, markupType?: string, markupValue?: number): number {
  if (!markupType || markupValue === undefined) return basePrice

  if (markupType === 'fixed') {
    return basePrice + markupValue
  } else {
    return basePrice * (1 + markupValue / 100)
  }
}
