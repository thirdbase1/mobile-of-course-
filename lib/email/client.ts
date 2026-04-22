/**
 * UnoSend email client.
 *
 * Design goals:
 *  - Never throws. Email is a side-effect — a failure here must NEVER roll
 *    back a successful wallet credit or purchase.
 *  - Fire-and-forget from the call site. Callers should not `await` this in
 *    a transaction-critical path.
 *  - Respects email_preferences (marketing vs transactional).
 */

import { createClient } from "@supabase/supabase-js"

export type EmailCategory = "transactional" | "marketing"

export interface SendEmailOptions {
  to: string
  userId?: string // used to check email_preferences
  subject: string
  html: string
  category: EmailCategory
  // UnoSend accepts a category/tag for filtering in dashboards.
  tag?: string
}

const UNOSEND_ENDPOINT = "https://api.unosend.co/v1/emails"

function getFromHeader(): string {
  const email = process.env.UNOSEND_FROM_EMAIL
  const name = process.env.UNOSEND_FROM_NAME || "Mozosubz"
  if (!email) return "Mozosubz <no-reply@mozosubz.com>"
  // RFC 5322 display-name format: "Name <email@domain>"
  return `${name} <${email}>`
}

/**
 * Check the email_preferences table for this user and category. If no row
 * exists, we treat the user as opted-in (default).
 *
 * Transactional emails (receipts) are always sent regardless of preference —
 * users have a legal right to receipts. Only marketing is gated.
 */
async function shouldSend(userId: string | undefined, category: EmailCategory): Promise<boolean> {
  // Transactional emails always send.
  if (category === "transactional") return true

  // Marketing without a userId — assume opted in (e.g. welcome email for
  // a brand-new signup whose id we already have).
  if (!userId) return true

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) return true // fail-open on misconfig

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data } = await admin
      .from("email_preferences")
      .select("marketing_enabled")
      .eq("user_id", userId)
      .maybeSingle()

    if (!data) return true // no row → opted in
    return data.marketing_enabled !== false
  } catch (err) {
    console.error("[email] shouldSend lookup failed (failing open):", err)
    return true
  }
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ sent: boolean; skipped?: string }> {
  try {
    const apiKey = process.env.UNOSEND_API_KEY
    if (!apiKey) {
      console.warn("[email] UNOSEND_API_KEY not set — skipping send")
      return { sent: false, skipped: "no_api_key" }
    }

    if (!opts.to || !opts.to.includes("@")) {
      return { sent: false, skipped: "invalid_recipient" }
    }

    const allowed = await shouldSend(opts.userId, opts.category)
    if (!allowed) {
      console.log("[email] user opted out of", opts.category, "— skipping")
      return { sent: false, skipped: "opted_out" }
    }

    const body = {
      from: getFromHeader(),
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      tag: opts.tag || opts.category,
    }

    const res = await fetch(UNOSEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error("[email] UnoSend failed", res.status, text)
      return { sent: false, skipped: `http_${res.status}` }
    }

    return { sent: true }
  } catch (err) {
    console.error("[email] send exception (swallowed):", err)
    return { sent: false, skipped: "exception" }
  }
}
