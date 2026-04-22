import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { username } = await request.json()

    if (!username || typeof username !== 'string') {
      return Response.json({ available: false, error: 'Invalid username' }, { status: 400 })
    }

    const trimmedUsername = username.toLowerCase().trim()

    // Basic format validation
    if (trimmedUsername.length < 3) {
      return Response.json({ available: false, error: 'Username too short' })
    }

    if (!/^[a-z0-9_-]+$/.test(trimmedUsername)) {
      return Response.json({ available: false, error: 'Invalid characters' })
    }

    // Create service role client for secure checking (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[USERNAME CHECK] Missing env vars')
      return Response.json({ available: null, error: 'Server config error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    // Check if username exists in profiles table
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('username', trimmedUsername)

    if (error) {
      console.error('[USERNAME CHECK] Database error:', error.message)
      return Response.json({ available: null, error: error.message }, { status: 500 })
    }

    // Username is available if count is 0, taken if count > 0
    const available = count === 0

    console.log('[USERNAME CHECK] Checked username:', trimmedUsername, 'available:', available, 'count:', count)

    return Response.json({ 
      available,
      checked: true
    }, { 
      headers: { 'Cache-Control': 'no-cache' }
    })
  } catch (error) {
    console.error('[USERNAME CHECK] Exception:', error)
    return Response.json({ available: null, error: 'Server error' }, { status: 500 })
  }
}
