import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Package, Boxes, Zap, Plus } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Scene3D, EngineeringGrid, WireframeMesh, CameraController, Lights, FloatingHUD } from '@/components/3d'
import { ChatInterface, CommandPalette } from '@/components/ai'
import { Panel, Badge, Button } from '@/components/ui'
import { useProjects } from '@/hooks'
import { useAuth } from '@/hooks'
import { staggerContainer, staggerItem } from '@/lib/animations'

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { projects, createProject } = useProjects()

  const stats = [
    { label: 'Active Projects', value: projects.length.toString(), icon: Package, color: 'text-blue-500' },
    { label: 'Total Projects', value: projects.length.toString(), icon: Boxes, color: 'text-green-500' },
    { label: 'Workspace', value: 'Ready', icon: Zap, color: 'text-primary' },
  ]

  const handleNewProject = async () => {
    const name = prompt('Project name:')
    if (name) {
      const newProject = await createProject(name, 'New Mucho3D project')
      navigate(`/app/projects/${newProject.id}`)
    }
  }

  const recentProjects = projects.slice(0, 3)

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
            Welcome back, <span className="text-primary">{user?.name.split(' ')[0]}</span>
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
                <button
                  onClick={handleNewProject}
                  className="w-full px-4 py-3 text-left rounded-lg glass-panel hover:bg-surface-bright transition-colors"
                >
                  <div className="font-medium text-white flex items-center gap-2">
                    <Plus size={16} />
                    New Project
                  </div>
                  <div className="text-xs text-white/60">Start a new generation</div>
                </button>
                <button
                  onClick={() => navigate('/app/studio')}
                  className="w-full px-4 py-3 text-left rounded-lg glass-panel hover:bg-surface-bright transition-colors"
                >
                  <div className="font-medium text-white">Open Studio</div>
                  <div className="text-xs text-white/60">3D editing workspace</div>
                </button>
                <button
                  onClick={() => navigate('/app/projects')}
                  className="w-full px-4 py-3 text-left rounded-lg glass-panel hover:bg-surface-bright transition-colors"
                >
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
              {projects.length === 0 ? (
                <div className="text-center py-4 text-white/60">
                  <p className="text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentProjects.map((proj) => (
                    <div key={proj.id} className="text-sm">
                      <div className="text-white/80">{proj.name}</div>
                      <div className="text-xs text-white/40">
                        {new Date(proj.updatedAt.toDate()).toLocaleDateString()}
                      </div>
                      {recentProjects.indexOf(proj) < recentProjects.length - 1 && (
                        <div className="divider mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              )}
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
            {projects.length === 0 ? (
              <div className="space-y-3 text-center py-8">
                <p className="text-white/60">No projects yet. Create your first project to get started.</p>
                <Button onClick={handleNewProject} variant="primary" size="sm">
                  <Plus size={16} className="mr-2" />
                  Create Project
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => navigate(`/app/projects/${proj.id}`)}
                    className="w-full p-3 text-left rounded-lg glass-panel hover:bg-surface-bright transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{proj.name}</p>
                        <p className="text-xs text-white/60">{proj.description || 'No description'}</p>
                      </div>
                      <Badge variant="default" className="text-xs">
                        {proj.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ChatInterface initialMode="dashboard" title="Dashboard Assistant" className="h-[520px]" />
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
