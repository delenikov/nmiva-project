import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CalendarClock,
  Droplets,
  Fuel,
  Gauge,
  Pencil,
  ReceiptText,
  Trash2,
  Wrench
} from 'lucide-react'
import type { EntryRecord, EntryType } from '../../types/models'
import { Badge } from '../ui/badge'
import { Button, buttonVariants } from '../ui/button'
import { StatusPill } from '../ui/status-pill'
import { formatMoneyValue, formatPricePerLiterValue } from '../../utils/currency'
import { formatKilometers } from '../../utils/units'
import { cn } from '../../utils/cn'
import { getTimelineDate, groupEntriesByMonth } from '../../utils/timeline'
import { getSyncStatusMeta, type StatusMeta } from '../../utils/status'

interface FuelioTimelineProps {
  entries: EntryRecord[]
  getEditHref: (entry: EntryRecord) => string
  onDelete: (entry: EntryRecord) => void
}

interface EntryTypeConfig {
  label: string
  icon: ReactNode
  badgeVariant: 'neutral' | 'success' | 'warning' | 'info'
}

const entryTypeConfig: Record<EntryType, EntryTypeConfig> = {
  refuel: {
    label: 'Refuel',
    icon: <Fuel className="h-5 w-5" aria-hidden="true" />,
    badgeVariant: 'success'
  },
  service: {
    label: 'Service',
    icon: <Wrench className="h-5 w-5" aria-hidden="true" />,
    badgeVariant: 'info'
  },
  expense: {
    label: 'Expense',
    icon: <ReceiptText className="h-5 w-5" aria-hidden="true" />,
    badgeVariant: 'warning'
  },
  reminder: {
    label: 'Reminder',
    icon: <Bell className="h-5 w-5" aria-hidden="true" />,
    badgeVariant: 'neutral'
  }
}

export function FuelioTimeline({ entries, getEditHref, onDelete }: FuelioTimelineProps) {
  const groups = groupEntriesByMonth(entries)

  return (
    <div className="fuelio-timeline" role="list" aria-label="Vehicle event timeline">
      {groups.map((group) => (
        <section className="timeline-month" key={group.id} aria-labelledby={`timeline-month-${group.id}`}>
          <div className="timeline-month-marker" role="separator" aria-label={group.label}>
            <div className="timeline-rail" aria-hidden="true">
              <span className="timeline-month-dot" />
            </div>
            <div className="timeline-month-header" id={`timeline-month-${group.id}`}>
              <span>{group.label}</span>
              <span className="timeline-month-count">{group.entries.length}</span>
            </div>
          </div>

          <ol className="timeline-entry-list">
            {group.entries.map((entry) => (
              <TimelineEntry
                key={entry.localId}
                entry={entry}
                editHref={getEditHref(entry)}
                onDelete={() => onDelete(entry)}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

interface TimelineEntryProps {
  entry: EntryRecord
  editHref: string
  onDelete: () => void
}

function TimelineEntry({ entry, editHref, onDelete }: TimelineEntryProps) {
  const config = entryTypeConfig[entry.type]
  const details = getEntryDetails(entry)
  const timelineDate = getTimelineDate(entry)

  return (
    <li className="timeline-item" role="listitem" data-entry-type={entry.type}>
      <div className="timeline-rail" aria-hidden="true">
        <span className="timeline-node">{config.icon}</span>
      </div>

      <article className="timeline-card" aria-labelledby={`timeline-entry-${entry.localId}`}>
        <header className="timeline-card-header">
          <div className="min-w-0">
            <div className="timeline-card-title-row">
              <h3 className="timeline-card-title" id={`timeline-entry-${entry.localId}`}>{entry.title}</h3>
              <Badge variant={config.badgeVariant}>{config.label}</Badge>
            </div>
            <p className="timeline-card-date">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              <time dateTime={timelineDate}>{timelineDate}</time>
            </p>
          </div>

          <div className="timeline-actions">
            <Link className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'timeline-icon-button')} to={editHref} aria-label={`Edit ${entry.title}`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Button type="button" variant="ghost" size="sm" className="timeline-icon-button timeline-delete-button" onClick={onDelete} aria-label={`Delete ${entry.title}`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <dl className="timeline-detail-grid">
          {details.map((detail) => (
            <div className="timeline-detail" key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>

        {entry.notes ? <p className="timeline-notes">{entry.notes}</p> : null}

        <footer className="timeline-sync-row">
          <TimelineStatusPill meta={getSyncStatusMeta(entry.syncStatus)} prefix="Sync" compact />
        </footer>
      </article>
    </li>
  )
}

function getEntryDetails(entry: EntryRecord): Array<{ label: string; value: ReactNode }> {
  if (entry.type === 'refuel') {
    return [
      { label: 'Cost', value: formatMoneyValue(entry.cost) },
      { label: 'Fuel', value: entry.liters != null ? <><Droplets className="h-3.5 w-3.5" aria-hidden="true" />{entry.liters} L</> : '-' },
      { label: 'Odometer', value: entry.odometer != null ? <><Gauge className="h-3.5 w-3.5" aria-hidden="true" />{formatKilometers(entry.odometer)}</> : '-' },
      { label: 'Price', value: formatPricePerLiterValue(entry.pricePerLiter) }
    ]
  }

  if (entry.type === 'service') {
    return [
      { label: 'Cost', value: formatMoneyValue(entry.cost) },
      { label: 'Category', value: entry.serviceCategory ?? 'other' },
      { label: 'Odometer', value: entry.odometer != null ? <><Gauge className="h-3.5 w-3.5" aria-hidden="true" />{formatKilometers(entry.odometer)}</> : '-' }
    ]
  }

  if (entry.type === 'expense') {
    return [
      { label: 'Cost', value: formatMoneyValue(entry.cost) },
      { label: 'Category', value: entry.expenseCategory ?? 'other' },
      { label: 'Odometer', value: entry.odometer != null ? <><Gauge className="h-3.5 w-3.5" aria-hidden="true" />{formatKilometers(entry.odometer)}</> : '-' }
    ]
  }

  return [
    { label: 'Due', value: entry.dueDate ?? entry.date },
    { label: 'Status', value: <TimelineStatusPill meta={getReminderStatusMeta(entry)} /> },
    { label: 'Cost', value: formatMoneyValue(entry.cost) }
  ]
}

function TimelineStatusPill({ meta, prefix, compact = false }: { meta: StatusMeta; prefix?: string; compact?: boolean }) {
  return (
    <StatusPill tone={meta.tone} prefix={prefix} compact={compact}>
      {meta.label}
    </StatusPill>
  )
}

function getReminderStatusMeta(entry: EntryRecord): StatusMeta {
  if (entry.completed) {
    return { label: 'Completed', tone: 'success' }
  }

  if (entry.dueDate && entry.dueDate < new Date().toISOString().slice(0, 10)) {
    return { label: 'Overdue', tone: 'danger' }
  }

  return { label: 'Pending', tone: 'warning' }
}
