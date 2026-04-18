import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'
import { useAIStore } from '@/store'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'

export function ChatInterface() {
  const messages = useAIStore((state) => state.messages)
  const addMessage = useAIStore((state) => state.addMessage)
  const isThinking = useAIStore((state) => state.isThinking)
  const setIsThinking = useAIStore((state) => state.setIsThinking)

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isThinking) return

    // Add user message
    addMessage({
      role: 'user',
      content: input,
    })

    setInput('')
    setIsThinking(true)

    // Simulate AI response
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `This is a simulated response to: "${input}". In production, this would connect to your AI backend.`,
      })
      setIsThinking(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4"
      >
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-white/60">Start a conversation</p>
              <p className="text-sm text-white/40 mt-2">
                Ask me anything about your 3D models or the platform
              </p>
            </motion.div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              variants={staggerItem}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-3',
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'glass-panel text-white'
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </motion.div>
          ))}

          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="glass-panel rounded-lg px-4 py-3 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="text-sm text-white/60">Thinking...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </motion.div>

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type your message..."
            className="flex-1 glass-panel px-4 py-2 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isThinking}
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
