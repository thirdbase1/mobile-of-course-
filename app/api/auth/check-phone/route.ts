import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || typeof phone !== 'string') {
      return Response.json({ available: false, error: 'Invalid phone' }, { status: 400 })
    }

    const trimmedPhone = phone.trim()

    // Basic phone validation (10+ digits)
    const digitsOnly = trimmedPhone.replace(/\D/g, '')
    if (digitsOnly.length < 10) {
      return Response.json({ available: false, error: 'Phone too short' })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({ available: null, error: 'Server config error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    // Check if phone exists in profiles table
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('phone_number', trimmedPhone)

    if (error) {
      return Response.json({ available: null, error: error.message }, { status: 500 })
    }

    // Phone is available if count is 0, taken if count > 0
    const available = count === 0

    return Response.json({ 
      available,
      checked: true
    }, { 
      headers: { 'Cache-Control': 'no-cache' }
    })
  } catch (error) {
    return Response.json({ available: null, error: 'Server error' }, { status: 500 })
  }
}
