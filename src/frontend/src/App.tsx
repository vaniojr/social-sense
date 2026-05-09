import { RouterProvider, createBrowserRouter, Outlet, Link, useLocation } from 'react-router-dom'
import { EntityProvider, useEntity } from './context/EntityContext'
import { Dashboard } from './pages/Dashboard'
import { GeoAnalysis } from './pages/GeoAnalysis'

function Navigation() {
  const location = useLocation()
  const { entities, selectedId, setSelectedId, loading } = useEntity()

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
              <label className="text-xs font-semibold text-gray-600 block mb-1">Entidade</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                disabled={loading}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                {loading && <option>Carregando...</option>}
                {entities.map(entity => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name} ({entity.type})
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

// Layout component wrapping all routes
function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Outlet />
    </div>
  )
}

// Router configuration (React Router 7 - future flags are now defaults)
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/geo',
        element: <GeoAnalysis />,
      },
    ],
  },
])

function App() {
  return (
    <EntityProvider>
      <RouterProvider router={router} />
    </EntityProvider>
  )
}

export default App
