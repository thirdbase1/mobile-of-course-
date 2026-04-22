'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all users with pagination - uses admin client to bypass RLS
export async function getUsers(page: number = 1, limit: number = 10) {
  try {
    const supabase = createAdminClient()

    const offset = (page - 1) * limit

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone_number, wallet_balance, is_admin, created_at')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    const { count, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (usersError) {
      console.error('[v0] Error fetching users:', usersError)
      return { users: [], count: 0, error: usersError.message, totalPages: 0 }
    }

    const totalPages = Math.ceil((count || 0) / limit)

    console.log('[v0] getUsers - Real data:', { totalCount: count, usersReturned: users?.length, page, totalPages })

    return { users: users || [], count: count || 0, error: null, totalPages }
  } catch (err) {
    console.error('[v0] getUsers exception:', err)
    return { users: [], count: 0, error: 'Failed to fetch users', totalPages: 0 }
  }
}

// Get user details
export async function getUserDetails(userId: string) {
  const supabase = createAdminClient()

  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return { user: null, error: error.message }
  }

  // Get user transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  return { user, transactions, error: null }
}

// Credit user wallet
export async function creditUserWallet(userId: string, amount: number, reason: string) {
  console.log('[v0] creditUserWallet called with:', { userId, amount, reason })

  const supabase = await createServerClient()

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()

  if (!adminUser) {
    console.error('[v0] No admin user authenticated')
    return { error: 'Not authenticated' }
  }

  console.log('[v0] Admin user:', adminUser.id)

  // Get current wallet balance - use admin client for profile read
  const adminSupabase = createAdminClient()
  const { data: userProfile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('wallet_balance')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error('[v0] Profile error:', profileError)
    return { error: 'User not found' }
  }

  console.log('[v0] User profile found:', { userId, currentBalance: userProfile.wallet_balance })

  const balanceBefore = userProfile.wallet_balance || 0
  const newBalance = balanceBefore + amount

  console.log('[v0] About to update balance:', { balanceBefore, amount, newBalance })

  // Update wallet - use admin client for profile update
  const { error: updateError } = await adminSupabase
    .from('profiles')
    .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    console.error('[v0] Error updating wallet:', updateError)
    return { error: updateError.message }
  }

  console.log('[v0] Wallet updated successfully')

  // Log transaction - create EXACT same transaction record as Monnify deposit
  // Use admin client to bypass RLS
  const { error: txError } = await adminSupabase.from('transactions').insert({
    user_id: userId,
    transaction_id: `ADMIN_${Date.now()}`,
    category: 'WALLET_FUND',
    service_id: 'admin_credit',
    service_name: 'Admin Credit',
    amount,
    phone: '',
    status: 'SUCCESS',
    description: reason || 'Wallet funded via admin credit',
    balance_before: balanceBefore,
    balance_after: newBalance,
    api_response: JSON.stringify({ admin_id: adminUser.id }),
    created_at: new Date().toISOString(),
    payment_method: 'ADMIN',
  })

  if (txError) {
    console.error('[v0] Error logging transaction:', txError)
  } else {
    console.log('[v0] Transaction logged successfully')
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/transactions')
  
  console.log('[v0] Credit complete, returning success')
  return { success: true, newBalance }
}

// Debit user wallet - only updates balance and logs, does NOT create transaction receipt
export async function debitUserWallet(userId: string, amount: number, reason: string) {
  const supabase = await createServerClient()

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()

  if (!adminUser) {
    return { error: 'Not authenticated' }
  }

  // Get current wallet balance - use admin client for profile read
  const adminSupabase = createAdminClient()
  const { data: userProfile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('wallet_balance')
    .eq('id', userId)
    .single()

  if (profileError) {
    return { error: 'User not found' }
  }

  const balanceBefore = userProfile.wallet_balance || 0
  const newBalance = balanceBefore - amount

  // Prevent negative balance
  if (newBalance < 0) {
    return { error: 'Insufficient balance' }
  }

  // Update wallet - use admin client for profile update
  const { error: updateError } = await adminSupabase
    .from('profiles')
    .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    console.error('[v0] Error updating wallet:', updateError)
    return { error: updateError.message }
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/transactions')
  return { success: true, newBalance }
}

// Toggle admin role
export async function toggleAdminRole(userId: string, isAdmin: boolean) {
  const supabase = await createServerClient()

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()

  if (!adminUser) {
    return { error: 'Not authenticated' }
  }

  // Use admin client for profile update to bypass RLS
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase.from('profiles').update({ is_admin: isAdmin }).eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('admin_logs').insert({
    admin_id: adminUser.id,
    action: 'TOGGLE_ADMIN',
    target_user: userId,
    details: { isAdmin },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

// Get all transactions with pagination - uses admin client to bypass RLS
export async function getTransactions(page: number = 1, limit: number = 20, statusFilter?: string) {
  try {
    const supabase = createAdminClient()

    const offset = (page - 1) * limit

    let query = supabase
      .from('transactions')
      .select('*')

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: transactions, error: txError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { count, error: countError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })

    if (txError) {
      console.error('[v0] Error fetching transactions:', txError)
      return { transactions: [], count: 0, error: txError.message, totalPages: 0 }
    }

    const totalPages = Math.ceil((count || 0) / limit)

    console.log('[v0] getTransactions - Real data:', { totalCount: count, txReturned: transactions?.length, page, totalPages })

    return { transactions: transactions || [], count: count || 0, error: null, totalPages }
  } catch (err) {
    console.error('[v0] getTransactions exception:', err)
    return { transactions: [], count: 0, error: 'Failed to fetch transactions', totalPages: 0 }
  }
}

// Get transaction details
export async function getTransactionDetails(transactionId: string) {
  const supabase = await createServerClient()

  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (error) {
    return { transaction: null, error: error.message }
  }

  return { transaction, error: null }
}

// Create pricing rule
export async function createPricingRule(
  network: string,
  serviceType: string,
  ruleType: 'FIXED' | 'PERCENT',
  value: number,
  minAmount?: number,
  maxAmount?: number
) {
  const supabase = await createServerClient()

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()

  if (!adminUser) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase.from('pricing_rules').insert({
    network,
    service_type: serviceType,
    rule_type: ruleType,
    value,
    min_amount: minAmount,
    max_amount: maxAmount,
    is_active: true,
  })

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('admin_logs').insert({
    admin_id: adminUser.id,
    action: 'CREATE_PRICING_RULE',
    details: { network, serviceType, ruleType, value },
  })

  revalidatePath('/admin/pricing')
  return { success: true, data }
}

// Update pricing rule
export async function updatePricingRule(
  ruleId: string,
  updates: Record<string, any>
) {
  const supabase = await createServerClient()

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()

  if (!adminUser) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('pricing_rules').update(updates).eq('id', ruleId)

  if (error) {
    return { error: error.message }
  }

  // Log action
  await supabase.from('admin_logs').insert({
    admin_id: adminUser.id,
    action: 'UPDATE_PRICING_RULE',
    details: { ruleId, updates },
  })

  revalidatePath('/admin/pricing')
  return { success: true }
}

// Get all admin logs
export async function getAdminLogs(page: number = 1, limit: number = 50) {
  const supabase = await createServerClient()

  const offset = (page - 1) * limit

  const [{ data: logs, error }, { count }] = await Promise.all([
    supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    supabase.from('admin_logs').select('id', { count: 'exact' }).then((res) => ({ count: res.count || 0 })),
  ])

  if (error) {
    return { logs: [], count: 0, error: error.message }
  }

  return { logs, count, totalPages: Math.ceil(count / limit) }
}
