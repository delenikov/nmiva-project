import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { fetchMe, getApiBaseUrl } from '../services/api'
import { clearAuth, getStoredUser, getToken, saveAuth } from '../services/authStore'
import {
  addQueueItem,
  getMeta,
  putEntry,
  putVehicle,
  queueCount,
  removeEntry,
  removeQueueItemsForLocal,
  removeVehicle,
  setMeta,
  snapshot,
  getVehicle,
  getEntry
} from '../services/localDb'
import { triggerSync } from '../services/syncWorkerClient'
import type { EntryRecord, PendingSyncItem, UserMe, VehicleRecord } from '../types/models'
import { makeLocalId } from '../utils/id'

type VehicleInput = {
  brand: string
  model: string
  year: number
  fuelType: string
  odometerStart: number
}

type EntryInput = {
  vehicleLocalId: string
  type: EntryRecord['type']
  date: string
  title: string
  notes?: string
  odometer?: number
  cost?: number
  liters?: number
  pricePerLiter?: number
  isFullTank: boolean
  serviceCategory?: EntryRecord['serviceCategory']
  expenseCategory?: EntryRecord['expenseCategory']
  dueDate?: string
  repeatYearly: boolean
  completed: boolean
}

type AppContextValue = {
  token: string | null
  user: UserMe | null
  isAuthenticated: boolean
  isOnline: boolean
  isSyncing: boolean
  syncMessage: string | null
  vehicles: VehicleRecord[]
  entries: EntryRecord[]
  activeVehicleLocalId: string | null
  pendingSyncCount: number
  loginSuccess: (token: string, user: UserMe) => Promise<void>
  logout: () => void
  setActiveVehicle: (localId: string | null) => Promise<void>
  createVehicle: (input: VehicleInput) => Promise<void>
  updateVehicle: (localId: string, input: VehicleInput) => Promise<void>
  deleteVehicle: (localId: string) => Promise<void>
  createEntry: (input: EntryInput) => Promise<void>
  updateEntry: (localId: string, input: EntryInput) => Promise<void>
  deleteEntry: (localId: string) => Promise<void>
  refreshLocalState: () => Promise<void>
  syncNow: () => Promise<void>
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

const nowIso = (): string => new Date().toISOString()

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<UserMe | null>(() => getStoredUser())
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [entries, setEntries] = useState<EntryRecord[]>([])
  const [activeVehicleLocalId, setActiveVehicleLocalId] = useState<string | null>(null)
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0)

  async function refreshLocalState(): Promise<void> {
    const data = await snapshot()
    setVehicles(data.vehicles)
    setEntries(data.entries)
    setPendingSyncCount(data.pendingSyncCount)
    const active = await getMeta('activeVehicleLocalId')
    setActiveVehicleLocalId(active && active.length > 0 ? active : null)
  }

  async function syncNow(): Promise<void> {
    if (!token || !navigator.onLine || isSyncing) {
      return
    }
    setIsSyncing(true)
    try {
      const result = await triggerSync(token, getApiBaseUrl())
      setSyncMessage(result.ok ? `Synced ${result.syncedCount} change(s)` : result.message ?? 'Sync failed')
      await refreshLocalState()
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  async function queueMutation(item: PendingSyncItem): Promise<void> {
    await addQueueItem(item)
    setPendingSyncCount(await queueCount())
  }

  async function setActiveVehicle(localId: string | null): Promise<void> {
    if (localId) {
      await setMeta('activeVehicleLocalId', localId)
      setActiveVehicleLocalId(localId)
      return
    }
    await setMeta('activeVehicleLocalId', '')
    setActiveVehicleLocalId(null)
  }

  async function createVehicle(input: VehicleInput): Promise<void> {
    const localId = makeLocalId('vehicle')
    const record: VehicleRecord = {
      localId,
      serverId: null,
      brand: input.brand,
      model: input.model,
      year: input.year,
      fuelType: input.fuelType,
      odometerStart: input.odometerStart,
      deleted: false,
      syncStatus: 'pending_create',
      lastModifiedAt: nowIso(),
      lastSyncedAt: null
    }
    await putVehicle(record)
    await queueMutation({
      entityType: 'vehicle',
      operation: 'create',
      localId,
      serverId: null,
      payload: {
        brand: record.brand,
        model: record.model,
        year: record.year,
        fuelType: record.fuelType,
        odometerStart: record.odometerStart
      },
      lastModifiedAt: record.lastModifiedAt,
      attempts: 0
    })
    await refreshLocalState()
    await syncNow()
  }

  async function updateVehicle(localId: string, input: VehicleInput): Promise<void> {
    const current = await getVehicle(localId)
    if (!current) {
      return
    }
    const updated: VehicleRecord = {
      ...current,
      ...input,
      syncStatus: current.serverId ? 'pending_update' : 'pending_create',
      lastModifiedAt: nowIso()
    }
    await putVehicle(updated)
    await removeQueueItemsForLocal('vehicle', localId)
    await queueMutation({
      entityType: 'vehicle',
      operation: current.serverId ? 'update' : 'create',
      localId,
      serverId: current.serverId,
      payload: {
        brand: updated.brand,
        model: updated.model,
        year: updated.year,
        fuelType: updated.fuelType,
        odometerStart: updated.odometerStart
      },
      lastModifiedAt: updated.lastModifiedAt,
      attempts: 0
    })
    await refreshLocalState()
    await syncNow()
  }

  async function deleteVehicle(localId: string): Promise<void> {
    const current = await getVehicle(localId)
    if (!current) {
      return
    }
    if (!current.serverId) {
      await removeVehicle(localId)
      await removeQueueItemsForLocal('vehicle', localId)
      await refreshLocalState()
      return
    }
    current.deleted = true
    current.syncStatus = 'pending_delete'
    current.lastModifiedAt = nowIso()
    await putVehicle(current)
    await removeQueueItemsForLocal('vehicle', localId)
    await queueMutation({
      entityType: 'vehicle',
      operation: 'delete',
      localId,
      serverId: current.serverId,
      payload: {},
      lastModifiedAt: current.lastModifiedAt,
      attempts: 0
    })
    await refreshLocalState()
    await syncNow()
  }

  async function createEntry(input: EntryInput): Promise<void> {
    const vehicle = await getVehicle(input.vehicleLocalId)
    if (!vehicle) {
      throw new Error('Vehicle not found')
    }
    const localId = makeLocalId('entry')
    const record: EntryRecord = {
      localId,
      serverId: null,
      vehicleLocalId: vehicle.localId,
      vehicleServerId: vehicle.serverId,
      type: input.type,
      date: input.date,
      title: input.title,
      notes: input.notes,
      odometer: input.odometer,
      cost: input.cost,
      liters: input.liters,
      pricePerLiter: input.pricePerLiter,
      isFullTank: input.isFullTank,
      serviceCategory: input.serviceCategory,
      expenseCategory: input.expenseCategory,
      dueDate: input.dueDate,
      repeatYearly: input.repeatYearly,
      completed: input.completed,
      deleted: false,
      syncStatus: 'pending_create',
      lastModifiedAt: nowIso(),
      lastSyncedAt: null
    }
    await putEntry(record)
    await queueMutation({
      entityType: 'entry',
      operation: 'create',
      localId,
      serverId: null,
      payload: {
        vehicleLocalId: record.vehicleLocalId,
        type: record.type,
        date: record.date,
        title: record.title,
        notes: record.notes,
        odometer: record.odometer,
        cost: record.cost,
        liters: record.liters,
        pricePerLiter: record.pricePerLiter,
        isFullTank: record.isFullTank,
        serviceCategory: record.serviceCategory,
        expenseCategory: record.expenseCategory,
        dueDate: record.dueDate,
        repeatYearly: record.repeatYearly,
        completed: record.completed
      },
      lastModifiedAt: record.lastModifiedAt,
      attempts: 0
    })
    await refreshLocalState()
    await syncNow()
  }

  async function updateEntry(localId: string, input: EntryInput): Promise<void> {
    const current = await getEntry(localId)
    if (!current) {
      return
    }
    const updated: EntryRecord = {
      ...current,
      ...input,
      vehicleLocalId: input.vehicleLocalId,
      syncStatus: current.serverId ? 'pending_update' : 'pending_create',
      lastModifiedAt: nowIso()
    }
    const vehicle = await getVehicle(input.vehicleLocalId)
    updated.vehicleServerId = vehicle?.serverId ?? null
    await putEntry(updated)
    await removeQueueItemsForLocal('entry', localId)
    await queueMutation({
      entityType: 'entry',
      operation: current.serverId ? 'update' : 'create',
      localId,
      serverId: current.serverId,
      payload: {
        vehicleLocalId: updated.vehicleLocalId,
        type: updated.type,
        date: updated.date,
        title: updated.title,
        notes: updated.notes,
        odometer: updated.odometer,
        cost: updated.cost,
        liters: updated.liters,
        pricePerLiter: updated.pricePerLiter,
        isFullTank: updated.isFullTank,
        serviceCategory: updated.serviceCategory,
        expenseCategory: updated.expenseCategory,
        dueDate: updated.dueDate,
        repeatYearly: updated.repeatYearly,
        completed: updated.completed
      },
      lastModifiedAt: updated.lastModifiedAt,
      attempts: 0
    })
    await refreshLocalState()
    await syncNow()
  }

  async function deleteEntry(localId: string): Promise<void> {
    const current = await getEntry(localId)
    if (!current) {
      return
    }
    if (!current.serverId) {
      await removeEntry(localId)
      await removeQueueItemsForLocal('entry', localId)
      await refreshLocalState()
      return
    }
    current.deleted = true
    current.syncStatus = 'pending_delete'
    current.lastModifiedAt = nowIso()
    await putEntry(current)
    await removeQueueItemsForLocal('entry', localId)
    await queueMutation({
      entityType: 'entry',
      operation: 'delete',
      localId,
      serverId: current.serverId,
      payload: {},
      lastModifiedAt: current.lastModifiedAt,
      attempts: 0
    })
    await refreshLocalState()
    await syncNow()
  }

  async function loginSuccess(newToken: string, loggedUser: UserMe): Promise<void> {
    saveAuth(newToken, loggedUser)
    setToken(newToken)
    setUser(loggedUser)
    await refreshLocalState()
    await syncNow()
  }

  function logout(): void {
    clearAuth()
    setToken(null)
    setUser(null)
    setVehicles([])
    setEntries([])
    setActiveVehicleLocalId(null)
    setPendingSyncCount(0)
  }

  useEffect(() => {
    void refreshLocalState()
  }, [])

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      void syncNow()
    }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [token, isSyncing])

  useEffect(() => {
    if (!token) {
      return
    }
    const interval = window.setInterval(() => {
      if (navigator.onLine) {
        void syncNow()
      }
    }, 30000)
    return () => window.clearInterval(interval)
  }, [token, isSyncing])

  useEffect(() => {
    if (!token || user) {
      return
    }
    void fetchMe(token)
      .then((me) => {
        saveAuth(token, me)
        setUser(me)
      })
      .catch(() => {
        clearAuth()
        setToken(null)
        setUser(null)
      })
  }, [token, user])

  const value = useMemo<AppContextValue>(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    isOnline,
    isSyncing,
    syncMessage,
    vehicles,
    entries,
    activeVehicleLocalId,
    pendingSyncCount,
    loginSuccess,
    logout,
    setActiveVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    createEntry,
    updateEntry,
    deleteEntry,
    refreshLocalState,
    syncNow
  }), [
    token,
    user,
    isOnline,
    isSyncing,
    syncMessage,
    vehicles,
    entries,
    activeVehicleLocalId,
    pendingSyncCount
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
