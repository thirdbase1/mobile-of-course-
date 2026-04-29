import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEVICE_COOKIE = "mz_device"

/**
 * Force-logout the current Supabase session and clear the device cookie.
 * Used when the proxy detects this device is no longer the user's active device.
 */
export async function GET(req: NextRequest) {
  const reason = req.nextUrl.searchParams.get("reason") || "device"

  try {
    const supabase = await createServerClient()
    await supabase.auth.signOut().catch(() => {})
  } catch {
    // ignore
  }

  const cookieStore = await cookies()
  cookieStore.delete(DEVICE_COOKIE)

  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.search = `?reason=${encodeURIComponent(reason)}`
  return NextResponse.redirect(url)
}
