"use server"

import { generateRechargePins as generatePinsAPI } from "@/lib/api/gsubz"
import { createClient } from "@/lib/supabase/server"
import { atomicDeductWallet } from "@/lib/utils/save-transaction"
import { sendEmail } from "@/lib/email/client"
import { renderShell, escapeHtml, formatNaira, formatDateTime } from "@/lib/email/templates/shell"

export async function generateRechargePins(data: { network: string; value: string; number: string }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to generate pins",
      }
    }

    // Check wallet balance
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", user.id).single()

    const totalCost = Number(data.value) * Number(data.number)

    if (!profile || profile.wallet_balance < totalCost) {
      return {
        success: false,
        error: `Insufficient wallet balance. You need ₦${totalCost.toLocaleString()} but your balance is ₦${(profile?.wallet_balance || 0).toLocaleString()}`,
      }
    }

    // Call Gsubz API to generate pins
    const response = await generatePinsAPI({
      network: data.network.toLowerCase(), // Gsubz expects: airtel, glo, 9mobile, mtn (all lowercase)
      value: data.value, // Gsubz expects: "100", "200", "400", "500"
      number: data.number, // Gsubz expects: "10", "20", etc as string
    })

    // Handle Gsubz API response - can be status "success" or "error"
    if (!response) {
      return {
        success: false,
        error: "No response from pin generation service. Please try again.",
      }
    }

    if (response.status === "error" || response.status !== "success") {
      return {
        success: false,
        error: response?.message || response?.title || "Failed to generate pins from Gsubz API. Please try again.",
      }
    }

    if (response.status === "success" && response.pins && Array.isArray(response.pins)) {
      // Deduct from wallet atomically
      try {
        await atomicDeductWallet(user.id, totalCost)
      } catch (walletError) {
        return {
          success: false,
          error: "Failed to deduct from wallet. Please try again.",
        }
      }

      const transactionId = response.id || "TXN" + Date.now()
      const pinsArray = response.pins || []

      const transactionData = {
        user_id: user.id,
        transaction_id: transactionId,
        amount: totalCost,
        service_name: "Recharge Pins",
        service_id: data.network.toLowerCase(),
        description: `${data.network.toUpperCase()} Recharge Pins - ${data.number} x ₦${data.value}`,
        phone: "",
        status: "success",
        api_response: JSON.stringify(response),
      }

      await supabase.from("transactions").insert(transactionData)

      // Send email with pins
      try {
        const recipient = user.email || "User"
        const html = buildRechargePinsEmailHtml({
          network: data.network.toUpperCase(),
          value: Number(data.value),
          quantity: Number(data.number),
          totalAmount: totalCost,
          pins: pinsArray,
          transactionId,
        })

        await sendEmail({
          to: recipient,
          userId: user.id,
          subject: `Your ${data.network.toUpperCase()} Recharge Pins - ${pinsArray.length} pins`,
          html,
          category: "transactional",
          tag: "recharge_pins",
        })
      } catch (emailErr) {
        // Email failure shouldn't block success response
      }

      return {
        success: true,
        message: response.message,
        pins: pinsArray,
        delivered: response.delivered,
        pending: response.pending,
        transactionId,
      }
    } else {
      return {
        success: false,
        error: response?.message || "Failed to generate pins. Invalid response from service.",
      }
    }
  } catch (error) {
    return {
      success: false,
      error: "An error occurred while processing your request. Please try again or contact support.",
    }
  }
}

function buildRechargePinsEmailHtml(data: {
  network: string
  value: number
  quantity: number
  totalAmount: number
  pins: Array<{ pin: string; [key: string]: any }>
  transactionId: string
}): string {
  const pinsHtml = data.pins
    .map(
      (p, i) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f1f1;font-family:monospace;font-weight:600;color:#1a56db;">
        ${i + 1}. ${escapeHtml(p.pin || "")}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f1f1;text-align:right;color:#6b7280;font-size:13px;">
        ₦${escapeHtml(data.value.toString())}
      </td>
    </tr>
  `
    )
    .join("")

  const bodyHtml = `
    <tr>
      <td align="center" style="padding:36px 40px 20px 40px;">
        <h1 style="margin:0;font-size:28px;font-weight:600;color:#111827;">Recharge Pins Generated</h1>
        <p style="margin:10px 0 0 0;color:#6b7280;font-size:15px;">Your ${data.network} recharge pins are ready to use.</p>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding:0 40px 30px 40px;">
        <div style="background:#f9fafb;border-radius:12px;padding:26px;">
          <p style="margin:0;color:#6b7280;font-size:13px;">TOTAL AMOUNT CHARGED</p>
          <p style="margin:6px 0 0 0;font-size:34px;font-weight:700;color:#16a34a;">${escapeHtml(formatNaira(data.totalAmount))}</p>
        </div>
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 30px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#f9fafb;padding:16px 20px;font-size:13px;color:#6b7280;font-weight:600;">ORDER DETAILS</td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #f1f1f1;color:#6b7280;">Network</td>
                  <td align="right" style="padding:12px 16px;border-bottom:1px solid #f1f1f1;font-weight:500;">${escapeHtml(data.network)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #f1f1f1;color:#6b7280;">Pin Value</td>
                  <td align="right" style="padding:12px 16px;border-bottom:1px solid #f1f1f1;font-weight:500;">₦${escapeHtml(data.value.toString())}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;color:#6b7280;">Quantity</td>
                  <td align="right" style="padding:12px 16px;font-weight:500;">${escapeHtml(data.quantity.toString())} pins</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 30px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#f9fafb;padding:16px 20px;font-size:13px;color:#6b7280;font-weight:600;">YOUR RECHARGE PINS (${escapeHtml(data.quantity.toString())} pins)</td>
          </tr>
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${pinsHtml}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:0 40px 30px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#f9fafb;padding:16px 20px;font-size:13px;color:#6b7280;font-weight:600;">TRANSACTION ID</td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-family:monospace;font-weight:600;color:#111827;">${escapeHtml(data.transactionId)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding:10px 40px 40px 40px;">
        <p style="margin:0;color:#6b7280;font-size:13px;">Keep this email for your records. Do not share your pins with anyone.</p>
      </td>
    </tr>
  `

  return renderShell({
    previewText: `${data.quantity} ${data.network} recharge pins - ₦${formatNaira(data.totalAmount)}`,
    headerSubtitle: "Recharge Pins Receipt",
    bodyHtml,
    unsubscribeUrl: "",
  })
}

