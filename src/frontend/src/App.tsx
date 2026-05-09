import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { CandidateProvider, useCandidate } from './context/CandidateContext'
import { Dashboard } from './pages/Dashboard'
import { GeoAnalysis } from './pages/GeoAnalysis'

function Navigation() {
  const location = useLocation()
  const { candidates, selectedId, setSelectedId, loading } = useCandidate()

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Social Sense</h1>
          </div>
          <div className="flex gap-1 items-center">
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
            <div className="ml-6 border-l border-gray-200 pl-6">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Candidato</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                disabled={loading}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                {loading && <option>Carregando...</option>}
                {candidates.map(candidate => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} ({candidate.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <CandidateProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/geo" element={<GeoAnalysis />} />
          </Routes>
        </div>
      </Router>
    </CandidateProvider>
  )
}

export default App
