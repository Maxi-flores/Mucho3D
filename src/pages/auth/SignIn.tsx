import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/shared/Logo'
import { Button, Input, Card } from '@/components/ui'
import { fadeInUp } from '@/lib/animations'

/**
 * SignIn - Authentication entry point
 *
 * Supports:
 * - Email/password (demo)
 * - Google OAuth (placeholder)
 * - Microsoft OAuth (placeholder)
 *
 * TODO: Integrate with Firebase Auth
 */
export function SignIn() {
  const navigate = useNavigate()

  const handleDemoSignIn = () => {
    // Demo: Set auth flag in localStorage
    // TODO: Replace with real Firebase auth
    localStorage.setItem('mucho3d-user', JSON.stringify({
      id: 'demo-user',
      email: 'user@example.com',
      name: 'Demo User',
    }))
    navigate('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 animated-grid opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-glow-fast" />
      </div>

      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <Logo size="lg" className="justify-center mb-8" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to Mucho3D
          </h1>
          <p className="text-white/60">
            AI-assisted 3D generation workspace
          </p>
        </div>

        {/* Sign In Card */}
        <Card variant="glass" className="p-8 space-y-6">
          {/* Email/Password Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleDemoSignIn(); }} className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className="w-full"
              />
            </div>
            <Button variant="primary" size="lg" className="w-full" type="submit">
              Sign In (Demo)
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-white/40">or continue with</span>
            </div>
          </div>

          {/* OAuth Options (Placeholders) */}
          <div className="space-y-3">
            <Button variant="secondary" size="lg" className="w-full" disabled>
              <span className="mr-2">🔵</span> Google
            </Button>
            <Button variant="secondary" size="lg" className="w-full" disabled>
              <span className="mr-2">🪟</span> Microsoft
            </Button>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-white/40 mt-8">
          No account? Coming soon. Demo uses auto sign-in.
        </p>
        <p className="text-center text-sm text-white/40 mt-2">
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline"
          >
            Back to home
          </button>
        </p>
      </motion.div>
    </div>
  )
}

export default SignIn
