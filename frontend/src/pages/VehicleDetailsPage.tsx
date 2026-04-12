import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import type { EntryRecord, EntryType } from '../types/models'

const TYPE_FILTERS: Array<'all' | EntryType> = ['all', 'refuel', 'service', 'expense', 'reminder']

function describeEntry(entry: EntryRecord): string {
  if (entry.type === 'refuel') {
    return `${entry.date} • ODO ${entry.odometer ?? '-'} • ${entry.liters ?? '-'}L • ${entry.cost ?? '-'}`
  }
  if (entry.type === 'service') {
    return `${entry.date} • ${entry.serviceCategory ?? 'other'} • ODO ${entry.odometer ?? '-'} • ${entry.cost ?? '-'}`
  }
  if (entry.type === 'expense') {
    return `${entry.date} • ${entry.expenseCategory ?? 'other'} • ${entry.cost ?? '-'}`
  }
  return `${entry.dueDate ?? entry.date} • ${entry.completed ? 'completed' : 'pending'}`
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
      <section className="card">
        <p>Vehicle not found.</p>
      </section>
    )
  }

  return (
    <div className="stack">
      <section className="card row-between">
        <div>
          <h2>{vehicle.brand} {vehicle.model}</h2>
          <p>{vehicle.year} • {vehicle.fuelType}</p>
        </div>
        <div className="action-group">
          <Link className="button-link" to={`/app/vehicles/${vehicle.localId}/add-entry`}>Add entry</Link>
          <Link className="button-link ghost" to={`/app/vehicles/${vehicle.localId}/edit`}>Edit vehicle</Link>
        </div>
      </section>

      <section className="card">
        <h3>History timeline</h3>
        <div className="filter-row">
          {TYPE_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? 'active' : ''}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {timeline.length === 0 ? (
          <p className="muted">No entries for this filter.</p>
        ) : (
          <ul className="timeline">
            {timeline.map((entry) => (
              <li key={entry.localId} className={`timeline-item ${entry.type}`}>
                <h4>{entry.title}</h4>
                <p>{describeEntry(entry)}</p>
                {entry.notes ? <p className="muted">{entry.notes}</p> : null}
                <small>Sync: {entry.syncStatus}</small>
                <div className="action-group">
                  <Link className="button-link ghost" to={`/app/entries/${entry.localId}/edit`}>Edit</Link>
                  <button type="button" className="danger" onClick={() => void deleteEntry(entry.localId)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
