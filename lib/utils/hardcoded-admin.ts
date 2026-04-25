/**
 * SECURITY: Checks if an email is the hardcoded permanent admin
 * This should only be used for initial setup. In production, use database-backed admin roles.
 * The admin email is stored in environment variable ADMIN_EMAIL for better security.
 */
export function isHardcodedAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  
  // Get admin email from environment variable instead of hardcoding
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@mozosubz.xyz"
  
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()
}
