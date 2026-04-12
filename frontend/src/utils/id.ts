export const makeLocalId = (prefix: string): string => `${prefix}-${crypto.randomUUID()}`
