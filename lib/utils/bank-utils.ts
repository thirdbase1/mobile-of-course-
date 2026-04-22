/**
 * Get bank logo URL based on bank name
 * Maps Monnify bank names to logo URLs
 */
export function getBankLogo(bankName: string | undefined): string | null {
  if (!bankName) return null

  const bankLogoMap: Record<string, string> = {
    'Access Bank': 'https://via.placeholder.com/30?text=Access',
    'First Bank': 'https://via.placeholder.com/30?text=FBN',
    'Guaranty Trust Bank': 'https://via.placeholder.com/30?text=GTB',
    'Zenith Bank': 'https://via.placeholder.com/30?text=Zenith',
    'United Bank for Africa': 'https://via.placeholder.com/30?text=UBA',
    'FCMB': 'https://via.placeholder.com/30?text=FCMB',
    'Standard Chartered Bank': 'https://via.placeholder.com/30?text=SCB',
    'Diamond Bank': 'https://via.placeholder.com/30?text=Diamond',
    'Stanbic IBTC': 'https://via.placeholder.com/30?text=Stanbic',
    'Wema Bank': 'https://via.placeholder.com/30?text=Wema',
    'Polaris Bank': 'https://via.placeholder.com/30?text=Polaris',
    'Ecobank': 'https://via.placeholder.com/30?text=Ecobank',
  }

  // Try exact match first
  if (bankLogoMap[bankName]) {
    return bankLogoMap[bankName]
  }

  // Try partial match
  const lowerBankName = bankName.toLowerCase()
  for (const [key, value] of Object.entries(bankLogoMap)) {
    if (lowerBankName.includes(key.toLowerCase())) {
      return value
    }
  }

  // Return a generic placeholder if no match
  return `https://via.placeholder.com/30?text=${bankName.slice(0, 3).toUpperCase()}`
}

/**
 * Format bank name for display
 */
export function formatBankName(bankName: string | undefined): string {
  if (!bankName) return ''
  return bankName.trim()
}
