import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { usePromptSession } from '@/hooks/usePromptSession'

interface GenerationChatProps {
  projectId: string
}

export function GenerationChat({ projectId }: GenerationChatProps) {
  const { messages, isGenerating, error, sendPrompt, initializeSession } = usePromptSession(projectId)
  const [input, setInput] = useState('')
  const [initialized, setInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize session on mount
  useEffect(() => {
    if (projectId && !initialized) {
      initializeSession(projectId)
      setInitialized(true)
    }
  }, [projectId, initialized, initializeSession])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return

    const prompt = input
    setInput('')
    await sendPrompt(prompt)
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-white/10 glass-panel">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-white/60">
              <p className="mb-2">Describe what you want to generate</p>
              <p className="text-sm">e.g., "Create a modern minimalist chair"</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-white/5 text-white/80'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white/5 text-white/60 rounded-lg px-4 py-2">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Generating...
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Describe your 3D model..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isGenerating || !input.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
    </div>
  )
}

export default GenerationChat
