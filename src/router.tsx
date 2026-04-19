import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Home } from '@/pages/Home'
import { NotFound } from '@/pages/NotFound'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthLoadingScreen } from '@/components/loading/AuthLoadingScreen'

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import('@/pages/app/Dashboard').then(m => ({ default: m.Dashboard })))
const Studio = lazy(() => import('@/pages/app/Studio').then(m => ({ default: m.Studio })))
const Projects = lazy(() => import('@/pages/app/Projects').then(m => ({ default: m.Projects })))
const ProjectDetail = lazy(() => import('@/pages/app/ProjectDetail').then(m => ({ default: m.ProjectDetail })))
const Settings = lazy(() => import('@/pages/app/Settings').then(m => ({ default: m.Settings })))
const Chat = lazy(() => import('@/pages/Chat').then(m => ({ default: m.Chat })))
const Builder = lazy(() => import('@/pages/Builder').then(m => ({ default: m.Builder })))
const ProjectStudio = lazy(() => import('@/pages/app/ProjectStudio').then(m => ({ default: m.ProjectStudio })))
const SignIn = lazy(() => import('@/pages/auth/SignIn').then(m => ({ default: m.SignIn })))

const LoadingFallback = () => <AuthLoadingScreen />

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <Home />,
  },

  // Authentication routes
  {
    path: '/auth',
    children: [
      {
        path: 'signin',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SignIn />
          </Suspense>
        ),
      },
      {
        path: 'callback',
        element: <div>Processing authentication...</div>,
      },
    ],
  },

  // Protected app routes
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'studio',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Studio />
          </Suspense>
        ),
      },
      {
        path: 'projects',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Projects />
          </Suspense>
        ),
      },
      {
        path: 'projects/:projectId',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProjectDetail />
          </Suspense>
        ),
      },
      {
        path: 'projects/:projectId/studio',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ProjectStudio />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Settings />
          </Suspense>
        ),
      },
      {
        path: 'chat',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Chat />
          </Suspense>
        ),
      },
      {
        path: 'builder',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Builder />
          </Suspense>
        ),
      },
    ],
  },

  // Legacy redirects (for backward compatibility, will eventually remove)
  {
    path: '/dashboard',
    element: <Navigate to="/app/dashboard" replace />,
  },
  {
    path: '/studio',
    element: <Navigate to="/app/studio" replace />,
  },
  {
    path: '/shop',
    element: <Navigate to="/" replace />, // Remove webstore, go home
  },

  // Health check endpoint
  {
    path: '/health',
    element: (
      <div style={{ fontFamily: 'monospace', padding: '20px' }}>
        {JSON.stringify(
          {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '3.0.0',
            service: 'mucho3d',
            auth: 'firebase-enabled',
          },
          null,
          2
        )}
      </div>
    ),
  },

  // 404 fallback
  {
    path: '*',
    element: <NotFound />,
  },
])
