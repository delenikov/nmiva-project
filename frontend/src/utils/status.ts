import type { SyncStatus } from '../types/models'
import type { StatusTone } from '../components/ui/status-pill'

export interface StatusMeta {
  label: string
  tone: StatusTone
}

export function getConnectionStatusMeta(isOnline: boolean): StatusMeta {
  return isOnline
    ? { label: 'Online', tone: 'success' }
    : { label: 'Offline', tone: 'danger' }
}

export function getPendingSyncStatusMeta(pendingSyncCount: number): StatusMeta {
  return pendingSyncCount > 0
    ? { label: `${pendingSyncCount} pending`, tone: 'warning' }
    : { label: 'Synced', tone: 'success' }
}

export function getSyncStatusMeta(status: SyncStatus): StatusMeta {
  if (status === 'synced') {
    return { label: 'Synced', tone: 'success' }
  }

  if (status === 'failed') {
    return { label: 'Failed', tone: 'danger' }
  }

  if (status === 'pending_delete') {
    return { label: 'Pending delete', tone: 'danger' }
  }

  if (status === 'pending_create') {
    return { label: 'Pending create', tone: 'warning' }
  }

  if (status === 'pending_update') {
    return { label: 'Pending update', tone: 'warning' }
  }

  return { label: status, tone: 'neutral' }
}
