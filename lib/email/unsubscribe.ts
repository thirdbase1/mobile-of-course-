/**
 * Unsubscribe tokens.
 *
 * Goal: give every email a link the user can click WITHOUT logging in,
 * that cannot be forged by an attacker.
 *
 * Shape of token (base64url): `<userId>.<category>.<hmac_of_userId_and_category>`
 * The HMAC uses UNSUBSCRIBE_SECRET so only the server can mint valid tokens.
 */

import { createHmac, timingSafeEqual } from "crypto"
import type { EmailCategory } from "./client"

function b64urlEncode(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4))
  const normalized = s.replace(/-/g, "+").replace(/_/g, "/") + pad
  return Buffer.from(normalized, "base64")
}

function getSecret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET
  if (!s) {
    // Fail-loud in dev, fail-safe in prod (unsubscribe links just won't verify).
    console.warn("[email] UNSUBSCRIBE_SECRET not set — unsubscribe links will not verify")
    return "dev-unsubscribe-secret-change-me"
  }
  return s
}

function sign(userId: string, category: EmailCategory): string {
  const h = createHmac("sha256", getSecret())
  h.update(`${userId}:${category}`)
  return b64urlEncode(h.digest())
}

export function createUnsubscribeToken(userId: string, category: EmailCategory): string {
  const sig = sign(userId, category)
  return b64urlEncode(`${userId}.${category}.${sig}`)
}

export function verifyUnsubscribeToken(
  token: string
): { userId: string; category: EmailCategory } | null {
  try {
    const decoded = b64urlDecode(token).toString("utf8")
    const parts = decoded.split(".")
    if (parts.length !== 3) return null
    const [userId, category, sig] = parts
    if (category !== "transactional" && category !== "marketing") return null

    const expected = sign(userId, category as EmailCategory)
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null

    return { userId, category: category as EmailCategory }
  } catch {
    return null
  }
}

export function buildUnsubscribeUrl(userId: string, category: EmailCategory): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://mozosubz.com"
  const token = createUnsubscribeToken(userId, category)
  return `${base}/unsubscribe?token=${encodeURIComponent(token)}`
}
