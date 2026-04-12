import type { EntryRecord, PendingSyncItem, VehicleRecord } from '../types/models'

const DB_NAME = 'nmiva-mvp-db'
const DB_VERSION = 1

type MetaRecord = {
  key: string
  value: string
}

type StoreMap = {
  vehicles: VehicleRecord
  entries: EntryRecord
  queue: PendingSyncItem
  meta: MetaRecord
}

let dbPromise: Promise<IDBDatabase> | null = null

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

async function getDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('vehicles')) {
        const store = db.createObjectStore('vehicles', { keyPath: 'localId' })
        store.createIndex('serverId', 'serverId', { unique: false })
      }
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'localId' })
        store.createIndex('serverId', 'serverId', { unique: false })
        store.createIndex('vehicleLocalId', 'vehicleLocalId', { unique: false })
        store.createIndex('vehicleServerId', 'vehicleServerId', { unique: false })
      }
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'queueId', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

async function withStore<K extends keyof StoreMap, T>(
  storeName: K,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await getDb()
  const tx = db.transaction(storeName, mode)
  const store = tx.objectStore(storeName)
  const result = await callback(store)
  await txComplete(tx)
  return result
}

export async function getAllVehicles(): Promise<VehicleRecord[]> {
  return withStore('vehicles', 'readonly', async (store) => requestToPromise(store.getAll()))
}

export async function putVehicle(vehicle: VehicleRecord): Promise<void> {
  await withStore('vehicles', 'readwrite', async (store) => {
    store.put(vehicle)
    return undefined
  })
}

export async function getVehicle(localId: string): Promise<VehicleRecord | null> {
  return withStore('vehicles', 'readonly', async (store) => {
    const value = await requestToPromise(store.get(localId))
    return (value ?? null) as VehicleRecord | null
  })
}

export async function removeVehicle(localId: string): Promise<void> {
  await withStore('vehicles', 'readwrite', async (store) => {
    store.delete(localId)
    return undefined
  })
}

export async function findVehicleByServerId(serverId: number): Promise<VehicleRecord | null> {
  return withStore('vehicles', 'readonly', async (store) => {
    const index = store.index('serverId')
    const value = await requestToPromise(index.get(serverId))
    return (value ?? null) as VehicleRecord | null
  })
}

export async function getAllEntries(): Promise<EntryRecord[]> {
  return withStore('entries', 'readonly', async (store) => requestToPromise(store.getAll()))
}

export async function putEntry(entry: EntryRecord): Promise<void> {
  await withStore('entries', 'readwrite', async (store) => {
    store.put(entry)
    return undefined
  })
}

export async function getEntry(localId: string): Promise<EntryRecord | null> {
  return withStore('entries', 'readonly', async (store) => {
    const value = await requestToPromise(store.get(localId))
    return (value ?? null) as EntryRecord | null
  })
}

export async function removeEntry(localId: string): Promise<void> {
  await withStore('entries', 'readwrite', async (store) => {
    store.delete(localId)
    return undefined
  })
}

export async function findEntryByServerId(serverId: number): Promise<EntryRecord | null> {
  return withStore('entries', 'readonly', async (store) => {
    const index = store.index('serverId')
    const value = await requestToPromise(index.get(serverId))
    return (value ?? null) as EntryRecord | null
  })
}

export async function getQueue(): Promise<PendingSyncItem[]> {
  return withStore('queue', 'readonly', async (store) => {
    const items = await requestToPromise(store.getAll())
    return (items as PendingSyncItem[]).sort((a, b) => (a.queueId ?? 0) - (b.queueId ?? 0))
  })
}

export async function addQueueItem(item: PendingSyncItem): Promise<number> {
  return withStore('queue', 'readwrite', async (store) => {
    const key = await requestToPromise(store.add(item))
    return Number(key)
  })
}

export async function putQueueItem(item: PendingSyncItem): Promise<void> {
  await withStore('queue', 'readwrite', async (store) => {
    store.put(item)
    return undefined
  })
}

export async function deleteQueueItem(queueId: number): Promise<void> {
  await withStore('queue', 'readwrite', async (store) => {
    store.delete(queueId)
    return undefined
  })
}

export async function removeQueueItemsForLocal(entityType: 'vehicle' | 'entry', localId: string): Promise<void> {
  await withStore('queue', 'readwrite', async (store) => {
    const request = store.getAll()
    const items = await requestToPromise(request) as PendingSyncItem[]
    for (const item of items) {
      if (item.entityType === entityType && item.localId === localId && item.queueId !== undefined) {
        store.delete(item.queueId)
      }
    }
    return undefined
  })
}

export async function queueCount(): Promise<number> {
  return withStore('queue', 'readonly', async (store) => requestToPromise(store.count()))
}

export async function setMeta(key: string, value: string): Promise<void> {
  await withStore('meta', 'readwrite', async (store) => {
    store.put({ key, value } satisfies MetaRecord)
    return undefined
  })
}

export async function getMeta(key: string): Promise<string | null> {
  return withStore('meta', 'readonly', async (store) => {
    const row = await requestToPromise(store.get(key)) as MetaRecord | undefined
    return row?.value ?? null
  })
}

export async function snapshot(): Promise<{ vehicles: VehicleRecord[]; entries: EntryRecord[]; pendingSyncCount: number }> {
  const [vehicles, entries, pendingSyncCount] = await Promise.all([getAllVehicles(), getAllEntries(), queueCount()])
  return { vehicles, entries, pendingSyncCount }
}
