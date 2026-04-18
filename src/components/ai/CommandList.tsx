import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useAIStore, useUIStore } from '@/store'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui'

export function CommandList() {
  const filteredCommands = useAIStore((state) => state.filteredCommands)
  const executeCommand = useAIStore((state) => state.executeCommand)
  const closeCommandPalette = useUIStore((state) => state.closeCommandPalette)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleExecute = useCallback(
    (commandId: string) => {
      executeCommand(commandId)
      closeCommandPalette()
    },
    [closeCommandPalette, executeCommand]
  )

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          handleExecute(filteredCommands[selectedIndex].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredCommands, selectedIndex, handleExecute])

  if (filteredCommands.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-white/60">No commands found</p>
        <p className="text-sm text-white/40 mt-2">
          Try a different search term
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-h-96 overflow-y-auto scrollbar-thin py-2"
    >
      {filteredCommands.map((command, index) => (
        <motion.button
          key={command.id}
          variants={staggerItem}
          onClick={() => handleExecute(command.id)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={cn(
            'w-full px-4 py-3 flex items-center gap-3 text-left',
            'transition-colors group',
            selectedIndex === index
              ? 'bg-primary/10 border-l-2 border-primary'
              : 'hover:bg-white/5 border-l-2 border-transparent'
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{command.label}</span>
              {command.shortcut && (
                <kbd className="px-2 py-0.5 text-xs font-mono bg-white/5 rounded text-white/60">
                  {command.shortcut}
                </kbd>
              )}
            </div>
            {command.description && (
              <p className="text-sm text-white/60 truncate mt-0.5">
                {command.description}
              </p>
            )}
          </div>

          <Badge variant="primary" size="sm">
            {command.category}
          </Badge>

          <ChevronRight
            size={16}
            className={cn(
              'text-white/40 transition-all',
              selectedIndex === index && 'text-primary translate-x-1'
            )}
          />
        </motion.button>
      ))}
    </motion.div>
  )
}
