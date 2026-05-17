export function formatKilometers(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) {
    return `${value} km`
  }

  return `${numberValue.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
}
