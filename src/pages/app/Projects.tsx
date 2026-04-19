import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Plus, Grid3X3, Calendar, Archive } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button, Panel, Badge, Input } from '@/components/ui'
import { useProjects } from '@/hooks'
import { fadeInUp } from '@/lib/animations'

export function Projects() {
  const navigate = useNavigate()
  const { projects, loading, error, createProject } = useProjects()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleNewProject = async () => {
    const name = prompt('Project name:')
    if (!name) return

    setIsCreating(true)
    try {
      const newProject = await createProject(name, `Project: ${name}`)
      navigate(`/app/projects/${newProject.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
      alert('Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  )

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
            onClick={handleNewProject}
            disabled={isCreating}
          >
            <Plus size={20} />
            {isCreating ? 'Creating...' : 'New Project'}
          </Button>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="p-4 rounded-lg bg-red-500/10 border border-red-500/30"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Search & Filter */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="glass-panel rounded-xl p-6"
        >
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </motion.div>

        {/* Projects Grid */}
        {loading ? (
          <Panel className="text-center py-12">
            <p className="text-white/60">Loading projects...</p>
          </Panel>
        ) : filteredProjects.length > 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/app/projects/${project.id}`)}
              >
                <Panel className="cursor-pointer hover:border-primary/50 transition-colors h-full">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {project.name}
                        </h3>
                        <p className="text-sm text-white/60">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                        {project.status}
                      </Badge>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-sm text-white/60">
                      <span className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(project.createdAt.toDate()).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-2">
                        <Grid3X3 size={14} />
                        {project.updatedAt.toDate().getTime() > project.createdAt.toDate().getTime() ? 'Updated' : 'New'}
                      </span>
                    </div>
                  </div>
                </Panel>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Panel className="text-center py-12">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Archive size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery ? 'Try a different search' : 'Create your first project to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={handleNewProject} variant="primary">
                New Project
              </Button>
            )}
          </Panel>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Projects
