/**
 * Shared email shell (header + footer) used by every template.
 *
 * Based directly on the user-supplied Mozosubz receipt design. All colors,
 * spacing, and structural choices match that template so branding stays
 * consistent across every email type.
 */

const LOGO_URL =
  "https://unosend-logos.s3.ap-south-1.amazonaws.com/images/8632486f-8679-460e-adb7-121719ffd8d1/3c6320ad.svg"

export interface ShellOptions {
  previewText: string
  headerSubtitle: string
  bodyHtml: string
  unsubscribeUrl: string
}

export function renderShell(opts: ShellOptions): string {
  const { previewText, headerSubtitle, bodyHtml, unsubscribeUrl } = opts

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mozosubz</title>
  <style>
    @media screen and (max-width:600px){
      .container{width:100%!important}
      .mobile-padding{padding:24px!important}
      .mobile-center{text-align:center!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f2f5fb;font-family:'DM Sans',-apple-system,Arial,Helvetica,sans-serif;">

<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(previewText)}</span>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5fb;padding:30px 10px;">
<tr><td align="center">

<table width="600" class="container" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 18px 45px rgba(0,0,0,0.08);">

  <tr>
    <td align="center" style="background:linear-gradient(135deg,#1a56db,#3b82f6);padding:40px 30px;">
      <img src="${LOGO_URL}" width="160" alt="Mozosubz" style="display:block;margin:auto;">
      <p style="margin:16px 0 0 0;color:#e0e7ff;font-size:14px;">${escapeHtml(headerSubtitle)}</p>
    </td>
  </tr>

  ${bodyHtml}

  <tr>
    <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:32px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#6b7280;">© Mozosubz</p>
      <p style="margin:8px 0 0 0;font-size:12px;color:#9ca3af;">Airtime, data, cable, electricity — all in one place at the best rates.</p>
      <p style="margin-top:12px;font-size:12px;">
        <a href="${escapeAttr(unsubscribeUrl)}" style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
      </p>
    </td>
  </tr>

</table>

</td></tr>
</table>

</body>
</html>`
}

export function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function escapeAttr(s: string): string {
  return escapeHtml(s)
}

export function formatNaira(n: number): string {
  return `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDateTime(d: Date | string = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}
