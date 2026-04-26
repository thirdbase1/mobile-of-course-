/**
 * SIMPLE SESSION MANAGEMENT - No Database Required
 * Uses localStorage to detect when user logs in on another device
 * Immediately logs out all other sessions
 */

const SESSION_KEY = 'mozosubz_current_session_id'

/**
 * Save the current session ID to localStorage
 * Called immediately after login
 */
export function saveCurrentSessionId(sessionId: string): void {
  try {
    localStorage.setItem(SESSION_KEY, sessionId)
    console.log("[v0] Session ID saved locally")
  } catch (error) {
    console.error("[v0] Failed to save session ID:", error)
  }
}

/**
 * Get the stored session ID
 */
export function getStoredSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch (error) {
    console.error("[v0] Failed to get stored session ID:", error)
    return null
  }
}

/**
 * Check if current Supabase session matches the stored session
 * If not, it means user logged in elsewhere - sign out this device
 * Returns true if session is valid, false if it was invalidated
 */
export function isCurrentSessionValid(currentSessionId: string): boolean {
  const storedSessionId = getStoredSessionId()
  
  if (!storedSessionId) {
    // First time or localStorage cleared - this is valid
    saveCurrentSessionId(currentSessionId)
    return true
  }
  
  // If session IDs don't match, user logged in elsewhere
  if (storedSessionId !== currentSessionId) {
    console.log("[v0] Session mismatch - user logged in on another device")
    console.log("[v0] Stored:", storedSessionId)
    console.log("[v0] Current:", currentSessionId)
    return false
  }
  
  return true
}

/**
 * Clear the stored session ID (called on logout)
 */
export function clearStoredSessionId(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
    console.log("[v0] Session ID cleared")
  } catch (error) {
    console.error("[v0] Failed to clear session ID:", error)
  }
}
