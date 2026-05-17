import type { EntryRecord } from '../types/models'

const asNumber = (value: number | null | undefined): number | null => value == null ? null : Number(value)

export function calculateFuelMetrics(entries: EntryRecord[]): { latest?: number; average?: number } {
  const refuels = entries
    .filter((entry) => !entry.deleted && entry.type === 'refuel' && entry.isFullTank && entry.odometer != null && entry.liters != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (refuels.length < 2) {
    return {}
  }

  const intervals: number[] = []
  for (let i = 1; i < refuels.length; i += 1) {
    const previous = refuels[i - 1]
    const current = refuels[i]
    if (!previous || !current) {
      continue
    }
    const previousOdo = asNumber(previous.odometer)
    const currentOdo = asNumber(current.odometer)
    const liters = asNumber(current.liters)
    if (previousOdo === null || currentOdo === null || liters === null) {
      continue
    }
    const distance = currentOdo - previousOdo
    if (distance <= 0) {
      continue
    }
    intervals.push(Number(((liters / distance) * 100).toFixed(2)))
  }

  if (intervals.length === 0) {
    return {}
  }

  const latest = intervals[intervals.length - 1]
  if (latest === undefined) {
    return {}
  }
  const average = Number((intervals.reduce((sum, current) => sum + current, 0) / intervals.length).toFixed(2))
  return { latest, average }
}

export function resolveReminderDueDate(entry: EntryRecord, now = new Date()): Date | null {
  if (entry.type !== 'reminder' || !entry.dueDate) {
    return null
  }
  const dueDate = new Date(entry.dueDate)
  if (!entry.repeatYearly) {
    return dueDate
  }
  const currentYearDue = new Date(dueDate)
  currentYearDue.setFullYear(now.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  if (currentYearDue < now) {
    currentYearDue.setFullYear(now.getFullYear() + 1)
  }
  return currentYearDue
}
