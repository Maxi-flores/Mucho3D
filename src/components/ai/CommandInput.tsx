import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useAIStore } from '@/store'
import { cn } from '@/lib/cn'

interface CommandInputProps {
  onClose?: () => void
}

export function CommandInput({ onClose }: CommandInputProps) {
  const searchQuery = useAIStore((state) => state.searchQuery)
  const setSearchQuery = useAIStore((state) => state.setSearchQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleClear = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <Search
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
      />

      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Type a command or search..."
        className={cn(
          'w-full pl-12 pr-12 py-4 bg-transparent',
          'text-white placeholder:text-white/40',
          'border-b border-white/10',
          'focus:outline-none focus:border-primary/50',
          'transition-colors text-lg'
        )}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose?.()
          }
        }}
      />

      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      )}
    </div>
  )
}
