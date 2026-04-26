/**
 * SECURITY: Hardcoded admin email
 * This is the admin email address - only this account has admin access
 */
const HARDCODED_ADMIN_EMAIL = 'admin@mozosubz.xyz'

/**
 * Checks if an email belongs to an admin
 * Uses hardcoded email for production security
 */
export function isHardcodedAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().trim() === HARDCODED_ADMIN_EMAIL.toLowerCase().trim()
}

/**
 * Get the hardcoded admin email
 */
export function getAdminEmail(): string {
  return HARDCODED_ADMIN_EMAIL
}

