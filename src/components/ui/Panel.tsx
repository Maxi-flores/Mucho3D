import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  headerAction?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      title,
      description,
      headerAction,
      footer,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('glass-panel rounded-xl overflow-hidden', className)}
        {...props}
      >
        {(title || description || headerAction) && (
          <div className="px-6 py-4 border-b border-white/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h3 className="text-lg font-semibold text-white">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-1 text-sm text-white/60">
                    {description}
                  </p>
                )}
              </div>
              {headerAction && (
                <div className="flex-shrink-0">
                  {headerAction}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-6">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-white/5 bg-white/5">
            {footer}
          </div>
        )}
      </div>
    )
  }
)

Panel.displayName = 'Panel'
