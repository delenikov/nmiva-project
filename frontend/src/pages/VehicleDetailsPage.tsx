import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarClock, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import type { EntryRecord, EntryType } from '../types/models'
import { Badge } from '../components/ui/badge'
import { Button, buttonVariants } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { EmptyState } from '../components/ui/empty-state'
import { formatMoneyValue, formatPricePerLiterValue } from '../utils/currency'

const TYPE_FILTERS: Array<'all' | EntryType> = ['all', 'refuel', 'service', 'expense', 'reminder']

function describeEntry(entry: EntryRecord): string {
  if (entry.type === 'refuel') {
    return `${entry.date} / ODO ${entry.odometer ?? '-'} / ${entry.liters ?? '-'} L / ${formatMoneyValue(entry.cost)} / ${formatPricePerLiterValue(entry.pricePerLiter)}`
  }
  if (entry.type === 'service') {
    return `${entry.date} / ${entry.serviceCategory ?? 'other'} / ODO ${entry.odometer ?? '-'} / ${formatMoneyValue(entry.cost)}`
  }
  if (entry.type === 'expense') {
    return `${entry.date} / ${entry.expenseCategory ?? 'other'} / ${formatMoneyValue(entry.cost)}`
  }
  return `${entry.dueDate ?? entry.date} / ${entry.completed ? 'completed' : 'pending'}`
}

function entryBadgeVariant(type: EntryType) {
  if (type === 'refuel') {
    return 'success' as const
  }
  if (type === 'service') {
    return 'info' as const
  }
  if (type === 'expense') {
    return 'warning' as const
  }
  return 'neutral' as const
}

export function VehicleDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { vehicles, entries, deleteEntry } = useAppContext()
  const [filter, setFilter] = useState<'all' | EntryType>('all')

  const vehicle = vehicles.find((item) => item.localId === id && !item.deleted) ?? null
  const timeline = useMemo(() => {
    if (!vehicle) {
      return []
    }
    return entries
      .filter((entry) => !entry.deleted && entry.vehicleLocalId === vehicle.localId)
      .filter((entry) => filter === 'all' || entry.type === filter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [vehicle, entries, filter])

  if (!vehicle) {
    return (
      <Card>
        <CardContent>
          <EmptyState title="Vehicle not found" description="The requested vehicle is unavailable or was removed." />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <section className="hero-panel rounded-[var(--radius-xl)] p-6">
        <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{vehicle.brand} {vehicle.model}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">{vehicle.year} / {vehicle.fuelType}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonVariants()} to={`/app/vehicles/${vehicle.localId}/add-entry`}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add entry
            </Link>
            <Link className={buttonVariants({ variant: 'secondary' })} to={`/app/vehicles/${vehicle.localId}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit vehicle
            </Link>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Fuel, services, expenses, and reminders sorted by newest first.</CardDescription>
              </div>
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={filter === item ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setFilter(item)}
                >
                  <span className="capitalize">{item}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
              title="No entries for this filter"
              description="Entries that match the selected timeline filter will appear here."
            />
          ) : (
            <ul className="grid gap-3">
              {timeline.map((entry) => (
                <li key={entry.localId} className="list-row rounded-[var(--radius-lg)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold tracking-[-0.01em] text-slate-950">{entry.title}</h4>
                        <Badge variant={entryBadgeVariant(entry.type)}>{entry.type}</Badge>
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <CalendarClock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        {describeEntry(entry)}
                      </p>
                      {entry.notes ? <p className="mt-2 text-sm leading-6 text-slate-500">{entry.notes}</p> : null}
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">Sync: {entry.syncStatus}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link className={buttonVariants({ variant: 'secondary', size: 'sm' })} to={`/app/entries/${entry.localId}/edit`}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Link>
                      <Button type="button" variant="destructive" size="sm" onClick={() => void deleteEntry(entry.localId)}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
