import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export const buttonVariants = cva(
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-semibold tracking-[-0.01em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border border-[color:var(--accent-strong)] bg-[color:var(--accent)] text-white shadow-[var(--shadow-sm)] hover:bg-[color:var(--accent-strong)] hover:shadow-[var(--shadow-md)]',
        secondary: 'border border-[color:var(--border-strong)] bg-[color:var(--surface)] text-slate-800 shadow-[var(--shadow-xs)] hover:border-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] hover:text-slate-950',
        ghost: 'border border-transparent bg-transparent text-slate-700 hover:bg-slate-100/80 hover:text-slate-950',
        destructive: 'border border-[color:var(--danger-strong)] bg-[color:var(--danger)] text-white shadow-[var(--shadow-sm)] hover:bg-[color:var(--danger-strong)] hover:shadow-[var(--shadow-md)]'
      },
      size: {
        sm: 'min-h-8 px-2.5 text-xs',
        md: 'min-h-9 px-3 text-sm',
        lg: 'min-h-10 px-4 text-sm'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
