import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClipboardList, Pencil, Plus } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import type { EntryRecord, EntryType } from '../types/models'
import { Button, buttonVariants } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { EmptyState } from '../components/ui/empty-state'
import { FuelioTimeline } from '../components/timeline/FuelioTimeline'
import { cn } from '../utils/cn'

const TYPE_FILTERS: Array<'all' | EntryType> = ['all', 'refuel', 'service', 'expense', 'reminder']

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
    <div className="fuelio-timeline-view grid gap-5">
      <section className="hero-panel rounded-[var(--radius-xl)] p-6">
        <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{vehicle.brand} {vehicle.model}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">{vehicle.year} / {vehicle.fuelType}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={cn(buttonVariants(), 'hidden sm:inline-flex')} to={`/app/vehicles/${vehicle.localId}/add-entry`}>
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

      <section className="timeline-shell" aria-labelledby="vehicle-timeline-heading">
        <div className="timeline-toolbar">
          <div>
            <p className="section-kicker">Timeline</p>
            <h2 id="vehicle-timeline-heading" className="timeline-heading">Timeline</h2>
          </div>
          <div className="timeline-filter-bar" role="group" aria-label="Timeline filters">
            {TYPE_FILTERS.map((item) => (
              <Button
                key={item}
                type="button"
                variant={filter === item ? 'default' : 'secondary'}
                size="sm"
                className="timeline-filter-button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                <span className="capitalize">{item}</span>
              </Button>
            ))}
          </div>
        </div>

        {timeline.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
                title="No entries for this filter"
                description="Entries that match the selected timeline filter will appear here."
              />
            </CardContent>
          </Card>
        ) : (
          <FuelioTimeline
            entries={timeline}
            getEditHref={(entry: EntryRecord) => `/app/entries/${entry.localId}/edit`}
            onDelete={(entry: EntryRecord) => void deleteEntry(entry.localId)}
          />
        )}
      </section>

      <Link className="timeline-fab" to={`/app/vehicles/${vehicle.localId}/add-entry`} aria-label="Add entry">
        <Plus className="h-6 w-6" aria-hidden="true" />
      </Link>
    </div>
  )
}
