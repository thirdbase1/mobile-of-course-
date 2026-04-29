import { createClient } from "@supabase/supabase-js"

// Run at the edge for low-latency availability checks.
export const runtime = "edge"
export const dynamic = "force-dynamic"

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return Response.json({ available: false, error: "Invalid email" }, { status: 400 })
    }

    const trimmedEmail = email.toLowerCase().trim()

    if (!EMAIL_RX.test(trimmedEmail)) {
      return Response.json({ available: false, error: "Invalid email format" })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      // Fail CLOSED: refuse to confirm availability if we can't actually check.
      return Response.json({ available: false, error: "Server config error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })

    // Single indexed lookup against `profiles` (uniq_profiles_email_lower).
    // The signup trigger keeps profiles in sync with auth.users, so this
    // is the source of truth and runs in O(1) on the unique index.
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .ilike("email", trimmedEmail)
      .limit(1)

    if (error) {
      // Fail CLOSED so duplicates can't slip through silently.
      return Response.json(
        { available: false, error: "Could not verify email availability" },
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
