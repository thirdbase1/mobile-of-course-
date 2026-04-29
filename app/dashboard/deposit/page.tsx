import { getDepositRules } from "@/lib/actions/deposit-rules"
import { DepositClient } from "@/components/deposit-client"

/**
 * Server-rendered deposit page.
 *
 * The active deposit_rules row is fetched on the server before any HTML is
 * sent, so the form is fully interactive on first paint — no "Loading…"
 * button, no skeleton on the "you will receive" line.
 *
 * Realtime + silent polling fallback for admin fee changes lives inside
 * <DepositClient />.
 */
export default async function DepositPage() {
  const initialRules = await getDepositRules()

  return <DepositClient initialRules={initialRules} />
}
