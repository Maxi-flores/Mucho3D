import { RouterProvider } from 'react-router-dom'
import { ToastContainer } from '@/components/ui'
import { router } from './router'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  )
}

export default App
