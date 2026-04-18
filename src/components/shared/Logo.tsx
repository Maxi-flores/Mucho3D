import { motion } from 'framer-motion'
import { Box } from 'lucide-react'
import { cn } from '@/lib/cn'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: {
      icon: 20,
      text: 'text-base',
    },
    md: {
      icon: 24,
      text: 'text-lg',
    },
    lg: {
      icon: 32,
      text: 'text-2xl',
    },
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.div
        className="relative"
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          size={sizes[size].icon}
          className="text-primary"
          strokeWidth={2.5}
        />
        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
      </motion.div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('font-mono font-bold text-white', sizes[size].text)}>
            Mucho<span className="text-primary">3D</span>
          </span>
          <span className="text-[0.6em] text-white/40 uppercase tracking-widest">
            Engineering OS
          </span>
        </div>
      )}
    </div>
  )
}
