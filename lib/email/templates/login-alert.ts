/**
 * New-sign-in alert email.
 *
 * Sent every time a user successfully signs in. Shows device, browser, IP and
 * approximate location so the user can immediately spot anything unexpected.
 */

import { renderShell, escapeHtml, formatDateTime } from "./shell"

export interface LoginAlertEmailData {
  firstName: string
  signInAt: Date | string
  ipAddress: string
  device: string // e.g. "Chrome on macOS"
  location?: string // optional, e.g. "Lagos, NG"
  secureAccountUrl: string
  unsubscribeUrl: string
}

function row(label: string, value: string, isLast = false, mono = false): string {
  const border = isLast ? "" : "border-bottom:1px solid #f1f1f1;"
  const fontFamily = mono ? "font-family:monospace;" : ""
  return `
    <tr>
      <td style="padding:16px 20px;${border}color:#6b7280;width:40%;">${escapeHtml(label)}</td>
      <td align="right" style="padding:16px 20px;${border}font-weight:500;color:#111827;${fontFamily}">${escapeHtml(value)}</td>
    </tr>
  `
}

export function loginAlertEmail(data: LoginAlertEmailData): { subject: string; html: string } {
  const when = formatDateTime(data.signInAt)

  const body = `
    <tr>
      <td align="center" style="padding:36px 40px 12px 40px;" class="mobile-padding">
        <h1 style="margin:0;font-size:24px;font-weight:600;color:#111827;">New sign-in to your account</h1>
        <p style="margin:10px 0 0 0;color:#6b7280;font-size:15px;line-height:1.6;">
          Hi ${escapeHtml(data.firstName)}, we noticed a new sign-in to your Mozosubz account. If this was you, you can safely ignore this email.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:16px 40px 24px 40px;" class="mobile-padding">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#f9fafb;padding:16px 20px;font-size:13px;color:#6b7280;font-weight:600;">SIGN-IN DETAILS</td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row("Time", when)}
                ${row("Device", data.device)}
                ${row("IP address", data.ipAddress, !data.location, true)}
                ${data.location ? row("Location", data.location, true) : ""}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 20px 40px;" class="mobile-padding">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;">
          <tr>
            <td style="padding:18px 22px;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#991b1b;">DIDN'T SIGN IN?</p>
              <p style="margin:8px 0 0 0;font-size:14px;color:#7f1d1d;line-height:1.6;">
                If you don't recognise this sign-in, someone may have your password. Change it immediately and review your recent activity.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding:8px 40px 40px 40px;" class="mobile-padding">
        <a href="${escapeHtml(data.secureAccountUrl)}" style="background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;">Secure my account</a>
      </td>
    </tr>
  `

  const html = renderShell({
    previewText: `New sign-in from ${data.device} — ${when}`,
    headerSubtitle: "Security Alert",
    bodyHtml: body,
    unsubscribeUrl: data.unsubscribeUrl,
  })

  return {
    subject: `New sign-in to your Mozosubz account`,
    html,
  }
}
