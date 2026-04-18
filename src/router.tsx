import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Dashboard } from '@/pages/Dashboard'
import { Shop } from '@/pages/Shop'
import { Studio } from '@/pages/Studio'
import { NotFound } from '@/pages/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/shop',
    element: <Shop />,
  },
  {
    path: '/studio',
    element: <Studio />,
  },
  {
    path: '/settings',
    element: <Navigate to="/dashboard" replace />, // Placeholder
  },
  {
    path: '/health',
    element: (
      <div style={{ fontFamily: 'monospace', padding: '20px' }}>
        {JSON.stringify(
          {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            service: 'mucho3d-v2',
          },
          null,
          2
        )}
      </div>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
