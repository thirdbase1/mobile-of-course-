"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Register a new device session when user logs in
 * This automatically invalidates other sessions for single-device login
 */
export async function registerDeviceSession(
  deviceFingerprint: string,
  deviceName: string,
  browser: string,
  os: string,
  userAgent: string,
  ipAddress?: string
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[v0] Failed to get user in registerDeviceSession:", userError)
      return {
        success: false,
        error: "Not authenticated",
      }
    }

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error("[v0] Failed to get session in registerDeviceSession:", sessionError)
      return {
        success: false,
        error: "No session found",
      }
    }

    console.log("[v0] Registering device session for user:", user.id)
    console.log("[v0] Device info:", { deviceName, browser, os })

    // Call Supabase RPC to create session and invalidate others
    const { data, error } = await supabase.rpc("create_device_session", {
      user_id: user.id,
      session_id: session.access_token, // Use session token as unique ID
      device_fingerprint: deviceFingerprint,
      device_name: deviceName,
      ip_address: ipAddress || null,
      user_agent: userAgent,
      browser,
      os,
    })

    if (error) {
      console.error("[v0] Failed to register device session:", error)
      return {
        success: false,
        error: error.message || "Failed to register device session",
      }
    }

    console.log("[v0] Device session registered:", data)

    return {
      success: true,
      sessionId: data,
    }
  } catch (error) {
    console.error("[v0] registerDeviceSession error:", error)
    return {
      success: false,
      error: String(error),
    }
  }
}

/**
 * Check if current session is still active
 * Used to detect when user was logged out from another device
 */
export async function checkSessionActive(): Promise<{
  active: boolean
  reason?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("[v0] User not authenticated - session inactive")
      return {
        active: false,
        reason: "Not authenticated",
      }
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.log("[v0] No session found - session inactive")
      return {
        active: false,
        reason: "No session",
      }
    }

    // Check if session is still marked as active in database
    const { data, error } = await supabase.rpc("is_session_active", {
      user_id: user.id,
      session_id: session.access_token,
    })

    if (error) {
      console.error("[v0] Failed to check session active:", error)
      // If we can't check, assume it's still active
      return {
        active: true,
      }
    }

    if (!data) {
      console.log("[v0] Session marked inactive - logged out from another device")
      return {
        active: false,
        reason: "Logged in on another device",
      }
    }

    return {
      active: true,
    }
  } catch (error) {
    console.error("[v0] checkSessionActive error:", error)
    // If there's an error, assume session is active (fail open)
    return {
      active: true,
    }
  }
}

/**
 * End all sessions for current user (on logout)
 */
export async function endAllSessions() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("[v0] User not authenticated - cannot end sessions")
      return {
        success: false,
        error: "Not authenticated",
      }
    }

    const { error } = await supabase.rpc("end_all_user_sessions", {
      user_id: user.id,
    })

    if (error) {
      console.error("[v0] Failed to end all sessions:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log("[v0] All sessions ended for user:", user.id)

    return {
      success: true,
    }
  } catch (error) {
    console.error("[v0] endAllSessions error:", error)
    return {
      success: false,
      error: String(error),
    }
  }
}
