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

    let phoneExists = false

    // Check if phone exists in profiles table
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('phone_number', trimmedPhone)

    if (error) {
      return Response.json({ available: null, error: error.message }, { status: 500 })
    }

    // Phone is taken if count > 0
    phoneExists = (count ?? 0) > 0

    // Also check in auth users metadata as backup
    if (!phoneExists) {
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
        
        if (!authError && authUsers?.users) {
          phoneExists = authUsers.users.some(u => {
            const userPhone = u.user_metadata?.phone || u.phone
            return userPhone && userPhone.replace(/\D/g, '') === digitsOnly
          })
        }
      } catch (err) {
        // Silent fail - continue with profiles check
      }
    }

    const available = !phoneExists

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

