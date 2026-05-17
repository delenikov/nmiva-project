export const MONEY_UNIT = 'мкд'
export const PRICE_PER_LITER_UNIT = `${MONEY_UNIT}/L`

function formatNumber(value: number | string, decimals: number): string {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue.toFixed(decimals) : String(value)
}

export function formatMoneyValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return `${formatNumber(value, 2)} ${MONEY_UNIT}`
}

export function formatPricePerLiterValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return `${formatNumber(value, 3)} ${PRICE_PER_LITER_UNIT}`
}
