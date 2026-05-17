import type { EntryRecord } from '../types/models'

export interface TimelineMonthGroup {
  id: string
  label: string
  entries: EntryRecord[]
}

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric'
})

export function getTimelineDate(entry: EntryRecord): string {
  if (entry.type === 'reminder' && entry.dueDate) {
    return entry.dueDate
  }
  return entry.date
}

export function groupEntriesByMonth(entries: EntryRecord[]): TimelineMonthGroup[] {
  const sortedEntries = [...entries].sort(compareEntriesByTimelineDateDesc)
  const groups = new Map<string, TimelineMonthGroup>()

  for (const entry of sortedEntries) {
    const date = getTimelineDate(entry)
    const monthKey = date.slice(0, 7)
    const existing = groups.get(monthKey)

    if (existing) {
      existing.entries.push(entry)
      continue
    }

    groups.set(monthKey, {
      id: monthKey,
      label: formatMonthLabel(monthKey),
      entries: [entry]
    })
  }

  return Array.from(groups.values())
}

function compareEntriesByTimelineDateDesc(first: EntryRecord, second: EntryRecord): number {
  const firstDate = getTimelineDate(first)
  const secondDate = getTimelineDate(second)

  if (firstDate !== secondDate) {
    return secondDate.localeCompare(firstDate)
  }

  const firstModified = first.lastModifiedAt || first.updatedAt || first.createdAt || ''
  const secondModified = second.lastModifiedAt || second.updatedAt || second.createdAt || ''
  if (firstModified !== secondModified) {
    return secondModified.localeCompare(firstModified)
  }

  return first.localId.localeCompare(second.localId)
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) {
    return monthKey
  }
  return monthFormatter.format(new Date(year, month - 1, 1))
}
