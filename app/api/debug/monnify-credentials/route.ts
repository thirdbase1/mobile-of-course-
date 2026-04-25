export async function GET() {
  // SECURITY: This debug endpoint is disabled in production to prevent credential leakage
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "Debug endpoints are not available in production" },
      { status: 403 }
    )
  }

  // Only show masked credentials in development for debugging
  return Response.json({
    message: "Debug endpoint - development only",
    apiKey: process.env.MONNIFY_API_KEY ? "***MASKED***" : "NOT_SET",
    secretKey: process.env.MONNIFY_SECRET_KEY ? "***MASKED***" : "NOT_SET",
    contractCode: "***MASKED***",
  })
}
