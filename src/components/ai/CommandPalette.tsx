import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Terminal } from 'lucide-react'
import { useUIStore, useAIStore } from '@/store'
import { useKeyboardShortcuts } from '@/hooks'
import { modalBackdrop, commandPalette } from '@/lib/animations'
import { CommandInput } from './CommandInput'
import { CommandList } from './CommandList'
import { ChatInterface } from './ChatInterface'

export function CommandPalette() {
  const isOpen = useUIStore((state) => state.isCommandPaletteOpen)
  const closeCommandPalette = useUIStore((state) => state.closeCommandPalette)
  const openCommandPalette = useUIStore((state) => state.openCommandPalette)

  const mode = useAIStore((state) => state.mode)
  const setMode = useAIStore((state) => state.setMode)

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      handler: () => openCommandPalette(),
    },
    {
      key: 'k',
      ctrl: true,
      handler: () => openCommandPalette(),
    },
    {
      key: 'Escape',
      handler: () => {
        if (isOpen) closeCommandPalette()
      },
    },
  ])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={closeCommandPalette}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Palette */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              variants={commandPalette}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-2xl glass-panel-bright rounded-2xl shadow-glass-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMode('command')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      mode === 'command'
                        ? 'bg-primary/10 text-primary'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Terminal size={16} className="inline mr-2" />
                    Commands
                  </button>
                  <button
                    onClick={() => setMode('chat')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      mode === 'chat'
                        ? 'bg-primary/10 text-primary'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <MessageSquare size={16} className="inline mr-2" />
                    Chat
                  </button>
                </div>

                <button
                  onClick={closeCommandPalette}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              {mode === 'command' ? (
                <>
                  <CommandInput onClose={closeCommandPalette} />
                  <CommandList />
                </>
              ) : (
                <ChatInterface />
              )}

              {/* Footer */}
              <div className="px-4 py-3 border-t border-white/5 bg-white/5">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>
                    Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">ESC</kbd> to close
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑</kbd>{' '}
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↓</kbd> to navigate
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
