import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout'
import { Button, Panel } from '@/components/ui'
import { fadeInUp } from '@/lib/animations'
import { useAuth } from '@/hooks'
import { getAvailableModels, isOllamaAvailable } from '@/services/ai/ollamaService'
import { getMcpBridgeStatus, getMcpConnections, McpConnection } from '@/services/mcpBridgeService'
import { getUserProfile, updateUserProfile } from '@/services/firestore'
import { UserDoc } from '@/types/firebase'

/**
 * Settings - User account and integration settings
 *
 * TODO: Integrate with Firebase user profile
 * TODO: Add OAuth/SSO integration settings
 * TODO: Add Ollama/Blender connection settings
 * TODO: Add preferences
 */
export function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [ollamaConnected, setOllamaConnected] = useState(false)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [mcpReachable, setMcpReachable] = useState(false)
  const [mcpConfigured, setMcpConfigured] = useState(false)
  const [mcpConnections, setMcpConnections] = useState<McpConnection[]>([])
  const [loadingIntegrations, setLoadingIntegrations] = useState(false)

  const refreshSettings = async () => {
    setLoadingIntegrations(true)
    try {
      const [profileData, ollamaAvailable, models, mcpStatus, connections] = await Promise.all([
        user ? getUserProfile(user.id) : Promise.resolve(null),
        isOllamaAvailable(),
        getAvailableModels(),
        getMcpBridgeStatus(),
        getMcpConnections(),
      ])

      setProfile(profileData)
      setOllamaConnected(ollamaAvailable)
      setOllamaModels(models)
      setMcpReachable(mcpStatus.reachable)
      setMcpConfigured(mcpStatus.configured)
      setMcpConnections(connections)
    } finally {
      setLoadingIntegrations(false)
    }
  }

  useEffect(() => {
    refreshSettings()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handlePreferenceChange = async (
    key: 'darkMode' | 'autoSaveProjects',
    value: boolean
  ) => {
    if (!user) return

    const preferences = {
      darkMode: profile?.preferences?.darkMode ?? true,
      autoSaveProjects: profile?.preferences?.autoSaveProjects ?? true,
      [key]: value,
    }

    await updateUserProfile(user.id, { preferences })
    setProfile((prev) => prev ? { ...prev, preferences } : prev)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-white/60">Manage your account and preferences</p>
      </motion.div>

      {/* Account Settings */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <Panel title="Account" description="Your user information">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 block mb-2">Email</label>
              <div className="px-4 py-2 rounded-lg glass-panel text-white/80">
                {profile?.email || user?.email || 'Not signed in'}
              </div>
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-2">Name</label>
              <div className="px-4 py-2 rounded-lg glass-panel text-white/80">
                {profile?.name || user?.name || 'Guest'}
              </div>
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* Integration Settings */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <Panel title="Integrations" description="Connect external services">
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={refreshSettings}
              disabled={loadingIntegrations}
            >
              <RefreshCw size={16} />
              {loadingIntegrations ? 'Checking...' : 'Refresh'}
            </Button>

            <div className="p-4 rounded-lg glass-panel">
              <h4 className="font-semibold text-white mb-2">Ollama</h4>
              <p className="text-sm text-white/60 mb-3">Local AI engine for generation planning</p>
              <div className={`text-sm ${ollamaConnected ? 'text-green-400' : 'text-red-400'}`}>
                {ollamaConnected ? 'Connected' : 'Not connected. Start Ollama and the proxy server.'}
              </div>
              {ollamaModels.length > 0 && (
                <div className="text-xs text-white/50 mt-2">
                  Models: {ollamaModels.slice(0, 4).join(', ')}
                  {ollamaModels.length > 4 ? ` +${ollamaModels.length - 4} more` : ''}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg glass-panel">
              <h4 className="font-semibold text-white mb-2">MCP Bridge</h4>
              <p className="text-sm text-white/60 mb-3">Tool and data bridge for connected MCP servers</p>
              <div className={`text-sm ${mcpReachable ? 'text-green-400' : 'text-yellow-400'}`}>
                {mcpReachable
                  ? 'Bridge reachable'
                  : mcpConfigured
                    ? 'Configured but not reachable'
                    : 'Not configured. Set MCP_BRIDGE_URL in the proxy server.'}
              </div>
              {mcpConnections.length > 0 && (
                <div className="text-xs text-white/50 mt-2">
                  Connections: {mcpConnections.map((connection) => connection.name).join(', ')}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg glass-panel">
              <h4 className="font-semibold text-white mb-2">Blender</h4>
              <p className="text-sm text-white/60 mb-3">3D execution engine</p>
              <div className="text-sm text-red-400">
                Not connected. Install Blender locally to enable.
              </div>
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* Preferences */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <Panel title="Preferences" description="Customize your experience">
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={profile?.preferences?.darkMode ?? true}
                onChange={(event) => handlePreferenceChange('darkMode', event.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-white">Dark mode (default)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={profile?.preferences?.autoSaveProjects ?? true}
                onChange={(event) => handlePreferenceChange('autoSaveProjects', event.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-white">Auto-save projects</span>
            </label>
          </div>
        </Panel>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <Panel title="Sign Out" description="End your session">
          <Button
            variant="danger"
            className="w-full justify-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </Panel>
      </motion.div>
      </div>
    </DashboardLayout>
  )
}

export default Settings
