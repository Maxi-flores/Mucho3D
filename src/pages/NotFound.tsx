import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { fadeInUp } from '@/lib/animations'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 grid-background opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="text-center px-6"
      >
        {/* 404 */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold font-mono text-gradient mb-4">
            404
          </h1>
          <h2 className="text-3xl font-bold text-white mb-2">
            Page Not Found
          </h2>
          <p className="text-white/60 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft size={18} />}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            leftIcon={<Home size={18} />}
          >
            Home
          </Button>
        </div>

        {/* Technical details */}
        <div className="mt-12 glass-panel inline-block px-6 py-3 rounded-lg">
          <div className="engineering-text">Error Code</div>
          <div className="text-xl font-mono text-primary mt-1">
            ERR_PAGE_NOT_FOUND
          </div>
        </div>
      </motion.div>
    </div>
  )
}
