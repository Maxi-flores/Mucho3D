import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      children,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-full font-mono font-medium'

    const variants = {
      default: 'bg-slate-800 text-white border border-white/10',
      primary: 'bg-primary/10 text-primary border border-primary/20',
      success: 'bg-green-500/10 text-green-500 border border-green-500/20',
      warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
      danger: 'bg-red-500/10 text-red-500 border border-red-500/20',
      info: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    }

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
