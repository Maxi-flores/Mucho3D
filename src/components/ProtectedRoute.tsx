import { Navigate, Outlet } from 'react-router-dom'
import { AuthLoadingScreen } from './loading/AuthLoadingScreen'

/**
 * ProtectedRoute - Guards access to /app/* routes
 *
 * Checks authentication state and:
 * - Shows loading while checking
 * - Redirects to signin if not authenticated
 * - Renders app layout if authenticated
 *
 * TEMPORARY: Uses localStorage for demo
 * TODO: Integrate with Firebase Auth provider
 */
export function ProtectedRoute() {
  // TODO: Replace with useAuth() hook
  // const { user, loading } = useAuth()

  // Demo auth check (will be replaced with Firebase)
  const isAuthenticated = localStorage.getItem('mucho3d-user')
  const isLoading = false

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />
  }

  return <Outlet />
}
