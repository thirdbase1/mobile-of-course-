import fetch from 'node-fetch'

const API_KEY = process.env.GSUBZ_API_KEY
const API_BASE_URL = 'https://api.gsubz.com'

if (!API_KEY) {
  console.error('[TEST] ERROR: GSUBZ_API_KEY not set')
  process.exit(1)
}

console.log('[TEST] Testing Gsubz API directly')
console.log('[TEST] API Key (last 10):', API_KEY.slice(-10))

const testPayload = {
  network: 'airtel',
  value: '100',
  number: '10',
}

console.log('[TEST] Payload:', testPayload)

// Create FormData
const FormData = require('form-data')
const form = new FormData()
form.append('network', testPayload.network)
form.append('value', testPayload.value)
form.append('number', testPayload.number)

// Make the request
try {
  const response = await fetch(`${API_BASE_URL}/apiV2/generate/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      ...form.getHeaders(),
    },
    body: form,
  })

  console.log('[TEST] Response status:', response.status)
  console.log('[TEST] Response headers:', Object.fromEntries(response.headers))

  const text = await response.text()
  console.log('[TEST] Response body (raw):', text)

  try {
    const data = JSON.parse(text)
    console.log('[TEST] Response body (parsed):')
    console.log(JSON.stringify(data, null, 2))
  } catch (e) {
    console.log('[TEST] Could not parse as JSON')
  }
} catch (error) {
  console.error('[TEST] Request error:', error.message)
  console.error('[TEST] Error details:', error)
}
