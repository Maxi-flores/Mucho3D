import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Box, Zap, ShoppingCart, Sparkles } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button, Card } from '@/components/ui'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

export function Home() {
  const navigate = useNavigate()

  const features = [
    {
      icon: Box,
      title: '3D Studio',
      description: 'Professional 3D modeling and printing workspace with real-time preview',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered',
      description: 'Intelligent command palette and chat assistant for faster workflow',
    },
    {
      icon: ShoppingCart,
      title: 'Integrated Shop',
      description: 'Browse and purchase filaments, parts, and accessories',
    },
    {
      icon: Zap,
      title: 'High Performance',
      description: 'Built with modern tech stack for smooth 60fps rendering',
    },
  ]

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
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Launch App
          </Button>
        </motion.header>

        {/* Hero Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Next-Gen{' '}
            <span className="text-gradient">3D Printing</span>
            <br />
            Engineering OS
          </h1>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            A professional platform for 3D printing enthusiasts, combining
            powerful modeling tools, AI assistance, and an integrated marketplace.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Get Started
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/studio')}
            >
              Try Studio
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
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

        {/* CTA Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center"
        >
          <Card variant="glass" className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to start creating?
            </h2>
            <p className="text-white/60 mb-6">
              Join the future of 3D printing with our engineering-first platform
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Launch Dashboard
            </Button>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-20 text-sm text-white/40"
        >
          <p>© 2024 Mucho3D. Built with React, Three.js, and TypeScript.</p>
        </motion.footer>
      </div>
    </div>
  )
}
