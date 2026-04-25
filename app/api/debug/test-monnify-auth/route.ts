export async function POST() {
  // SECURITY: This debug endpoint is disabled in production to prevent credential testing
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "Debug endpoints are not available in production" },
      { status: 403 }
    )
  }

  const API_KEY = process.env.MONNIFY_API_KEY || ""
  const SECRET_KEY = process.env.MONNIFY_SECRET_KEY || ""

  try {
    if (!API_KEY || !SECRET_KEY) {
      return Response.json({
        success: false,
        error: "Missing credentials - check environment variables",
        hasApiKey: !!API_KEY,
        hasSecretKey: !!SECRET_KEY,
      })
    }

    const credentials = Buffer.from(`${API_KEY}:${SECRET_KEY}`).toString("base64")

    const MONNIFY_AUTH_URL = "https://api.monnify.com/api/v1/auth/login"

    const response = await fetch(MONNIFY_AUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })

    const data = await response.json()

    return Response.json({
      success: response.ok,
      status: response.status,
      responseMessage: data.responseMessage,
      // SECURITY: Never return the actual credentials or tokens in response
      message: response.ok ? "Auth successful" : "Auth failed",
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Authentication test failed",
      },
      { status: 500 }
    )
  }
}
