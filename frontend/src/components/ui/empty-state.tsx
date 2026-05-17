import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-muted)] px-6 py-10 text-center">
      {icon ? <div className="icon-tile mb-3 rounded-[var(--radius-lg)] p-2">{icon}</div> : null}
      <h3 className="text-sm font-semibold tracking-[-0.01em] text-slate-950">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
