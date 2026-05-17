import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Car, Fuel, Gauge, Plus, RefreshCw, WalletCards } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { calculateFuelMetrics, resolveReminderDueDate } from '../utils/metrics'
import { Badge } from '../components/ui/badge'
import { buttonVariants } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { EmptyState } from '../components/ui/empty-state'
import { formatMoneyValue } from '../utils/currency'

type ReminderDisplayItem = {
  localId: string
  title: string
  effectiveDueDate: string
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

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
      .filter((entry) => entry.odometer != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return withOdometer[0]?.odometer
  }, [vehicleEntries])

  const fuel = useMemo(() => calculateFuelMetrics(vehicleEntries), [vehicleEntries])

  const reminders = useMemo(() => {
    const now = new Date()
    const upcoming: ReminderDisplayItem[] = []
    const overdue: ReminderDisplayItem[] = []
    for (const reminder of vehicleEntries.filter((entry) => entry.type === 'reminder' && !entry.completed)) {
      const due = resolveReminderDueDate(reminder, now)
      if (!due) {
        continue
      }
      const item = {
        localId: reminder.localId,
        title: reminder.title,
        effectiveDueDate: formatDate(due)
      }
      const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays < 0) {
        overdue.push(item)
      } else if (diffDays <= 30) {
        upcoming.push(item)
      }
    }
    upcoming.sort((a, b) => a.effectiveDueDate.localeCompare(b.effectiveDueDate))
    overdue.sort((a, b) => a.effectiveDueDate.localeCompare(b.effectiveDueDate))
    return { upcoming, overdue }
  }, [vehicleEntries])

  if (!activeVehicle) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={<Car className="h-5 w-5" aria-hidden="true" />}
            title="No vehicle selected"
            description="Add your first vehicle to start tracking expenses and maintenance."
            action={<Link to="/app/vehicles/new" className={buttonVariants()}>Add vehicle</Link>}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <section className="hero-panel rounded-[var(--radius-xl)] p-6">
        <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{activeVehicle.brand} {activeVehicle.model}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">{activeVehicle.year} / {activeVehicle.fuelType}</p>
          </div>
          <Link to={`/app/vehicles/${activeVehicle.localId}/add-entry`} className={buttonVariants({ size: 'lg' })}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add entry
          </Link>
        </div>

        <div className="relative z-[1] mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Spent this month', value: formatMoneyValue(totals.month), icon: WalletCards },
            { label: 'Spent all time', value: formatMoneyValue(totals.all), icon: WalletCards },
            { label: 'Latest odometer', value: latestOdometer ?? '-', icon: Gauge },
            { label: 'Latest L/100km', value: fuel.latest ?? '-', icon: Fuel },
            { label: 'Average L/100km', value: fuel.average ?? '-', icon: Fuel },
            { label: 'Open reminders', value: reminders.upcoming.length + reminders.overdue.length, icon: Bell }
          ].map((metric) => (
            <div key={metric.label} className="metric-card rounded-[var(--radius-lg)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
                <div className="icon-tile rounded-[var(--radius-md)] p-2">
                  <metric.icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Upcoming reminders</CardTitle>
                <CardDescription>Due in the next 30 days</CardDescription>
              </div>
              <Badge>{reminders.upcoming.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {reminders.upcoming.length === 0 ? (
              <EmptyState title="No upcoming reminders" description="Scheduled reminders due soon will appear here." />
            ) : (
              <ul className="grid gap-2">
                {reminders.upcoming.map((item) => (
                  <li key={item.localId} className="list-row flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm">
                    <span className="font-medium text-slate-800">{item.title}</span>
                    <span className="text-slate-500">{item.effectiveDueDate}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Overdue reminders</CardTitle>
                <CardDescription>Items that need attention</CardDescription>
              </div>
              <Badge variant={reminders.overdue.length > 0 ? 'danger' : 'neutral'}>{reminders.overdue.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {reminders.overdue.length === 0 ? (
              <EmptyState title="No overdue reminders" description="Overdue maintenance reminders will appear here." />
            ) : (
              <ul className="grid gap-2">
                {reminders.overdue.map((item) => (
                  <li key={item.localId} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-red-200 bg-[color:var(--danger-soft)] px-3 py-2 text-sm shadow-[var(--shadow-xs)]">
                    <span className="font-medium text-red-900">{item.title}</span>
                    <span className="text-red-700">{item.effectiveDueDate}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {syncMessage || isSyncing ? (
        <div className="notice inline-flex w-fit items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-slate-600">
          {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin text-blue-600" aria-hidden="true" /> : null}
          {isSyncing ? 'Syncing...' : syncMessage}
        </div>
      ) : null}
    </div>
  )
}
