import { createClient } from "@supabase/supabase-js"

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

    let phoneExists = false

    // 1) Primary: profiles.phone_number (digits-only).
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("phone_number", digitsOnly)

    if (error) {
      // Don't silently allow signup if we can't verify. Fail closed.
      return Response.json(
        { available: false, error: "Could not verify phone availability" },
        { status: 500 },
      )
    }

    phoneExists = (count ?? 0) > 0

    // 2) Backup: scan auth.users metadata (covers users created before profiles existed).
    if (!phoneExists) {
      try {
        let page = 1
        const perPage = 1000
        const maxPages = 20
        while (page <= maxPages && !phoneExists) {
          const { data, error: authError } = await supabase.auth.admin.listUsers({ page, perPage })
          if (authError) break
          const users = data?.users ?? []
          phoneExists = users.some((u) => {
            const meta = (u.user_metadata ?? {}) as Record<string, unknown>
            const metaPhone = typeof meta.phone === "string" ? meta.phone : ""
            const candidate = (metaPhone || u.phone || "").replace(/\D/g, "")
            return candidate.length === 11 && candidate === digitsOnly
          })
          if (users.length < perPage) break
          page += 1
        }
      } catch {
        // ignore
      }
    }

    return Response.json(
      { available: !phoneExists, checked: true },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch {
    return Response.json({ available: false, error: "Server error" }, { status: 500 })
  }
}
