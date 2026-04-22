export interface DepositRules {
  id: string
  base_fee: number
  percentage_fee: number
  threshold_amount: number
  max_fee: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FeeCalculation {
  depositAmount: number
  processingFee: number
  netAmount: number
  breakdown: string
}

/**
 * Calculate deposit fee based on current rules
 * Logic: If amount < threshold, apply only base_fee
 *        If amount >= threshold, apply base_fee + (percentage_fee * amount)
 *        If max_fee is set, fee cannot exceed max_fee
 */
export function calculateDepositFee(
  depositAmount: number,
  rules: DepositRules
): FeeCalculation {
  const { base_fee, percentage_fee, threshold_amount, max_fee } = rules

  let processingFee: number

  if (depositAmount < threshold_amount) {
    // Below threshold: only base fee
    processingFee = base_fee
  } else {
    // At or above threshold: base fee + percentage fee
    processingFee = base_fee + (depositAmount * (percentage_fee / 100))
  }

  // Apply max fee cap if set
  if (max_fee && processingFee > max_fee) {
    processingFee = max_fee
  }

  const netAmount = depositAmount - processingFee

  // Generate breakdown for display
  let breakdown = ''
  if (depositAmount < threshold_amount) {
    breakdown = `Base fee: ₦${base_fee.toLocaleString()}`
  } else {
    const percentagePortion = depositAmount * (percentage_fee / 100)
    breakdown = `Base: ₦${base_fee.toLocaleString()} + ${percentage_fee}%: ₦${percentagePortion.toLocaleString()}`
    if (max_fee && processingFee === max_fee) {
      breakdown += ` (capped at ₦${max_fee.toLocaleString()})`
    }
  }

  return {
    depositAmount: Math.round(depositAmount * 100) / 100,
    processingFee: Math.round(processingFee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    breakdown,
  }
}
