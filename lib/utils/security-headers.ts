/**
 * SECURITY: Comprehensive security headers for all responses
 */
export function withSecurityHeaders(response: Response): Response {
  // Prevent clickjacking attacks
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")
  
  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block")
  
  // Enforce HTTPS (remove in development)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }
  
  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  
  // Prevent sensitive data in URLs
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
  
  // Content Security Policy - restrict where content can be loaded from
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.vercel-analytics.com; frame-ancestors 'self';"
  )
  
  return response
}

/**
 * SECURITY: Rate limiting key generator
 * Uses IP + endpoint path to create unique rate limit keys
 */
export function getRateLimitKey(request: Request, endpoint: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  return `rate_limit:${endpoint}:${ip}`
}

/**
 * SECURITY: Validates required environment variables are set
 */
export function validateRequiredEnvVars(vars: string[]): void {
  const missing = vars.filter(v => !process.env[v])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}

/**
 * SECURITY: Sanitizes error messages to prevent information leakage
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === "development") {
    return error instanceof Error ? error.message : String(error)
  }
  
  // In production, return generic error message
  return "An error occurred. Please try again later."
}

/**
 * SECURITY: Validates UUID format to prevent injection
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}
