import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Tabs, TabsContent, TabsList, TabsTrigger, Button } from '@/components/ui'
import { GenerationChat } from '@/features/chat/GenerationChat'
import { useProject, useGenerations } from '@/hooks'
import { fadeInUp } from '@/lib/animations'

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { project, scene, loading: projectLoading } = useProject(projectId)
  const { generations, loading: generationsLoading } = useGenerations(projectId)

  if (projectLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-white/60">Loading project...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-white/60 mb-4">Project not found</p>
          <Button onClick={() => navigate('/app/projects')} variant="primary">
            Back to Projects
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex items-center gap-4"
        >
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/projects')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {project.name}
            </h1>
            <p className="text-white/60">{project.description || 'No description'}</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-lg">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="generations">Generations</TabsTrigger>
              <TabsTrigger value="scenes">Scenes</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Project Info
                  </h3>
                  <div className="space-y-3 text-sm text-white/60">
                    <p>
                      <span className="text-white">Name:</span> {project.name}
                    </p>
                    <p>
                      <span className="text-white">Created:</span>{' '}
                      {new Date(project.createdAt.toDate()).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="text-white">Last updated:</span>{' '}
                      {new Date(project.updatedAt.toDate()).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="text-white">Status:</span> {project.status}
                    </p>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Statistics
                  </h3>
                  <div className="space-y-3 text-sm text-white/60">
                    <p>
                      <span className="text-white">Total Generations:</span>{' '}
                      {generations.length}
                    </p>
                    <p>
                      <span className="text-white">Completed:</span>{' '}
                      {generations.filter((g) => g.status === 'complete').length}
                    </p>
                    <p>
                      <span className="text-white">In Progress:</span>{' '}
                      {generations.filter((g) => g.status === 'running').length}
                    </p>
                    <p>
                      <span className="text-white">Pending:</span>{' '}
                      {generations.filter((g) => g.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Generations Tab */}
            <TabsContent value="generations" className="space-y-6 mt-6">
              {generationsLoading ? (
                <div className="text-center py-8 text-white/60">
                  <p>Loading generations...</p>
                </div>
              ) : generations.length === 0 ? (
                <div className="glass-panel rounded-xl p-6 text-center py-12 text-white/60">
                  No generations yet. Use the chat interface to create your first generation.
                </div>
              ) : (
                <div className="space-y-3">
                  {generations.map((gen) => (
                    <div key={gen.id} className="glass-panel rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium truncate">{gen.prompt}</p>
                          <p className="text-sm text-white/60 mt-1">
                            {new Date(gen.createdAt.toDate()).toLocaleString()}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${
                          gen.status === 'complete'
                            ? 'bg-green-500/20 text-green-400'
                            : gen.status === 'running'
                            ? 'bg-blue-500/20 text-blue-400'
                            : gen.status === 'error'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-white/10 text-white/60'
                        }`}>
                          {gen.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Scenes Tab */}
            <TabsContent value="scenes" className="space-y-6 mt-6">
              {scene ? (
                <div className="glass-panel rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Current Scene
                  </h3>
                  <div className="space-y-3 text-sm text-white/60">
                    <p>
                      <span className="text-white">Objects:</span> {scene.objects.length}
                    </p>
                    <p>
                      <span className="text-white">Version:</span> {scene.version}
                    </p>
                    <p>
                      <span className="text-white">Last Updated:</span>{' '}
                      {new Date(scene.updatedAt.toDate()).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="glass-panel rounded-xl p-6 text-center py-12 text-white/60">
                  No scene saved yet. Start generating or editing in the studio to create a scene.
                </div>
              )}
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="space-y-6 mt-6">
              {projectId ? (
                <div className="h-[600px]">
                  <GenerationChat projectId={projectId} />
                </div>
              ) : (
                <div className="text-center py-8 text-white/60">
                  Loading...
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

export default ProjectDetail
