import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks'
import { AuthLoadingScreen } from './loading/AuthLoadingScreen'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <AuthLoadingScreen />
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />
  }

  return <Outlet />
}
