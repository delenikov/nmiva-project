import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Car, LayoutDashboard, Plus, Settings, Wifi, WifiOff } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { Badge } from './ui/badge'
import { cn } from '../utils/cn'

export function AppShell() {
  const { vehicles, activeVehicleLocalId, pendingSyncCount, isOnline } = useAppContext()
  const { pathname } = useLocation()
  const activeVehicle = vehicles.find((vehicle) => vehicle.localId === activeVehicleLocalId && !vehicle.deleted) ?? null
  const pageTitle = getPageTitle(pathname)
  const navLinkClass = ({ isActive }: { isActive: boolean }) => cn(
    'flex min-h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]',
    isActive && 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] shadow-[var(--shadow-xs)] ring-1 ring-blue-100'
  )
  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) => cn(
    'flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]',
    isActive && 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
  )

  return (
    <div className="app-bg min-h-screen text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-[color:var(--border)] bg-white/90 px-4 py-5 shadow-[var(--shadow-sm)] backdrop-blur-xl lg:flex lg:flex-col">
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-slate-950 text-white shadow-[var(--shadow-sm)] ring-1 ring-slate-900/10">
            <Car className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.12em] text-slate-950">NMIVA</h1>
            <p className="text-xs font-medium text-slate-500">Maintenance tracker</p>
          </div>
        </div>

        <nav className="mt-8 grid gap-1.5">
          <p className="px-3 pb-1 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-slate-400">Navigation</p>
          <NavLink to="/app" end className={navLinkClass}>
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </NavLink>
          <NavLink to="/app/vehicles" className={navLinkClass}>
            <Car className="h-4 w-4" aria-hidden="true" />
            Garage
          </NavLink>
          <Link
            to={activeVehicle ? `/app/vehicles/${activeVehicle.localId}/add-entry` : '/app/vehicles/new'}
            className="flex min-h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </Link>
          <NavLink to="/app/settings" className={navLinkClass}>
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </NavLink>
        </nav>

        <div className="mt-auto rounded-[var(--radius-xl)] border border-[color:var(--border)] bg-slate-50/80 p-4 shadow-[var(--shadow-xs)]">
          <p className="section-kicker">Current</p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-950">
            {activeVehicle ? `${activeVehicle.brand} ${activeVehicle.model}` : 'Select a vehicle'}
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-[color:var(--border)] bg-white/90 px-4 py-3 shadow-[var(--shadow-xs)] backdrop-blur-xl lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-[-0.01em] text-slate-950">
                {pageTitle}
              </h1>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant={isOnline ? 'success' : 'danger'} className="gap-1.5">
                {isOnline ? <Wifi className="h-3.5 w-3.5" aria-hidden="true" /> : <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              <Badge variant={pendingSyncCount > 0 ? 'warning' : 'neutral'}>
                Sync: {pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'synced'}
              </Badge>
            </div>
          </div>
        </header>

        <main className="animate-enter mx-auto w-full max-w-6xl px-4 py-6 pb-24 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-[color:var(--border)] bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
        <NavLink to="/app" end className={mobileNavLinkClass}>
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          <span className="hidden min-[360px]:inline">Dashboard</span>
        </NavLink>
        <NavLink to="/app/vehicles" className={mobileNavLinkClass}>
          <Car className="h-4 w-4" aria-hidden="true" />
          <span className="hidden min-[360px]:inline">Garage</span>
        </NavLink>
        <Link
          to={activeVehicle ? `/app/vehicles/${activeVehicle.localId}/add-entry` : '/app/vehicles/new'}
          className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden min-[360px]:inline">Add</span>
        </Link>
        <NavLink to="/app/settings" className={mobileNavLinkClass}>
          <Settings className="h-4 w-4" aria-hidden="true" />
          <span className="hidden min-[360px]:inline">Settings</span>
        </NavLink>
      </nav>
    </div>
  )
}

function getPageTitle(pathname: string): string {
  const normalizedPath = pathname.replace(/\/+$/, '')

  if (normalizedPath === '/app') {
    return 'Dashboard'
  }

  if (normalizedPath === '/app/vehicles') {
    return 'Garage'
  }

  if (normalizedPath === '/app/vehicles/new') {
    return 'Add vehicle'
  }

  if (normalizedPath.endsWith('/edit')) {
    return normalizedPath.startsWith('/app/entries/') ? 'Edit entry' : 'Edit vehicle'
  }

  if (normalizedPath.endsWith('/add-entry')) {
    return 'Add entry'
  }

  if (normalizedPath.startsWith('/app/vehicles/')) {
    return 'History'
  }

  if (normalizedPath === '/app/settings') {
    return 'Settings'
  }

  return 'Dashboard'
}
