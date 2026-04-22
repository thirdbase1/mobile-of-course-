/**
 * Transaction receipt email.
 *
 * Port of the user-supplied HTML template. Rows are data-driven so the same
 * template serves airtime, data, cable, electricity, wallet funding, and
 * recharge-pin purchases.
 */

import { renderShell, escapeHtml, formatNaira, formatDateTime } from "./shell"

export type TxCategory = "AIRTIME" | "DATA" | "CABLE" | "ELECTRICITY" | "WALLET_FUND" | "RECHARGE_PINS"
export type TxStatus = "SUCCESS" | "FAILED" | "PENDING"

export interface TransactionEmailData {
  firstName: string
  category: TxCategory
  serviceName: string // e.g. "MTN", "DStv", "IKEDC"
  amount: number
  status: TxStatus
  transactionId: string
  reference: string
  paymentMethod: string // e.g. "Wallet", "Bank Transfer"
  createdAt?: Date | string
  actionUrl: string
  unsubscribeUrl: string
  // Optional extras — shown as additional summary rows when present
  extras?: Array<{ label: string; value: string }>
}

function titleFor(category: TxCategory, status: TxStatus): string {
  if (status === "FAILED") return "Transaction Failed"
  if (status === "PENDING") return "Transaction Pending"

  switch (category) {
    case "AIRTIME":
      return "Airtime Purchase Successful"
    case "DATA":
      return "Data Bundle Successful"
    case "CABLE":
      return "Cable Subscription Successful"
    case "ELECTRICITY":
      return "Electricity Payment Successful"
    case "WALLET_FUND":
      return "Wallet Funded Successfully"
    case "RECHARGE_PINS":
      return "Recharge Pins Generated"
    default:
      return "Transaction Successful"
  }
}

function serviceLabel(category: TxCategory): string {
  switch (category) {
    case "AIRTIME":
      return "Airtime"
    case "DATA":
      return "Data Bundle"
    case "CABLE":
      return "Cable Subscription"
    case "ELECTRICITY":
      return "Electricity"
    case "WALLET_FUND":
      return "Wallet Funding"
    case "RECHARGE_PINS":
      return "Recharge Pins"
  }
}

function statusBadge(status: TxStatus): { bg: string; color: string; label: string } {
  if (status === "SUCCESS") return { bg: "#dcfce7", color: "#16a34a", label: "Success" }
  if (status === "PENDING") return { bg: "#fef3c7", color: "#d97706", label: "Pending" }
  return { bg: "#fee2e2", color: "#dc2626", label: "Failed" }
}

function row(label: string, value: string, isLast = false, mono = false): string {
  const border = isLast ? "" : "border-bottom:1px solid #f1f1f1;"
  const fontFamily = mono ? "font-family:monospace;" : ""
  return `
    <tr>
      <td style="padding:16px 20px;${border}color:#6b7280;">${escapeHtml(label)}</td>
      <td align="right" style="padding:16px 20px;${border}font-weight:500;${fontFamily}">${escapeHtml(value)}</td>
    </tr>
  `
}

export function transactionEmail(data: TransactionEmailData): { subject: string; html: string } {
  const title = titleFor(data.category, data.status)
  const badge = statusBadge(data.status)
  const amountColor = data.status === "SUCCESS" ? "#16a34a" : data.status === "PENDING" ? "#d97706" : "#dc2626"
  const when = formatDateTime(data.createdAt || new Date())

  const extrasRows = (data.extras || [])
    .filter((x) => x && x.value)
    .map((x) => row(x.label, x.value))
    .join("")

  const body = `
    <tr>
      <td align="center" style="padding:36px 40px 20px 40px;" class="mobile-padding">
        <h1 style="margin:0;font-size:28px;font-weight:600;color:#111827;">${escapeHtml(title)}</h1>
        <p style="margin:10px 0 0 0;color:#6b7280;font-size:15px;">Hi ${escapeHtml(data.firstName)}, here are the details of your transaction.</p>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding:0 40px 30px 40px;" class="mobile-padding">
        <div style="background:#f9fafb;border-radius:12px;padding:26px;">
          <p style="margin:0;color:#6b7280;font-size:13px;">AMOUNT</p>
          <p style="margin:6px 0 0 0;font-size:34px;font-weight:700;color:${amountColor};">${escapeHtml(formatNaira(data.amount))}</p>
        </div>
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 30px 40px;" class="mobile-padding">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#f9fafb;padding:16px 20px;font-size:13px;color:#6b7280;font-weight:600;">TRANSACTION SUMMARY</td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row("Service", serviceLabel(data.category))}
                ${row("Provider", data.serviceName || "—")}
                ${extrasRows}
                ${row("Payment method", data.paymentMethod)}
                ${row("Date", when)}
                <tr>
                  <td style="padding:16px 20px;color:#6b7280;">Status</td>
                  <td align="right" style="padding:16px 20px;">
                    <span style="background:${badge.bg};color:${badge.color};padding:6px 12px;border-radius:20px;font-size:13px;font-weight:600;">${escapeHtml(badge.label)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 30px 40px;" class="mobile-padding">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#f9fafb;padding:16px 20px;font-size:13px;color:#6b7280;font-weight:600;">REFERENCE DETAILS</td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row("Reference", data.reference, false, true)}
                ${row("Transaction ID", data.transactionId, true, true)}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding:10px 40px 40px 40px;" class="mobile-padding">
        <a href="${escapeHtml(data.actionUrl)}" style="background:#1a56db;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;">View Transaction</a>
      </td>
    </tr>
  `

  const html = renderShell({
    previewText: `${title} — ${formatNaira(data.amount)}`,
    headerSubtitle: "Transaction Receipt",
    bodyHtml: body,
    unsubscribeUrl: data.unsubscribeUrl,
  })

  return {
    subject: `${title} — ${formatNaira(data.amount)}`,
    html,
  }
}
