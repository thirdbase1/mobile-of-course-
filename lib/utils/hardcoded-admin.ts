/**
 * SECURITY: Retrieves admin email from environment variable ONLY
 * No hardcoded defaults allowed - must be explicitly set in production
 */
export function getAdminEmail(): string {
  const adminEmail = process.env.ADMIN_EMAIL
  
  if (!adminEmail || adminEmail.trim() === '') {
    throw new Error('ADMIN_EMAIL environment variable is not set. This is required for production.')
  }
  
  return adminEmail.toLowerCase().trim()
}

/**
 * Checks if an email belongs to an admin (must be explicitly configured in env)
 */
export function isHardcodedAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  
  try {
    const adminEmail = getAdminEmail()
    return email.toLowerCase().trim() === adminEmail
  } catch {
    // If env var is not set, return false (no admin email configured)
    return false
  }
}
