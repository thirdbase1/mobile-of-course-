/**
 * SECURITY: Hardcoded admin emails
 * Only these accounts have admin access
 */
const HARDCODED_ADMIN_EMAILS = [
  'admin@mozosubz.xyz',
  'alfredjames0852@gmail.com',
]

/**
 * Checks if an email belongs to an admin
 * Uses hardcoded emails for production security
 */
export function isHardcodedAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const normalizedEmail = email.toLowerCase().trim()
  return HARDCODED_ADMIN_EMAILS.some(
    (adminEmail) => adminEmail.toLowerCase().trim() === normalizedEmail
  )
}

/**
 * Get all hardcoded admin emails
 */
export function getAdminEmails(): string[] {
  return HARDCODED_ADMIN_EMAILS
}

/**
 * Get the first (primary) hardcoded admin email
 */
export function getAdminEmail(): string {
  return HARDCODED_ADMIN_EMAILS[0]
}

