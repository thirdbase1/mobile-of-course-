import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return Response.json({ available: false, error: "Invalid email" }, { status: 400 })
    }

    const trimmedEmail = email.toLowerCase().trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
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

    let emailExists = false

    // 1) Source of truth: auth.users (Supabase enforces unique email here).
    //    Page through admin.listUsers because each page is capped (default 50, max 1000).
    try {
      let page = 1
      const perPage = 1000
      // Hard cap to prevent runaway loops on huge user bases.
      const maxPages = 20
      while (page <= maxPages) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
        if (error) break
        const users = data?.users ?? []
        if (users.some((u) => (u.email ?? "").toLowerCase() === trimmedEmail)) {
          emailExists = true
          break
        }
        if (users.length < perPage) break
        page += 1
      }
    } catch {
      // fall through to profiles check
    }

    // 2) Backup: profiles table (case-insensitive).
    if (!emailExists) {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .ilike("email", trimmedEmail)

      if (error) {
        // If profiles is missing/broken AND auth check didn't find it, we cannot be sure.
        // Fail CLOSED so the user is forced to try a different email instead of silently
        // letting a duplicate through.
        return Response.json(
          { available: false, error: "Could not verify email availability" },
          { status: 500 },
        )
      }

      emailExists = (count ?? 0) > 0
    }

    return Response.json(
      { available: !emailExists, checked: true },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return Response.json({ available: false, error: "Server error" }, { status: 500 })
  }
}
