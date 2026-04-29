import { createClient } from "@supabase/supabase-js"

// Run at the edge for low-latency availability checks.
export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || typeof phone !== "string") {
      return Response.json({ available: false, error: "Invalid phone" }, { status: 400 })
    }

    const digitsOnly = phone.replace(/\D/g, "")
    if (digitsOnly.length !== 11) {
      return Response.json({ available: false, error: "Phone must be exactly 11 digits" })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      // Fail CLOSED.
      return Response.json({ available: false, error: "Server config error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })

    // Single indexed lookup against profiles.phone_number
    // (partial unique index uniq_profiles_phone_number).
    // The signup trigger keeps profiles in sync with auth.users, so we no
    // longer have to scan auth.admin.listUsers on every keystroke.
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("phone_number", digitsOnly)
      .limit(1)

    if (error) {
      // Fail CLOSED so we never silently accept a duplicate.
      return Response.json(
        { available: false, error: "Could not verify phone availability" },
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
