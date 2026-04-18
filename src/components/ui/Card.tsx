import { forwardRef, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/cn'
import { cardHover } from '@/lib/animations'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: 'default' | 'glass' | 'bordered'
  hoverable?: boolean
  children: ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'glass',
      hoverable = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-slate-800 border border-slate-700',
      glass: 'glass-panel',
      bordered: 'bg-transparent border border-white/10',
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl p-6 transition-all duration-300',
          variants[variant],
          hoverable && 'cursor-pointer hover:shadow-glow hover:border-primary/30',
          className
        )}
        variants={hoverable ? cardHover : undefined}
        initial={hoverable ? 'initial' : undefined}
        whileHover={hoverable ? 'hover' : undefined}
        whileTap={hoverable ? 'tap' : undefined}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'
