import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

type StatusPillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone
  prefix?: string
  compact?: boolean
  children: ReactNode
}

export function StatusPill({
  tone = 'neutral',
  prefix,
  compact = false,
  className,
  children,
  ...props
}: StatusPillProps) {
  return (
    <span
      className={cn('status-pill', compact && 'status-pill-compact', className)}
      data-status-tone={tone}
      {...props}
    >
      <span className="status-pill-dot" aria-hidden="true" />
      <span>
        {prefix ? <>{prefix}: {children}</> : children}
      </span>
    </span>
  )
}
