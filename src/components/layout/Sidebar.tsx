import { motion, AnimatePresence } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Box,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useUIStore } from '@/store'
import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from '@/lib/constants'
import { Tooltip } from '@/components/ui'
import { fadeInLeft } from '@/lib/animations'

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
  { name: 'Studio', icon: Box, path: '/app/studio' },
  { name: 'Chat', icon: MessageCircle, path: '/app/chat' },
  { name: 'Builder', icon: Zap, path: '/app/builder' },
  { name: 'Settings', icon: Settings, path: '/app/settings' },
]

export function Sidebar() {
  const sidebarState = useUIStore((state) => state.sidebarState)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)

  const isExpanded = sidebarState === 'expanded'
  const width = isExpanded ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        width,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed left-0 z-40 h-screen glass-panel border-r border-white/5"
      style={{ top: TOPBAR_HEIGHT }}
    >
      <div className="h-full flex flex-col">
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2">
          {navigation.map((item) => (
            <Tooltip
              key={item.path}
              content={item.name}
              position="right"
              delay={isExpanded ? 9999 : 200}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group',
                    'hover:bg-white/5',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-glow-sm'
                      : 'text-white/70 hover:text-white'
                  )
                }
              >
                <item.icon
                  size={20}
                  className="flex-shrink-0 transition-transform group-hover:scale-110"
                />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      variants={fadeInLeft}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="font-medium text-sm whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </Tooltip>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white"
          >
            {isExpanded ? (
              <>
                <ChevronLeft size={20} />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      variants={fadeInLeft}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="ml-2 text-sm font-medium"
                    >
                      Collapse
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
