/**
 * SECURITY: Validates and restricts cross-origin requests
 * Only allows requests from our own domain
 */
export function validateCORSOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true // Same-origin requests have no Origin header

  // Allow only our own domain
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || "https://mozosubz.xyz",
    "http://localhost:3000", // Development
    "http://localhost:3001",
  ].filter(Boolean)

  return allowedOrigins.some(allowed => origin === allowed)
}

/**
 * SECURITY: Sets CORS headers for same-origin requests only
 */
export function setCORSHeaders(response: Response, allowOrigin = false): Response {
  if (allowOrigin) {
    response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "https://mozosubz.xyz")
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  response.headers.set("Access-Control-Max-Age", "86400") // 24 hours
  return response
}

/**
 * SECURITY: Handle CORS preflight requests
 */
export function handleCORSPreflight(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    const allowed = validateCORSOrigin(request)
    return setCORSHeaders(new Response(null, { status: 204 }), allowed)
  }
  return null
}
