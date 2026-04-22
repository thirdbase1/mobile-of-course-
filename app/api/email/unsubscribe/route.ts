/**
 * POST /api/email/unsubscribe
 *
 * Body: { token: string, category?: "transactional" | "marketing" | "all", resubscribe?: boolean }
 *
 * Verifies the signed token and upserts the email_preferences row. No login
 * required — the HMAC-signed token is the authorization.
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      token?: string
      category?: "transactional" | "marketing" | "all"
      resubscribe?: boolean
    }

    const token = typeof body.token === "string" ? body.token : ""
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 })
    }

    const verified = verifyUnsubscribeToken(token)
    if (!verified) {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 })
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Decide what to flip. Default: scope to the category embedded in the
    // signed token. "all" requires the link-side category to have been
    // marketing (reasonable default — transactional links only adjust
    // transactional; a separate toggle is provided in the UI).
    const target = body.category || verified.category
    const enabled = body.resubscribe === true

    const patch: Record<string, unknown> = {
      user_id: verified.userId,
      updated_at: new Date().toISOString(),
    }
    if (target === "all") {
      patch.transactional_enabled = enabled
      patch.marketing_enabled = enabled
    } else if (target === "transactional") {
      patch.transactional_enabled = enabled
    } else {
      patch.marketing_enabled = enabled
    }

    const { error } = await admin.from("email_preferences").upsert(patch, { onConflict: "user_id" })
    if (error) {
      console.error("[email] unsubscribe upsert failed:", error)
      return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, category: target, enabled })
  } catch (err) {
    console.error("[email] unsubscribe route exception:", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
