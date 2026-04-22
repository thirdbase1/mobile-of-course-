import { renderShell, escapeHtml } from "./shell"

export interface WelcomeEmailData {
  firstName: string
  dashboardUrl: string
  unsubscribeUrl: string
}

export function welcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const body = `
    <tr>
      <td align="center" style="padding:36px 40px 10px 40px;" class="mobile-padding">
        <h1 style="margin:0;font-size:28px;font-weight:600;color:#111827;">Welcome to Mozosubz, ${escapeHtml(data.firstName)}</h1>
        <p style="margin:12px 0 0 0;color:#6b7280;font-size:15px;line-height:1.6;">
          Your account is ready. Fund your wallet once, then pay every bill — airtime, data, cable, electricity and recharge pins — in seconds.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 40px 10px 40px;" class="mobile-padding">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#f9fafb;padding:16px 20px;font-size:13px;color:#6b7280;font-weight:600;">WHAT YOU CAN DO</td>
          </tr>
          ${featureRow("Airtime & data", "MTN, Glo, Airtel, 9mobile — every current plan.")}
          ${featureRow("Cable subscriptions", "DStv, GOtv and Startimes renewed in seconds.")}
          ${featureRow("Electricity", "All 12 Nigerian DISCOs. Token shown right after payment.")}
          ${featureRow("Recharge pins", "Print pins in bulk, export as PDF.", true)}
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 40px 10px 40px;" class="mobile-padding">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#1a56db;">FIRST STEP · FUND YOUR WALLET</p>
              <p style="margin:8px 0 0 0;font-size:14px;color:#334155;line-height:1.6;">
                Tap Deposit Funds, enter any amount from ₦100. We generate a one-time bank account — transfer the exact amount and your wallet credits instantly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding:24px 40px 40px 40px;" class="mobile-padding">
        <a href="${escapeHtml(data.dashboardUrl)}" style="background:#1a56db;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;">Go to dashboard</a>
      </td>
    </tr>
  `

  const html = renderShell({
    previewText: `Welcome to Mozosubz — your account is ready.`,
    headerSubtitle: "Welcome aboard",
    bodyHtml: body,
    unsubscribeUrl: data.unsubscribeUrl,
  })

  return {
    subject: "Welcome to Mozosubz",
    html,
  }
}

function featureRow(title: string, desc: string, isLast = false): string {
  const border = isLast ? "" : "border-bottom:1px solid #f1f1f1;"
  return `
    <tr>
      <td style="padding:16px 20px;${border}">
        <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${escapeHtml(title)}</p>
        <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;line-height:1.6;">${escapeHtml(desc)}</p>
      </td>
    </tr>
  `
}
