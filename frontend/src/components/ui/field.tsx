import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('grid gap-2 text-sm font-semibold text-slate-700', className)} {...props} />
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'min-h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 text-sm text-slate-950 shadow-[var(--shadow-xs)] transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-[color:var(--ring)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'min-h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 text-sm text-slate-950 shadow-[var(--shadow-xs)] transition-all hover:border-slate-400 focus:border-[color:var(--ring)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-[var(--radius-md)] border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-2 text-sm text-slate-950 shadow-[var(--shadow-xs)] transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-[color:var(--ring)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        className
      )}
      {...props}
    />
  )
}
