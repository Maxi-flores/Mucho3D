import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { fadeInUp } from '@/lib/animations'

/**
 * ProjectDetail - Project workspace
 *
 * Shows:
 * - Project overview
 * - Scenes/versions
 * - Generations/history
 * - Assets/exports
 * - Execution logs
 *
 * TODO: Integrate with Firestore + generation history
 * TODO: Connect to chat generation interface
 */
export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()

  // TODO: Load project from Firestore
  const project = {
    id: projectId,
    name: 'Living Room Chair',
    description: 'Modern minimalist furniture design',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          {project.name}
        </h1>
        <p className="text-white/60">{project.description}</p>
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
            <TabsTrigger value="scenes">Scenes</TabsTrigger>
            <TabsTrigger value="generations">Generations</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="glass-panel rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Project Info
              </h3>
              <div className="space-y-3 text-sm text-white/60">
                <p>Created: {project.createdAt.toLocaleDateString()}</p>
                <p>Last updated: {project.updatedAt.toLocaleDateString()}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scenes" className="space-y-6 mt-6">
            <div className="glass-panel rounded-xl p-6 text-center py-12 text-white/60">
              No scenes yet. Start with a generation or create manually in the studio.
            </div>
          </TabsContent>

          <TabsContent value="generations" className="space-y-6 mt-6">
            <div className="glass-panel rounded-xl p-6 text-center py-12 text-white/60">
              No generations yet. Use the chat interface to create your first generation.
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6 mt-6">
            <div className="glass-panel rounded-xl p-6 text-center py-12 text-white/60">
              No assets yet. Exports and models will appear here.
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6 mt-6">
            <div className="glass-panel rounded-xl p-6 text-center py-12 text-white/60">
              No logs yet. Execution history will appear here.
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
      </div>
    </DashboardLayout>
  )
}

export default ProjectDetail
