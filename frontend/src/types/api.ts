import type { EntryRecord, VehicleRecord } from './models'

export interface AuthResponse {
  token: string
  user: {
    id: number
    email: string
    displayName: string
  }
}

export interface SyncChangeRecord {
  localId: string
  serverId: number | null
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  lastModifiedAt: string
  payload: Record<string, unknown>
}

export interface SyncRequest {
  lastPulledAt: string | null
  vehicleChanges: SyncChangeRecord[]
  entryChanges: SyncChangeRecord[]
}

export interface SyncAck {
  entityType: 'vehicle' | 'entry'
  localId: string
  serverId: number | null
  status: 'synced' | 'conflict' | 'failed'
  message: string
}

export interface SyncResponse {
  serverTime: string
  acknowledgements: SyncAck[]
  vehicles: Array<{
    id: number
    userId: number
    brand: string
    model: string
    year: number
    fuelType: string
    odometerStart: number
    deleted: boolean
    createdAt: string
    updatedAt: string
    lastModifiedAt: string
  }>
  entries: Array<{
    id: number
    vehicleId: number
    userId: number
    type: 'refuel' | 'service' | 'expense' | 'reminder'
    date: string
    title: string
    notes?: string
    odometer?: number
    cost?: number
    liters?: number
    pricePerLiter?: number
    isFullTank: boolean
    serviceCategory?: string
    expenseCategory?: string
    dueDate?: string
    repeatYearly: boolean
    completed: boolean
    syncStatus: string
    deleted: boolean
    lastModifiedAt: string
    createdAt: string
    updatedAt: string
  }>
}

export interface WorkerSyncResult {
  ok: boolean
  syncedCount: number
  failedCount: number
  message?: string
}

export interface AppStateSnapshot {
  vehicles: VehicleRecord[]
  entries: EntryRecord[]
  pendingSyncCount: number
}
