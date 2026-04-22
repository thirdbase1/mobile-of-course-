'use client'

import { useEffect, useState } from 'react'

export default function MonnifyDebugPage() {
  const [credentials, setCredentials] = useState({
    apiKey: '',
    secretKey: '',
    contractCode: '',
  })
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch environment variables
    fetch('/api/debug/monnify-credentials')
      .then(res => res.json())
      .then(data => {
        setCredentials(data)
      })
      .catch(err => setStatus(`Error: ${err.message}`))
  }, [])

  const testMonnifyAuth = async () => {
    setLoading(true)
    setStatus('Testing Monnify authentication...')
    
    try {
      const response = await fetch('/api/debug/test-monnify-auth', {
        method: 'POST',
      })
      const data = await response.json()
      setStatus(JSON.stringify(data, null, 2))
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Monnify Debug</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
          <div className="bg-gray-50 p-4 rounded font-mono text-sm space-y-2">
            <p>API Key: <span className="text-red-600">{credentials.apiKey ? '✓ Set' : '✗ Missing'}</span></p>
            <p>Secret Key: <span className="text-red-600">{credentials.secretKey ? '✓ Set' : '✗ Missing'}</span></p>
            <p>Contract Code: <span className="text-red-600">{credentials.contractCode ? '✓ Set' : '✗ Missing'}</span></p>
          </div>
        </div>

        <button
          onClick={testMonnifyAuth}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Authentication'}
        </button>

        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Response</h2>
          <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap break-words">
            {status}
          </pre>
        </div>
      </div>
    </div>
  )
}
