/// <reference lib="webworker" />
import { runSyncCycle } from '../services/syncCore'
import type { WorkerSyncResult } from '../types/api'

type SyncMessage = {
  type: 'SYNC'
  token: string
  apiBaseUrl: string
}

self.onmessage = async (event: MessageEvent<SyncMessage>) => {
  if (event.data.type !== 'SYNC') {
    return
  }
  let result: WorkerSyncResult
  try {
    result = await runSyncCycle({ token: event.data.token, apiBaseUrl: event.data.apiBaseUrl })
  } catch (error) {
    result = {
      ok: false,
      syncedCount: 0,
      failedCount: 1,
      message: error instanceof Error ? error.message : 'Unknown sync error'
    }
  }
  postMessage({ type: 'SYNC_RESULT', result })
}

export {}
