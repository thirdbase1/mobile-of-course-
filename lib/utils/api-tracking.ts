/**
 * SECURITY: API Tracking and Security Logging
 * Tracks all API requests, failed authentication, suspicious activity
 * Logs to console and database for audit trails
 */

import { createAdminClient } from "@/lib/supabase/admin"

export interface APILog {
  endpoint: string
  method: string
  userId?: string
  statusCode: number
  duration: number // milliseconds
  ipAddress: string
  userAgent?: string
  errorMessage?: string
  suspiciousFlag?: boolean
}

/**
 * Log API request to database for audit trail
 */
export async function logAPIRequest(log: APILog): Promise<void> {
  try {
    const supabase = createAdminClient()

    await supabase.from("api_logs").insert({
      endpoint: log.endpoint,
      method: log.method,
      user_id: log.userId || null,
      status_code: log.statusCode,
      duration_ms: log.duration,
      ip_address: log.ipAddress,
      user_agent: log.userAgent || null,
      error_message: log.errorMessage || null,
      suspicious_flag: log.suspiciousFlag || false,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    // Silently fail - don't let logging errors break the app
    // But log to console for debugging
    console.error("[API_LOG] Failed to log API request:", error)
  }
}

/**
 * Track failed authentication attempts (for brute force detection)
 */
export async function logFailedAuth(email: string, ipAddress: string, reason: string): Promise<void> {
  try {
    const supabase = createAdminClient()

    await supabase.from("failed_auth_logs").insert({
      email,
      ip_address: ipAddress,
      reason,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[AUTH_LOG] Failed to log auth attempt:", error)
  }
}

/**
 * Track suspicious activities (injection attempts, invalid parameters, etc)
 */
export async function logSuspiciousActivity(
  ipAddress: string,
  activityType: string,
  details: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    await supabase.from("suspicious_activity_logs").insert({
      ip_address: ipAddress,
      activity_type: activityType,
      details: JSON.stringify(details),
      user_id: userId || null,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[SUSPICIOUS_LOG] Failed to log suspicious activity:", error)
  }
}

/**
 * Get user IP address from request (handles proxies/CDN)
 */
export function getUserIPAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  return request.headers.get("x-real-ip") || "unknown"
}

/**
 * Create middleware wrapper for API tracking
 */
export function withAPITracking(
  handler: (request: Request) => Promise<Response>,
  config: { endpoint: string; requiresAuth?: boolean }
) {
  return async (request: Request): Promise<Response> => {
    const startTime = Date.now()
    const ipAddress = getUserIPAddress(request)
    let userId: string | undefined
    let statusCode = 500

    try {
      const response = await handler(request)
      statusCode = response.status

      // Log successful request
      const duration = Date.now() - startTime
      await logAPIRequest({
        endpoint: config.endpoint,
        method: request.method,
        userId,
        statusCode,
        duration,
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
      })

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Log error
      await logAPIRequest({
        endpoint: config.endpoint,
        method: request.method,
        userId,
        statusCode,
        duration,
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        suspiciousFlag: false,
      })

      throw error
    }
  }
}
