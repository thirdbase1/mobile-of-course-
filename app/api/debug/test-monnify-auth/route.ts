export async function POST() {
  const API_KEY = process.env.MONNIFY_API_KEY || ''
  const SECRET_KEY = process.env.MONNIFY_SECRET_KEY || ''
  
  // Per Monnify docs: Auth endpoint is production, API calls use sandbox
  const MONNIFY_AUTH_URL = 'https://api.monnify.com/api/v1/auth/login'

  try {
    if (!API_KEY || !SECRET_KEY) {
      return Response.json({
        success: false,
        error: 'Missing credentials',
        hasApiKey: !!API_KEY,
        hasSecretKey: !!SECRET_KEY,
      })
    }

    const credentials = Buffer.from(`${API_KEY}:${SECRET_KEY}`).toString('base64')
    
    console.log('[DEBUG] Attempting auth to:', MONNIFY_AUTH_URL)
    
    const response = await fetch(MONNIFY_AUTH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const data = await response.json()

    return Response.json({
      success: response.ok,
      status: response.status,
      authUrl: MONNIFY_AUTH_URL,
      credentialsFormat: 'API_KEY:SECRET_KEY',
      hasAccessToken: !!data.responseBody?.accessToken,
      responseMessage: data.responseMessage,
      response: data,
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
