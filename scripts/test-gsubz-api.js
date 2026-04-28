import https from 'https'
import FormData from 'form-data'

// Get API key from environment
const API_KEY = process.env.GSUBZ_API_KEY
const API_BASE_URL = 'https://api.gsubz.com'

if (!API_KEY) {
  console.error('ERROR: GSUBZ_API_KEY not set in environment variables')
  process.exit(1)
}

console.log('[TEST] GSUBZ API Key (last 10 chars):', API_KEY.slice(-10))
console.log('[TEST] API Base URL:', API_BASE_URL)

// Test data
const testData = {
  network: 'airtel',
  value: '100',
  number: '10',
}

console.log('[TEST] Request data:', testData)

// Create FormData
const form = new FormData()
form.append('network', testData.network)
form.append('value', testData.value)
form.append('number', testData.number)

// Create the request
const options = {
  hostname: 'api.gsubz.com',
  port: 443,
  path: '/apiV2/generate/',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    ...form.getHeaders(),
  },
}

console.log('[TEST] Request options:', {
  hostname: options.hostname,
  port: options.port,
  path: options.path,
  method: options.method,
  headers: { Authorization: 'Bearer ' + API_KEY.slice(-10) + '...' },
})

const req = https.request(options, (res) => {
  console.log('[TEST] Response status:', res.statusCode)
  console.log('[TEST] Response headers:', res.headers)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('[TEST] Response body:')
    try {
      const parsed = JSON.parse(data)
      console.log(JSON.stringify(parsed, null, 2))
    } catch (e) {
      console.log(data)
    }
  })
})

req.on('error', (error) => {
  console.error('[TEST] Request error:', error)
})

form.pipe(req)
