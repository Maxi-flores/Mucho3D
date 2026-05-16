import { type ReactNode, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { useUIStore } from '@/store'
import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from '@/lib/constants'
import { pageTransition } from '@/lib/animations'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const sidebarState = useUIStore((state) => state.sidebarState)
  const [isHovered, setIsHovered] = useState(false)

  const isExpanded = isHovered || sidebarState === 'expanded'
  const sidebarWidth = isExpanded ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed

  // Listen to sidebar hover state via custom event
  useEffect(() => {
    const handleSidebarHover = (e: CustomEvent) => {
      setIsHovered(e.detail.isHovered)
    }

    window.addEventListener('sidebar-hover', handleSidebarHover as EventListener)
    return () => {
      window.removeEventListener('sidebar-hover', handleSidebarHover as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 grid-background opacity-20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Topbar */}
      <Topbar />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <motion.main
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarWidth,
          marginTop: TOPBAR_HEIGHT,
          minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        }}
      >
        <div className="p-6">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
