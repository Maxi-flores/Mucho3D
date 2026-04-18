import { motion } from 'framer-motion'
import { Plus, Grid3X3, Calendar, Archive } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button, Panel, Badge } from '@/components/ui'
import { fadeInUp } from '@/lib/animations'

/**
 * Projects - Project library page
 *
 * Shows:
 * - Recent projects
 * - Project search/filter
 * - Create new project button
 * - Project cards with metadata
 *
 * TODO: Integrate with Firestore
 * TODO: Connect to ProjectDetail page
 */
export function Projects() {
  // TODO: Connect to useProjects() hook with Firestore
  const projects = [
    {
      id: '1',
      name: 'Living Room Chair',
      description: 'Modern minimalist furniture design',
      thumbnail: null,
      status: 'completed',
      createdAt: new Date(),
      generations: 3,
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Projects</h1>
          <p className="text-white/60">Manage your 3D generation projects</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          New Project
        </Button>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="glass-panel rounded-xl p-6"
      >
        <input
          type="text"
          placeholder="Search projects..."
          className="input-base w-full"
        />
      </motion.div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {projects.map((project) => (
            <Panel key={project.id} className="cursor-pointer hover:border-primary/50 transition-colors">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {project.name}
                    </h3>
                    <p className="text-sm text-white/60">
                      {project.description}
                    </p>
                  </div>
                  <Badge variant={project.status === 'completed' ? 'success' : 'default'}>
                    {project.status}
                  </Badge>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-sm text-white/60">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-2">
                    <Grid3X3 size={14} />
                    {project.generations} generations
                  </span>
                </div>
              </div>
            </Panel>
          ))}
        </motion.div>
      ) : (
        <Panel className="text-center py-12">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Archive size={24} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No projects yet
          </h3>
          <p className="text-white/60 mb-6">
            Create your first project to get started
          </p>
          <Button variant="primary">New Project</Button>
        </Panel>
      )}
      </div>
    </DashboardLayout>
  )
}

export default Projects
