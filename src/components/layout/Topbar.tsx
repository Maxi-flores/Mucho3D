import { Search, User, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/shared/Logo'
import { Button, Tooltip } from '@/components/ui'
import { useUIStore } from '@/store'
import { TOPBAR_HEIGHT } from '@/lib/constants'

export function Topbar() {
  const navigate = useNavigate()
  const openCommandPalette = useUIStore((state) => state.openCommandPalette)

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5"
      style={{ height: TOPBAR_HEIGHT }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <Logo size="md" />

        {/* Center: Search Trigger */}
        <div className="flex-1 max-w-xl mx-8">
          <button
            onClick={openCommandPalette}
            className="w-full glass-panel hover:bg-surface-bright px-4 py-2 rounded-lg flex items-center gap-3 text-left transition-all group"
          >
            <Search size={16} className="text-white/40 group-hover:text-primary transition-colors" />
            <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
              Search or run command...
            </span>
            <div className="ml-auto flex items-center gap-1">
              <kbd className="px-2 py-0.5 text-xs font-mono bg-white/5 rounded">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-white/5 rounded">
                K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Tooltip content="Settings">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/settings')}
            >
              <Settings size={18} />
            </Button>
          </Tooltip>

          <Tooltip content="User Profile">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/settings')}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <User size={16} />
              </div>
            </Button>
          </Tooltip>
        </div>
      </div>
    </motion.header>
  )
}
