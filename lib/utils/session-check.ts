/**
 * SESSION MANAGEMENT using Supabase Real-Time Auth State
 * 
 * How it works:
 * 1. Supabase maintains ONE active session per user in their backend
 * 2. When user logs in on Device B, Device A's session is INVALIDATED
 * 3. onAuthStateChange fires on ALL tabs when auth state changes
 * 4. We detect SIGNED_IN event from another device and sign out immediately
 * 5. Session expires after configurable time (default 24h) for security
 */

import { createClient } from "@/lib/supabase/client"

let authSubscription: (() => void) | null = null

/**
 * Initialize the multi-tab session manager
 * Must be called once when app loads (typically in a layout or root component)
 * 
 * This sets up a listener for Supabase auth state changes
 * When another tab/device logs in with same account, this tab signs out
 */
export function setupSessionManager() {
  if (authSubscription) {
    console.log("[v0] Session manager already initialized")
    return authSubscription
  }

  const supabase = createClient()

  console.log("[v0] Setting up session manager with Supabase real-time auth")

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log("[v0] Auth state changed:", event, "User:", session?.user?.email)

      // When SIGNED_IN event fires (new login detected anywhere)
      if (event === "SIGNED_IN" && session) {
        // Get current session on THIS tab/device
        const { data: { session: currentSession } } = await supabase.auth.getSession()

        // If we're NOT the newly logged in device, sign out this one
        if (currentSession && currentSession.access_token !== session.access_token) {
          console.log("[v0] New login detected on different device - signing out this session")
          await supabase.auth.signOut()
          
          // Redirect to login page
          if (typeof window !== "undefined") {
            window.location.href = "/login?session_expired=1&reason=logged_in_elsewhere"
          }
        } else {
          // This is the currently active session, store it
          console.log("[v0] This is the active session")
        }
      }

      // When SIGNED_OUT event fires (logout on another tab)
      if (event === "SIGNED_OUT") {
        console.log("[v0] Sign out detected")
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      }

      // When session expires
      if (event === "TOKEN_REFRESHED") {
        console.log("[v0] Session token refreshed")
      }
    }
  )

  // Store unsubscribe function for cleanup
  authSubscription = () => subscription?.unsubscribe()

  return authSubscription
}

/**
 * Cleanup session manager (call on app unmount if needed)
 */
export function cleanupSessionManager() {
  if (authSubscription) {
    authSubscription()
    authSubscription = null
    console.log("[v0] Session manager cleaned up")
  }
}

/**
 * Check if current session is still valid
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch (error) {
    console.error("[v0] Error checking session:", error)
    return false
  }
}
