import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type BadgeVariant = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const variants: Record<BadgeVariant, string> = {
  neutral: 'border-[color:var(--border)] bg-[color:var(--surface-muted)] text-slate-700',
  success: 'border-emerald-200 bg-[color:var(--success-soft)] text-[color:var(--success)]',
  danger: 'border-red-200 bg-[color:var(--danger-soft)] text-[color:var(--danger)]',
  warning: 'border-amber-200 bg-[color:var(--warning-soft)] text-[color:var(--warning)]',
  info: 'border-blue-200 bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center rounded-full border px-2.5 text-xs font-medium leading-none',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
