import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Zap, Grid3X3, Code2, Lock, Lightbulb } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button, Card } from '@/components/ui'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

/**
 * Home - Public landing page
 *
 * Positioned as the public-facing entry point.
 * Communicates Mucho3D's core value: AI-assisted 3D generation platform
 * NOT a webstore, NOT a dashboard replacement
 */
export function Home() {
  const navigate = useNavigate()

  // Check if user is authenticated (will use useAuth() hook later)
  const isAuthenticated = localStorage.getItem('mucho3d-user')

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Driven Generation',
      description: 'Describe your ideas in natural language. Watch AI create 3D scenes instantly.',
    },
    {
      icon: Grid3X3,
      title: 'Professional Studio',
      description: 'Real-time 3D editing, scene controls, and asset management in one workspace.',
    },
    {
      icon: Code2,
      title: 'Structured Planning',
      description: 'Deterministic execution pipeline. See the plan before it runs.',
    },
    {
      icon: Lightbulb,
      title: 'Smart Revision',
      description: 'Refine generations with chat. Iterate toward your vision.',
    },
    {
      icon: Lock,
      title: 'Private Workspace',
      description: 'Projects stay yours. End-to-end encryption. No subscriptions.',
    },
    {
      icon: Zap,
      title: 'Local First',
      description: 'Run on your hardware. Ollama + Blender. Full control.',
    },
  ]

  const getStartedLabel = isAuthenticated ? 'Open Workspace' : 'Get Started'
  const getStartedPath = isAuthenticated ? '/app/dashboard' : '/auth/signin'

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 animated-grid opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-glow-fast" />
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-20"
        >
          <Logo size="lg" />
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => navigate('/app/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="primary" onClick={() => navigate('/app/dashboard')}>
                  Open Workspace
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => navigate('/auth/signin')}>
                Sign In
              </Button>
            )}
          </div>
        </motion.header>

        {/* Hero Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-mono">AI-Powered 3D Generation</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Describe Your Ideas.
            <br />
            <span className="text-gradient">Generate 3D.</span>
          </h1>

          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Mucho3D is an AI-assisted 3D generation platform. Turn natural language into professional 3D scenes.
            Chat-driven workflow. Deterministic execution. Your workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(getStartedPath)}
            >
              {getStartedLabel}
            </Button>
            {!isAuthenticated && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/studio')}
              >
                Try Studio (Demo)
              </Button>
            )}
          </div>

          <p className="text-sm text-white/40 mt-8">
            No credit card. No subscriptions. Works with local Ollama + Blender.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={staggerItem}>
              <Card variant="glass" className="h-full">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/60">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-white/60">Chat-driven 3D generation workflow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: 1, title: 'Chat', desc: 'Describe your 3D scene' },
              { num: 2, title: 'Plan', desc: 'AI creates structured plan' },
              { num: 3, title: 'Execute', desc: 'Deterministic generation' },
              { num: 4, title: 'Export', desc: 'Get your 3D model' },
            ].map((step) => (
              <div key={step.num} className="relative">
                {step.num < 4 && (
                  <div className="hidden md:block absolute top-6 -right-3 w-6 h-px bg-primary/30" />
                )}
                <Card variant="glass">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">{step.num}</span>
                    </div>
                    <h3 className="font-semibold text-white">{step.title}</h3>
                  </div>
                  <p className="text-sm text-white/60">{step.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center mb-20"
        >
          <Card variant="glass" className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 to-blue-600/10">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to generate?
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              Join creators building the future of 3D design. Start with a free workspace.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(getStartedPath)}
              >
                {getStartedLabel}
              </Button>
              {!isAuthenticated && (
                <a
                  href="#docs"
                  className="px-6 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Learn More
                </a>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center border-t border-white/10 pt-12 pb-6 text-sm text-white/40"
        >
          <p>© 2024 Mucho3D. AI-assisted 3D generation for everyone.</p>
          <p className="mt-2">
            Built with React, Three.js, TypeScript, and love.
          </p>
        </motion.footer>
      </div>
    </div>
  )
}
