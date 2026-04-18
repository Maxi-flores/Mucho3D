import { motion } from 'framer-motion'
import { Logo } from '@/components/shared/Logo'

/**
 * AuthLoadingScreen - Shows during authentication verification
 */
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 animated-grid opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-glow-fast" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Logo size="lg" className="mb-8 justify-center" />
        <div className="space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full mx-auto"
          />
          <p className="text-white/60 font-mono text-sm">
            Initializing workspace...
          </p>
        </div>
      </motion.div>
    </div>
  )
}
