export type SyncStatus = 'synced' | 'pending_create' | 'pending_update' | 'pending_delete' | 'failed'

export type EntryType = 'refuel' | 'service' | 'expense' | 'reminder'
export type ServiceCategory = 'oil' | 'filters' | 'brakes' | 'tires' | 'repair' | 'other'
export type ExpenseCategory = 'insurance' | 'parking' | 'wash' | 'toll' | 'other'

export interface UserMe {
  id: number
  email: string
  displayName: string
}

export interface VehicleRecord {
  localId: string
  serverId: number | null
  userId?: number
  brand: string
  model: string
  year: number
  fuelType: string
  odometerStart: number
  deleted: boolean
  syncStatus: SyncStatus
  lastModifiedAt: string
  lastSyncedAt: string | null
  createdAt?: string
  updatedAt?: string
}

export interface EntryRecord {
  localId: string
  serverId: number | null
  vehicleLocalId: string
  vehicleServerId: number | null
  userId?: number
  type: EntryType
  date: string
  title: string
  notes?: string
  odometer?: number
  cost?: number
  liters?: number
  pricePerLiter?: number
  isFullTank: boolean
  serviceCategory?: ServiceCategory
  expenseCategory?: ExpenseCategory
  dueDate?: string
  repeatYearly: boolean
  completed: boolean
  deleted: boolean
  syncStatus: SyncStatus
  lastModifiedAt: string
  lastSyncedAt: string | null
  createdAt?: string
  updatedAt?: string
}

export type QueueEntityType = 'vehicle' | 'entry'
export type QueueOperation = 'create' | 'update' | 'delete'

export interface PendingSyncItem {
  queueId?: number
  entityType: QueueEntityType
  operation: QueueOperation
  localId: string
  serverId: number | null
  payload: Record<string, unknown>
  lastModifiedAt: string
  attempts: number
  lastError?: string
}

export interface DashboardSummary {
  totalSpentThisMonth: number
  totalSpentAllTime: number
  latestOdometer?: number
  latestFuelConsumption?: number
  averageFuelConsumption?: number
  upcomingReminders: EntryRecord[]
  overdueReminders: EntryRecord[]
}
