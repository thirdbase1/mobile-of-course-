import { createClient } from "@supabase/supabase-js"

// Edge runtime keeps cold starts and round-trips fast.
export const runtime = "edge"
export const dynamic = "force-dynamic"

const USERNAME_RX = /^[a-z0-9_-]+$/

export async function POST(request: Request) {
  try {
    const { username } = await request.json()

    if (!username || typeof username !== "string") {
      return Response.json({ available: false, error: "Invalid username" }, { status: 400 })
    }

    const trimmedUsername = username.toLowerCase().trim()

    if (trimmedUsername.length < 3) {
      return Response.json({ available: false, error: "Username too short" })
    }

    if (!USERNAME_RX.test(trimmedUsername)) {
      return Response.json({ available: false, error: "Invalid characters" })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      // Fail CLOSED so we never accidentally tell the user a username is free
      // when we couldn't actually verify.
      return Response.json({ available: false, error: "Server config error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })

    // Indexed lookup against profiles.username
    // (partial unique index uniq_profiles_username_lower).
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("username", trimmedUsername)
      .limit(1)

    if (error) {
      return Response.json(
        { available: false, error: "Could not verify username" },
        { status: 500 },
      )
    }

    const available = (count ?? 0) === 0

    return Response.json(
      { available, checked: true },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return Response.json({ available: false, error: "Server error" }, { status: 500 })
  }
}
