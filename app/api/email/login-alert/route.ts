/**
 * POST /api/email/login-alert
 *
 * Called from the login page right after a successful sign-in.
 * Reads IP + user agent from request headers (client can't spoof these to us
 * because the client never has to send them — we read from Next.js headers()).
 *
 * Sends a "new sign-in" security email with: time, device, IP, and a
 * "secure my account" CTA that deep-links to the password change page.
 */

import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/client"
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe"
import { loginAlertEmail } from "@/lib/email/templates/login-alert"

function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://mozosubz.com").replace(/\/$/, "")
}

/**
 * Cheap, dependency-free UA parser. Returns a human-readable device string
 * like "Chrome on Windows" or "Safari on iPhone". Good enough for a
 * security email — not a fingerprint.
 */
function parseUserAgent(ua: string): string {
  if (!ua) return "Unknown device"

  // Browser
  let browser = "Unknown browser"
  if (/Edg\//i.test(ua)) browser = "Edge"
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera"
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome"
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari"
  else if (/Firefox\//i.test(ua)) browser = "Firefox"

  // OS
  let os = "Unknown OS"
  if (/iPhone|iPod/i.test(ua)) os = "iPhone"
  else if (/iPad/i.test(ua)) os = "iPad"
  else if (/Android/i.test(ua)) os = "Android"
  else if (/Windows NT/i.test(ua)) os = "Windows"
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS"
  else if (/Linux/i.test(ua)) os = "Linux"

  return `${browser} on ${os}`
}

function getClientIp(h: Headers): string {
  // Standard proxy headers, in priority order.
  const xff = h.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]!.trim()
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || "Unknown"
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string }
    const email = body.email?.trim()
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 })
    }

    const hdrs = await headers()
    const ip = getClientIp(hdrs)
    const device = parseUserAgent(hdrs.get("user-agent") || "")

    // Resolve the user id (needed for the unsubscribe token + preferences check).
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 })
    }
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Look up the user by email. The auth admin API can list+filter.
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1 })
    if (listErr) {
      console.error("[login-alert] listUsers error:", listErr)
      return NextResponse.json({ ok: true }) // swallow
    }
    // listUsers doesn't filter by email — do a direct lookup via profiles
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, username")
      .eq("email", email)
      .maybeSingle()

    if (!profile) {
      // User row not yet propagated — just don't send. This is a soft-failure.
      return NextResponse.json({ ok: true })
    }

    const firstName =
      (profile.full_name as string | undefined)?.split(" ")[0] ||
      (profile.username as string | undefined) ||
      email.split("@")[0] ||
      "there"

    const base = getAppUrl()
    const { subject, html } = loginAlertEmail({
      firstName,
      signInAt: new Date(),
      ipAddress: ip,
      device,
      secureAccountUrl: `${base}/dashboard/profile`,
      unsubscribeUrl: buildUnsubscribeUrl(profile.id as string, "transactional"),
    })

    await sendEmail({
      to: email,
      userId: profile.id as string,
      subject,
      html,
      category: "transactional",
      tag: "login_alert",
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[login-alert] exception (swallowed):", err)
    // Never surface email errors to the client — they should still be logged in.
    return NextResponse.json({ ok: true })
  }
}
