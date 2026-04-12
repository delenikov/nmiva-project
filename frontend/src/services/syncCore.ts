import type { SyncRequest, SyncResponse, WorkerSyncResult } from '../types/api'
import type { EntryRecord, PendingSyncItem, SyncStatus, VehicleRecord } from '../types/models'
import {
  deleteQueueItem,
  findEntryByServerId,
  findVehicleByServerId,
  getEntry,
  getMeta,
  getQueue,
  getVehicle,
  putEntry,
  putQueueItem,
  putVehicle,
  setMeta
} from './localDb'

type SyncParams = {
  token: string
  apiBaseUrl: string
}

const toOperation = (operation: PendingSyncItem['operation']): 'CREATE' | 'UPDATE' | 'DELETE' => {
  switch (operation) {
    case 'create':
      return 'CREATE'
    case 'update':
      return 'UPDATE'
    case 'delete':
      return 'DELETE'
    default:
      return 'UPDATE'
  }
}

export async function runSyncCycle({ token, apiBaseUrl }: SyncParams): Promise<WorkerSyncResult> {
  const queue = await getQueue()
  const lastPulledAt = await getMeta('lastPulledAt')

  const vehicleChanges: SyncRequest['vehicleChanges'] = []
  const entryChanges: SyncRequest['entryChanges'] = []
  const sentItems: PendingSyncItem[] = []

  for (const item of queue) {
    if (!item.queueId) {
      continue
    }
    if (item.entityType === 'entry') {
      const payload = { ...item.payload }
      const vehicleLocalId = payload.vehicleLocalId as string | undefined
      if (vehicleLocalId) {
        const vehicle = await getVehicle(vehicleLocalId)
        if (!vehicle?.serverId) {
          continue
        }
        payload.vehicleId = vehicle.serverId
        delete payload.vehicleLocalId
      }
      entryChanges.push({
        localId: item.localId,
        serverId: item.serverId,
        operation: toOperation(item.operation),
        lastModifiedAt: item.lastModifiedAt,
        payload
      })
      sentItems.push(item)
      continue
    }
    vehicleChanges.push({
      localId: item.localId,
      serverId: item.serverId,
      operation: toOperation(item.operation),
      lastModifiedAt: item.lastModifiedAt,
      payload: item.payload
    })
    sentItems.push(item)
  }

  const requestBody: SyncRequest = {
    lastPulledAt,
    vehicleChanges,
    entryChanges
  }

  const response = await fetch(`${apiBaseUrl}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const message = `Sync request failed (${response.status})`
    for (const item of sentItems) {
      item.attempts += 1
      item.lastError = message
      await putQueueItem(item)
      await markRecordSyncStatus(item.entityType, item.localId, 'failed')
    }
    return { ok: false, syncedCount: 0, failedCount: sentItems.length, message }
  }

  const payload = await response.json() as SyncResponse
  let syncedCount = 0
  let failedCount = 0

  for (const ack of payload.acknowledgements) {
    const queueItem = sentItems.find((item) => item.localId === ack.localId && item.entityType === ack.entityType)
    if (!queueItem || queueItem.queueId === undefined) {
      continue
    }
    if (ack.status === 'synced') {
      await deleteQueueItem(queueItem.queueId)
      await updateRecordAfterAck(ack.entityType, ack.localId, ack.serverId, 'synced')
      syncedCount += 1
      continue
    }
    if (ack.status === 'conflict') {
      await deleteQueueItem(queueItem.queueId)
      await updateRecordAfterAck(ack.entityType, ack.localId, ack.serverId, 'failed')
      failedCount += 1
      continue
    }
    queueItem.attempts += 1
    queueItem.lastError = ack.message
    await putQueueItem(queueItem)
    await markRecordSyncStatus(queueItem.entityType, queueItem.localId, 'failed')
    failedCount += 1
  }

  await applyServerVehicles(payload.vehicles, payload.serverTime)
  await applyServerEntries(payload.entries, payload.serverTime)
  await setMeta('lastPulledAt', payload.serverTime)

  return { ok: true, syncedCount, failedCount }
}

async function updateRecordAfterAck(
  entityType: 'vehicle' | 'entry',
  localId: string,
  serverId: number | null,
  status: SyncStatus
): Promise<void> {
  if (entityType === 'vehicle') {
    const vehicle = await getVehicle(localId)
    if (!vehicle) {
      return
    }
    vehicle.serverId = serverId
    vehicle.syncStatus = status
    vehicle.lastSyncedAt = new Date().toISOString()
    await putVehicle(vehicle)
    return
  }
  const entry = await getEntry(localId)
  if (!entry) {
    return
  }
  entry.serverId = serverId
  entry.syncStatus = status
  entry.lastSyncedAt = new Date().toISOString()
  await putEntry(entry)
}

async function markRecordSyncStatus(entityType: 'vehicle' | 'entry', localId: string, status: SyncStatus): Promise<void> {
  if (entityType === 'vehicle') {
    const vehicle = await getVehicle(localId)
    if (!vehicle) {
      return
    }
    vehicle.syncStatus = status
    await putVehicle(vehicle)
    return
  }
  const entry = await getEntry(localId)
  if (!entry) {
    return
  }
  entry.syncStatus = status
  await putEntry(entry)
}

async function applyServerVehicles(serverVehicles: SyncResponse['vehicles'], syncedAt: string): Promise<void> {
  for (const item of serverVehicles) {
    const existing = await findVehicleByServerId(item.id)
    const record: VehicleRecord = existing ?? {
      localId: `vehicle-${item.id}`,
      serverId: item.id,
      brand: item.brand,
      model: item.model,
      year: item.year,
      fuelType: item.fuelType,
      odometerStart: Number(item.odometerStart),
      deleted: item.deleted,
      syncStatus: 'synced',
      lastModifiedAt: item.lastModifiedAt,
      lastSyncedAt: syncedAt
    }
    record.serverId = item.id
    record.userId = item.userId
    record.brand = item.brand
    record.model = item.model
    record.year = item.year
    record.fuelType = item.fuelType
    record.odometerStart = Number(item.odometerStart)
    record.deleted = item.deleted
    record.lastModifiedAt = item.lastModifiedAt
    record.syncStatus = 'synced'
    record.lastSyncedAt = syncedAt
    record.createdAt = item.createdAt
    record.updatedAt = item.updatedAt
    await putVehicle(record)
  }
}

async function applyServerEntries(serverEntries: SyncResponse['entries'], syncedAt: string): Promise<void> {
  for (const item of serverEntries) {
    const existing = await findEntryByServerId(item.id)
    const vehicle = await findVehicleByServerId(item.vehicleId)
    const record: EntryRecord = existing ?? {
      localId: `entry-${item.id}`,
      serverId: item.id,
      vehicleLocalId: vehicle?.localId ?? `vehicle-${item.vehicleId}`,
      vehicleServerId: item.vehicleId,
      type: item.type,
      date: item.date,
      title: item.title,
      notes: item.notes,
      odometer: item.odometer,
      cost: item.cost,
      liters: item.liters,
      pricePerLiter: item.pricePerLiter,
      isFullTank: item.isFullTank,
      serviceCategory: item.serviceCategory as EntryRecord['serviceCategory'],
      expenseCategory: item.expenseCategory as EntryRecord['expenseCategory'],
      dueDate: item.dueDate,
      repeatYearly: item.repeatYearly,
      completed: item.completed,
      deleted: item.deleted,
      syncStatus: 'synced',
      lastModifiedAt: item.lastModifiedAt,
      lastSyncedAt: syncedAt
    }

    record.serverId = item.id
    record.vehicleServerId = item.vehicleId
    record.vehicleLocalId = vehicle?.localId ?? record.vehicleLocalId
    record.userId = item.userId
    record.type = item.type
    record.date = item.date
    record.title = item.title
    record.notes = item.notes
    record.odometer = item.odometer
    record.cost = item.cost
    record.liters = item.liters
    record.pricePerLiter = item.pricePerLiter
    record.isFullTank = item.isFullTank
    record.serviceCategory = item.serviceCategory as EntryRecord['serviceCategory']
    record.expenseCategory = item.expenseCategory as EntryRecord['expenseCategory']
    record.dueDate = item.dueDate
    record.repeatYearly = item.repeatYearly
    record.completed = item.completed
    record.deleted = item.deleted
    record.syncStatus = 'synced'
    record.lastModifiedAt = item.lastModifiedAt
    record.lastSyncedAt = syncedAt
    record.createdAt = item.createdAt
    record.updatedAt = item.updatedAt
    await putEntry(record)
  }
}
