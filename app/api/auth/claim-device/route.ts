import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomUUID } from "node:crypto"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const DEVICE_COOKIE = "mz_device"

/**
 * Claim this device as the user's currently-active device.
 *
 * Generates a fresh device id, stores it on the user's profile, and sets it
 * as an httpOnly cookie. Any device whose cookie no longer matches will be
 * force-logged-out by the proxy on its next protected-route request.
 */
export async function POST() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 })
    }

    const deviceId = randomUUID()
    const admin = createAdminClient()

    // Service-role write so RLS on profiles never blocks this update.
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        active_device_id: deviceId,
        active_device_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })
    }

    const cookieStore = await cookies()
    cookieStore.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
