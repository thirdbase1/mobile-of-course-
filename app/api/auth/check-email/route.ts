import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return Response.json({ available: false, error: 'Invalid email' }, { status: 400 })
    }

    const trimmedEmail = email.toLowerCase().trim()

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return Response.json({ available: false, error: 'Invalid email format' })
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

    // Check Supabase auth.users table directly for duplicate emails (most reliable)
    // This is the actual source of truth - auth.users has unique email constraint
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    let emailExists = false
    
    if (!authError && authUsers?.users) {
      emailExists = authUsers.users.some(u => u.email?.toLowerCase() === trimmedEmail)
    }

    // Also check profiles table as backup
    if (!emailExists) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('email', trimmedEmail)

      if (error) {
        return Response.json({ available: null, error: error.message }, { status: 500 })
      }

      emailExists = (data?.length ?? 0) > 0
    }

    const available = !emailExists

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
