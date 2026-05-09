import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { GeoAnalysis } from './pages/GeoAnalysis'

function Dashboard() {
  const [status, setStatus] = useState<string>('Checking backend...')
  const [apiHealthy, setApiHealthy] = useState<boolean>(false)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/health`)
        if (response.ok) {
          const data = await response.json()
          setStatus(`✅ Backend is running! Status: ${data.status}`)
          setApiHealthy(true)
        } else {
          setStatus('❌ Backend returned an error')
          setApiHealthy(false)
        }
      } catch (error) {
        setStatus(`❌ Could not connect to backend at ${apiUrl}`)
        setApiHealthy(false)
      }
    }

    checkBackend()
  }, [apiUrl])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
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
                {apiHealthy ? `✅ Backend is running on ${apiUrl}` : '❌ Backend is not running'}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Database Status</h3>
              <p className="text-sm text-gray-600">Check pgAdmin at http://localhost:5050</p>
              <p className="text-xs text-gray-500 mt-1">Email: admin@example.com | Password: admin</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Available Features</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>✅ Dashboard (you are here)</li>
              <li>✅ Análise Geográfica</li>
              <li>⏳ Chat IA Copilot (coming soon)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

function Navigation() {
  const location = useLocation()

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Social Sense</h1>
          </div>
          <div className="flex gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link
              to="/geo"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/geo'
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🗺️ Análise Geográfica
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/geo" element={<GeoAnalysis />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
