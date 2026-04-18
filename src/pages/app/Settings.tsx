import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout'
import { Button, Panel } from '@/components/ui'
import { fadeInUp } from '@/lib/animations'

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

  const handleSignOut = () => {
    localStorage.removeItem('mucho3d-user')
    navigate('/')
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
                user@example.com
              </div>
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-2">Name</label>
              <div className="px-4 py-2 rounded-lg glass-panel text-white/80">
                Demo User
              </div>
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* Integration Settings */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <Panel title="Integrations" description="Connect external services">
          <div className="space-y-4">
            <div className="p-4 rounded-lg glass-panel">
              <h4 className="font-semibold text-white mb-2">Ollama</h4>
              <p className="text-sm text-white/60 mb-3">Local AI engine for generation planning</p>
              <div className="text-sm text-red-400">
                Not connected. Install Ollama locally to enable.
              </div>
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
                defaultChecked
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-white">Dark mode (default)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
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
