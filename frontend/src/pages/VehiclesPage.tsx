import { Link } from 'react-router-dom'
import { Car, CheckCircle2, Pencil, Plus, Timeline as TimelineIcon, Trash2 } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { Badge } from '../components/ui/badge'
import { Button, buttonVariants } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { EmptyState } from '../components/ui/empty-state'
import { StatusPill } from '../components/ui/status-pill'
import { formatKilometers } from '../utils/units'
import { getSyncStatusMeta } from '../utils/status'

export function VehiclesPage() {
  const { vehicles, activeVehicleLocalId, setActiveVehicle, deleteVehicle } = useAppContext()
  const visible = vehicles.filter((vehicle) => !vehicle.deleted)

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">Garage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Manage profiles, pick the default for new entries, and open each vehicle timeline.</p>
        </div>
        <Link className={buttonVariants({ size: 'lg' })} to="/app/vehicles/new">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add vehicle
        </Link>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent>
              <EmptyState
                icon={<Car className="h-5 w-5" aria-hidden="true" />}
                title="No profiles yet"
                description="Add your first vehicle to start tracking fuel, services, expenses, and reminders."
                action={<Link className={buttonVariants()} to="/app/vehicles/new">Add vehicle</Link>}
              />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visible.map((vehicle) => (
            <Card key={vehicle.localId} className="list-row transition-all duration-150">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="icon-tile flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]">
                      <Car className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <CardTitle className="truncate text-lg">{vehicle.brand} {vehicle.model}</CardTitle>
                    {activeVehicleLocalId === vehicle.localId ? <Badge variant="success">Current</Badge> : null}
                  </div>
                  <CardDescription className="pl-11">{vehicle.year} / {vehicle.fuelType} / ODO {formatKilometers(vehicle.odometerStart)}</CardDescription>
                </div>
                <VehicleSyncStatus syncStatus={vehicle.syncStatus} />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {activeVehicleLocalId !== vehicle.localId ? (
                    <Button type="button" onClick={() => void setActiveVehicle(vehicle.localId)}>
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Make current
                    </Button>
                  ) : null}
                  <Link className={buttonVariants({ variant: 'secondary' })} to={`/app/vehicles/${vehicle.localId}`}>
                    <TimelineIcon className="h-4 w-4" aria-hidden="true" />
                    Timeline
                  </Link>
                  <Link className={buttonVariants({ variant: 'secondary' })} to={`/app/vehicles/${vehicle.localId}/edit`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </Link>
                  <Button type="button" variant="destructive" onClick={() => void deleteVehicle(vehicle.localId)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function VehicleSyncStatus({ syncStatus }: { syncStatus: Parameters<typeof getSyncStatusMeta>[0] }) {
  const meta = getSyncStatusMeta(syncStatus)

  return (
    <StatusPill tone={meta.tone} prefix="Sync" compact>
      {meta.label}
    </StatusPill>
  )
}
