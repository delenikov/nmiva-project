import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { calculateFuelMetrics, resolveReminderDueDate } from '../utils/metrics'

export function DashboardPage() {
  const {
    vehicles,
    entries,
    activeVehicleLocalId,
    setActiveVehicle,
    syncMessage,
    isSyncing
  } = useAppContext()

  const activeVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.localId === activeVehicleLocalId && !vehicle.deleted) ?? null,
    [vehicles, activeVehicleLocalId]
  )

  useEffect(() => {
    if (!activeVehicle && vehicles.length > 0) {
      const first = vehicles.find((vehicle) => !vehicle.deleted)
      if (first) {
        void setActiveVehicle(first.localId)
      }
    }
  }, [activeVehicle, vehicles, setActiveVehicle])

  const vehicleEntries = useMemo(
    () => activeVehicle
      ? entries.filter((entry) => !entry.deleted && entry.vehicleLocalId === activeVehicle.localId)
      : [],
    [entries, activeVehicle]
  )

  const totals = useMemo(() => {
    const today = new Date()
    const month = today.getMonth()
    const year = today.getFullYear()
    let totalMonth = 0
    let totalAll = 0
    for (const entry of vehicleEntries) {
      if (entry.cost === undefined || entry.type === 'reminder') {
        continue
      }
      totalAll += entry.cost
      const entryDate = new Date(entry.date)
      if (entryDate.getMonth() === month && entryDate.getFullYear() === year) {
        totalMonth += entry.cost
      }
    }
    return {
      month: totalMonth.toFixed(2),
      all: totalAll.toFixed(2)
    }
  }, [vehicleEntries])

  const latestOdometer = useMemo(() => {
    const withOdometer = vehicleEntries
      .filter((entry) => entry.odometer !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return withOdometer[0]?.odometer
  }, [vehicleEntries])

  const fuel = useMemo(() => calculateFuelMetrics(vehicleEntries), [vehicleEntries])

  const reminders = useMemo(() => {
    const now = new Date()
    const upcoming: typeof vehicleEntries = []
    const overdue: typeof vehicleEntries = []
    for (const reminder of vehicleEntries.filter((entry) => entry.type === 'reminder' && !entry.completed)) {
      const due = resolveReminderDueDate(reminder, now)
      if (!due) {
        continue
      }
      const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays < 0) {
        overdue.push(reminder)
      } else if (diffDays <= 30) {
        upcoming.push(reminder)
      }
    }
    upcoming.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    overdue.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    return { upcoming, overdue }
  }, [vehicleEntries])

  if (!activeVehicle) {
    return (
      <section className="card">
        <h2>No vehicle selected</h2>
        <p>Add your first vehicle to start tracking expenses and maintenance.</p>
        <Link to="/app/vehicles/new" className="button-link">Add vehicle</Link>
      </section>
    )
  }

  return (
    <div className="stack">
      <section className="card">
        <h2>{activeVehicle.brand} {activeVehicle.model}</h2>
        <p>{activeVehicle.year} • {activeVehicle.fuelType}</p>
        <div className="grid-2">
          <div>
            <strong>{totals.month}</strong>
            <p>Spent this month</p>
          </div>
          <div>
            <strong>{totals.all}</strong>
            <p>Spent all time</p>
          </div>
          <div>
            <strong>{latestOdometer ?? '-'}</strong>
            <p>Latest odometer</p>
          </div>
          <div>
            <strong>{fuel.latest ?? '-'}</strong>
            <p>Latest L/100km</p>
          </div>
          <div>
            <strong>{fuel.average ?? '-'}</strong>
            <p>Average L/100km</p>
          </div>
          <div>
            <strong>{reminders.upcoming.length + reminders.overdue.length}</strong>
            <p>Open reminders</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Upcoming reminders (30 days)</h3>
        {reminders.upcoming.length === 0 ? <p className="muted">No upcoming reminders.</p> : (
          <ul className="list">
            {reminders.upcoming.map((item) => (
              <li key={item.localId}>{item.title} • {item.dueDate}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Overdue reminders</h3>
        {reminders.overdue.length === 0 ? <p className="muted">No overdue reminders.</p> : (
          <ul className="list">
            {reminders.overdue.map((item) => (
              <li key={item.localId}>{item.title} • {item.dueDate}</li>
            ))}
          </ul>
        )}
      </section>

      {syncMessage || isSyncing ? <p className="helper">{isSyncing ? 'Syncing...' : syncMessage}</p> : null}
    </div>
  )
}
