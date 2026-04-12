import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

export function AppShell() {
  const { vehicles, activeVehicleLocalId, pendingSyncCount, isOnline } = useAppContext()
  const activeVehicle = vehicles.find((vehicle) => vehicle.localId === activeVehicleLocalId && !vehicle.deleted) ?? null

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>NMIVA</h1>
          <p>{activeVehicle ? `${activeVehicle.brand} ${activeVehicle.model}` : 'Select a vehicle'}</p>
        </div>
        <div className="status-chip-wrap">
          <span className={`status-chip ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <span className="status-chip neutral">
            Sync: {pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'synced'}
          </span>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/app" end>Dashboard</NavLink>
        <NavLink to="/app/vehicles">Vehicles</NavLink>
        <Link to={activeVehicle ? `/app/vehicles/${activeVehicle.localId}/add-entry` : '/app/vehicles/new'}>Add</Link>
        <NavLink to="/app/settings">Settings</NavLink>
      </nav>
    </div>
  )
}
