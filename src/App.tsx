import { RouterProvider } from 'react-router-dom'
import { ToastContainer } from '@/components/ui'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { router } from './router'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <ToastContainer />
    </AuthProvider>
  )
}

export default App
