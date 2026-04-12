import type { WorkerSyncResult } from '../types/api'

let worker: Worker | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/syncWorker.ts', import.meta.url), { type: 'module' })
  }
  return worker
}

export function triggerSync(token: string, apiBaseUrl: string): Promise<WorkerSyncResult> {
  return new Promise((resolve) => {
    const instance = getWorker()
    const onMessage = (event: MessageEvent<{ type: string; result: WorkerSyncResult }>) => {
      if (event.data.type !== 'SYNC_RESULT') {
        return
      }
      instance.removeEventListener('message', onMessage as EventListener)
      resolve(event.data.result)
    }
    instance.addEventListener('message', onMessage as EventListener)
    instance.postMessage({ type: 'SYNC', token, apiBaseUrl })
  })
}
