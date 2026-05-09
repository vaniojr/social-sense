import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState<string>('Checking backend...')
  const [apiHealthy, setApiHealthy] = useState<boolean>(false)

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health')
        if (response.ok) {
          const data = await response.json()
          setStatus(`✅ Backend is running! Status: ${data.status}`)
          setApiHealthy(true)
        } else {
          setStatus('❌ Backend returned an error')
          setApiHealthy(false)
        }
      } catch (error) {
        setStatus('❌ Could not connect to backend. Make sure it\'s running on http://localhost:5000')
        setApiHealthy(false)
      }
    }

    checkBackend()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
            Social Sense
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Real-time Opinion Intelligence Platform
          </p>

          <div className={`p-4 rounded-lg mb-6 ${apiHealthy ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={`text-center ${apiHealthy ? 'text-green-700' : 'text-red-700'}`}>
              {status}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Frontend Status</h3>
              <p className="text-sm text-gray-600">✅ React is running on localhost:3000</p>
            </div>

            <div className={`p-3 rounded border ${apiHealthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className="font-semibold text-gray-700 mb-2">Backend Status</h3>
              <p className={`text-sm ${apiHealthy ? 'text-green-700' : 'text-red-700'}`}>
                {apiHealthy ? '✅ Backend is running on localhost:5000' : '❌ Backend is not running'}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Database Status</h3>
              <p className="text-sm text-gray-600">Check pgAdmin at http://localhost:5050</p>
              <p className="text-xs text-gray-500 mt-1">Email: admin@example.com | Password: admin</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Check SETUP_LOCAL.md for detailed instructions</li>
              <li>2. Setup your backend in src/backend/</li>
              <li>3. Start building features!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
