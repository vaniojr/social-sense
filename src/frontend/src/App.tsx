import { RouterProvider, createBrowserRouter, Outlet } from 'react-router-dom'
import { EntityProvider } from './context/EntityContext'
import { Sidebar } from './components/Sidebar'
import { EnhancedChatWidget } from './components/EnhancedChatWidget'
import { Dashboard } from './pages/Dashboard'
import { GeoAnalysis } from './pages/GeoAnalysis'
import { NewsPage } from './pages/NewsPage'
import { MonitoringPage } from './pages/MonitoringPage'
import { SettingsPage } from './pages/SettingsPage'
import { CompetitorsPage } from './pages/CompetitorsPage'
import { TrendsPage } from './pages/TrendsPage'
import { WarRoomDashboard } from './pages/WarRoomDashboard'
import { EntitiesPage } from './pages/EntitiesPage'

// Layout component wrapping all routes with new Sidebar design
function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <EnhancedChatWidget />
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
        path: '/entities',
        element: <EntitiesPage />,
      },
      {
        path: '/geo',
        element: <GeoAnalysis />,
      },
      {
        path: '/news',
        element: <NewsPage />,
      },
      {
        path: '/monitor',
        element: <MonitoringPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
      {
        path: '/competitors',
        element: <CompetitorsPage />,
      },
      {
        path: '/trends',
        element: <TrendsPage />,
      },
      {
        path: '/war-room',
        element: <WarRoomDashboard />,
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
