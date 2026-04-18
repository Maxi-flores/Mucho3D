import { motion } from 'framer-motion'
import { Package, Boxes, Zap } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Scene3D, EngineeringGrid, WireframeMesh, CameraController, Lights, FloatingHUD } from '@/components/3d'
import { CommandPalette } from '@/components/ai'
import { Panel, Badge } from '@/components/ui'
import { staggerContainer, staggerItem } from '@/lib/animations'

/**
 * Dashboard - Project workspace cockpit
 *
 * Shows:
 * - Project overview
 * - Active generations
 * - Recent activity
 * - 3D preview
 * - Quick actions
 */
export function Dashboard() {
  const stats = [
    { label: 'Active Projects', value: '12', icon: Package, color: 'text-blue-500' },
    { label: 'Generated Models', value: '248', icon: Boxes, color: 'text-green-500' },
    { label: 'Processing', value: '3', icon: Zap, color: 'text-primary' },
  ]

  return (
    <DashboardLayout>
      <CommandPalette />

      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to <span className="text-primary">Mucho3D</span>
          </h1>
          <p className="text-white/60">
            AI-assisted 3D generation workspace
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <Panel className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="engineering-text mb-1">{stat.label}</div>
                    <div className="text-3xl font-bold font-mono text-white">
                      {stat.value}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </Panel>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D Viewport - Takes 2 columns */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Panel
              title="3D Studio Preview"
              description="Interactive 3D workspace"
              headerAction={
                <Badge variant="success">
                  <span className="status-online mr-2" />
                  Live
                </Badge>
              }
            >
              <div className="h-[500px] rounded-lg overflow-hidden bg-background">
                <Scene3D>
                  <Lights />
                  <EngineeringGrid />
                  <WireframeMesh type="sphere" />
                  <CameraController />
                </Scene3D>
                <FloatingHUD />
              </div>
            </Panel>
          </motion.div>

          {/* Quick Actions - 1 column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Panel
              title="Quick Actions"
              description="Common tasks"
            >
              <div className="space-y-3">
                <button className="w-full px-4 py-3 text-left rounded-lg glass-panel hover:bg-surface-bright transition-colors">
                  <div className="font-medium text-white">New Project</div>
                  <div className="text-xs text-white/60">Start with a prompt</div>
                </button>
                <button className="w-full px-4 py-3 text-left rounded-lg glass-panel hover:bg-surface-bright transition-colors">
                  <div className="font-medium text-white">Open Studio</div>
                  <div className="text-xs text-white/60">3D editing workspace</div>
                </button>
                <button className="w-full px-4 py-3 text-left rounded-lg glass-panel hover:bg-surface-bright transition-colors">
                  <div className="font-medium text-white">View Projects</div>
                  <div className="text-xs text-white/60">Your project library</div>
                </button>
              </div>
            </Panel>

            <Panel
              title="Recent Activity"
              description="Latest updates"
              className="mt-6"
            >
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="text-white/80">Generated "Modern Chair"</div>
                  <div className="text-xs text-white/40">2 hours ago</div>
                </div>
                <div className="divider" />
                <div className="text-sm">
                  <div className="text-white/80">Project created</div>
                  <div className="text-xs text-white/40">5 hours ago</div>
                </div>
                <div className="divider" />
                <div className="text-sm">
                  <div className="text-white/80">Model exported</div>
                  <div className="text-xs text-white/40">1 day ago</div>
                </div>
              </div>
            </Panel>
          </motion.div>
        </div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Panel
            title="Recent Projects"
            description="Your recent work"
          >
            <div className="space-y-3 text-center py-8 text-white/60">
              No projects yet. Create your first project to get started.
            </div>
          </Panel>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
