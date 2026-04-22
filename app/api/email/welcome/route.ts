/**
 * POST /api/email/welcome
 *
 * Called from the register page right after supabase.auth.signUp succeeds.
 * Accepts { email, fullName } in the body. We resolve the userId server-side
 * via auth.admin.listUsers so the client never has to pass it (avoids the
 * client being able to spam welcome emails at arbitrary userIds).
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/client"
import { welcomeEmail } from "@/lib/email/templates/welcome"
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe"

export const runtime = "nodejs"

function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://mozosubz.com").replace(/\/$/, "")
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string
      fullName?: string
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : ""

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 })
    }

    const firstName = fullName.split(" ")[0] || email.split("@")[0] || "there"

    // Look up the Supabase userId for this email so the unsubscribe link is
    // properly signed. If we can't find the user yet (signUp is async), we
    // send with a generic unsubscribe link and log — the email still sends.
    let userId: string | undefined
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (url && serviceKey) {
        const admin = createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
        // Search for the user by email. We keep page size small — a newly
        // registered email will be on the first page sorted by created_at desc.
        const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
        const match = data?.users?.find((u) => (u.email || "").toLowerCase() === email)
        if (match) userId = match.id
      }
    } catch (err) {
      console.error("[email] welcome userId lookup failed:", err)
    }

    const base = getAppUrl()
    const unsubscribeUrl = userId
      ? buildUnsubscribeUrl(userId, "marketing")
      : `${base}/unsubscribe`

    const { subject, html } = welcomeEmail({
      firstName,
      dashboardUrl: `${base}/dashboard`,
      unsubscribeUrl,
    })

    // Welcome is marketing, but we want it to always go out for a brand-new
    // signup — sendEmail with `userId: undefined` skips the preference check.
    const result = await sendEmail({
      to: email,
      userId,
      subject,
      html,
      category: "marketing",
      tag: "welcome",
    })

    return NextResponse.json({ ok: true, sent: result.sent })
  } catch (err) {
    console.error("[email] welcome route exception:", err)
    return NextResponse.json({ ok: false }, { status: 200 }) // don't break signup
  }
}
