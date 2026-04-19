import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Logo } from '@/components/shared/Logo'
import { Button, Input, Card } from '@/components/ui'
import { useAuth } from '@/hooks'
import { fadeInUp } from '@/lib/animations'

export function SignIn() {
  const navigate = useNavigate()
  const { signInWithEmail, signInWithGoogle, signInWithMicrosoft, error: authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signInWithEmail(email, password)
      navigate('/app/dashboard')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign in failed'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)

    try {
      await signInWithGoogle()
      navigate('/app/dashboard')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleMicrosoftSignIn = async () => {
    setError(null)
    setLoading(true)

    try {
      await signInWithMicrosoft()
      navigate('/app/dashboard')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Microsoft sign-in failed'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const displayError = error || authError

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
          {/* Error Message */}
          {displayError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">{displayError}</p>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              type="submit"
              disabled={loading || !email || !password}
            >
              {loading ? 'Signing in...' : 'Sign In'}
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

          {/* OAuth Options */}
          <div className="space-y-3">
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <span className="mr-2">🔵</span> Google
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleMicrosoftSignIn}
              disabled={loading}
            >
              <span className="mr-2">🪟</span> Microsoft
            </Button>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-white/40 mt-8">
          Firebase credentials needed for real auth. Demo mode uses localStorage.
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
