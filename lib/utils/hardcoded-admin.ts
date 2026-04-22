/**
 * Checks if an email is the hardcoded permanent admin
 * This user cannot be removed from admin status
 */
export function isHardcodedAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().trim() === 'admin@mozosubz.xyz'
}
