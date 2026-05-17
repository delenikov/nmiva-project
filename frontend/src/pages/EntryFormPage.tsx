import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClipboardPlus, Save } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import type { EntryType, ExpenseCategory, ServiceCategory } from '../types/models'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label, Select, Textarea } from '../components/ui/field'
import { MONEY_UNIT, PRICE_PER_LITER_UNIT } from '../utils/currency'

const ENTRY_TYPES: EntryType[] = ['refuel', 'service', 'expense', 'reminder']
const SERVICE_CATEGORIES: ServiceCategory[] = ['oil', 'filters', 'brakes', 'tires', 'repair', 'other']
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['insurance', 'parking', 'wash', 'toll', 'other']

type FuelField = 'cost' | 'liters' | 'pricePerLiter'

function parseNonNegative(value: string): number | null {
  if (value.trim().length === 0) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parsePositive(value: string): number | null {
  const parsed = parseNonNegative(value)
  return parsed !== null && parsed > 0 ? parsed : null
}

function formatFuelValue(value: number, decimals: number): string {
  return value.toFixed(decimals)
}

export function EntryFormPage() {
  const { id, entryId } = useParams<{ id: string; entryId: string }>()
  const navigate = useNavigate()
  const { vehicles, entries, createEntry, updateEntry } = useAppContext()
  const existing = useMemo(() => entries.find((entry) => entry.localId === entryId) ?? null, [entries, entryId])
  const vehicleLocalId = existing?.vehicleLocalId ?? id ?? ''
  const odometerPrefill = useMemo(() => {
    if (existing) {
      return existing.odometer?.toString() ?? ''
    }

    const latestEntryOdometer = entries
      .filter((entry) => !entry.deleted && entry.vehicleLocalId === vehicleLocalId && entry.odometer !== undefined)
      .reduce<number | null>((latest, entry) => {
        if (entry.odometer === undefined) {
          return latest
        }
        return latest === null || entry.odometer > latest ? entry.odometer : latest
      }, null)

    if (latestEntryOdometer !== null) {
      return latestEntryOdometer.toString()
    }

    return vehicles.find((vehicle) => vehicle.localId === vehicleLocalId && !vehicle.deleted)?.odometerStart.toString() ?? ''
  }, [entries, existing, vehicleLocalId, vehicles])
  const [type, setType] = useState<EntryType>(existing?.type ?? 'refuel')
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10))
  const [title, setTitle] = useState(existing?.title ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [odometer, setOdometer] = useState(odometerPrefill)
  const [odometerEdited, setOdometerEdited] = useState(false)
  const [cost, setCost] = useState(existing?.cost?.toString() ?? '')
  const [liters, setLiters] = useState(existing?.liters?.toString() ?? '')
  const [pricePerLiter, setPricePerLiter] = useState(existing?.pricePerLiter?.toString() ?? '')
  const [lastFuelField, setLastFuelField] = useState<FuelField | null>(null)
  const [isFullTank, setIsFullTank] = useState(existing?.isFullTank ?? true)
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>(existing?.serviceCategory ?? 'other')
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>(existing?.expenseCategory ?? 'other')
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? '')
  const [repeatYearly, setRepeatYearly] = useState(existing?.repeatYearly ?? false)
  const [completed, setCompleted] = useState(existing?.completed ?? false)

  useEffect(() => {
    if (odometerEdited) {
      return
    }
    setOdometer(odometerPrefill)
  }, [odometerEdited, odometerPrefill])

  function updateFuelField(field: FuelField, value: string): void {
    const next = {
      cost,
      liters,
      pricePerLiter,
      [field]: value
    }

    setLastFuelField(field)

    if (field === 'cost') {
      setCost(value)

      const nextCost = parseNonNegative(next.cost)
      const nextLiters = parsePositive(next.liters)
      const nextPricePerLiter = parsePositive(next.pricePerLiter)

      if (nextCost === null) {
        return
      }

      if (lastFuelField === 'pricePerLiter' && nextPricePerLiter !== null) {
        setLiters(formatFuelValue(nextCost / nextPricePerLiter, 3))
        return
      }

      if (nextLiters !== null) {
        setPricePerLiter(formatFuelValue(nextCost / nextLiters, 3))
        return
      }

      if (nextPricePerLiter !== null) {
        setLiters(formatFuelValue(nextCost / nextPricePerLiter, 3))
      }
      return
    }

    if (field === 'liters') {
      setLiters(value)

      const nextCost = parseNonNegative(next.cost)
      const nextLiters = parsePositive(next.liters)
      const nextPricePerLiter = parseNonNegative(next.pricePerLiter)

      if (nextLiters === null) {
        return
      }

      if (lastFuelField === 'pricePerLiter' && nextPricePerLiter !== null) {
        setCost(formatFuelValue(nextLiters * nextPricePerLiter, 2))
        return
      }

      if (nextCost !== null) {
        setPricePerLiter(formatFuelValue(nextCost / nextLiters, 3))
        return
      }

      if (nextPricePerLiter !== null) {
        setCost(formatFuelValue(nextLiters * nextPricePerLiter, 2))
      }
      return
    }

    setPricePerLiter(value)

    const nextCost = parseNonNegative(next.cost)
    const nextLiters = parsePositive(next.liters)
    const nextPricePerLiter = parseNonNegative(next.pricePerLiter)
    const positivePricePerLiter = parsePositive(next.pricePerLiter)

    if (nextPricePerLiter === null) {
      return
    }

    if (lastFuelField === 'cost' && nextCost !== null && positivePricePerLiter !== null) {
      setLiters(formatFuelValue(nextCost / positivePricePerLiter, 3))
      return
    }

    if (nextLiters !== null) {
      setCost(formatFuelValue(nextLiters * nextPricePerLiter, 2))
      return
    }

    if (nextCost !== null && positivePricePerLiter !== null) {
      setLiters(formatFuelValue(nextCost / positivePricePerLiter, 3))
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const payload = {
      vehicleLocalId,
      type,
      date,
      title,
      notes: notes || undefined,
      odometer: odometer.length > 0 ? Number(odometer) : undefined,
      cost: type !== 'reminder' && cost.length > 0 ? Number(cost) : undefined,
      liters: type === 'refuel' && liters.length > 0 ? Number(liters) : undefined,
      pricePerLiter: type === 'refuel' && pricePerLiter.length > 0 ? Number(pricePerLiter) : undefined,
      isFullTank: type === 'refuel' ? isFullTank : false,
      serviceCategory: type === 'service' ? serviceCategory : undefined,
      expenseCategory: type === 'expense' ? expenseCategory : undefined,
      dueDate: type === 'reminder' && dueDate ? dueDate : undefined,
      repeatYearly: type === 'reminder' ? repeatYearly : false,
      completed: type === 'reminder' ? completed : false
    }

    if (existing) {
      await updateEntry(existing.localId, payload)
      navigate(`/app/vehicles/${existing.vehicleLocalId}`)
      return
    }
    await createEntry(payload)
    navigate(`/app/vehicles/${vehicleLocalId}`)
  }

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="icon-tile rounded-[var(--radius-lg)] p-2">
            <ClipboardPlus className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">{existing ? 'Edit entry' : 'Add entry'}</CardTitle>
            <CardDescription>Log fuel, service, costs, or reminders for the selected profile.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label>
              Type
              <Select value={type} onChange={(event) => setType(event.target.value as EntryType)}>
                {ENTRY_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Label>
            <Label>
              Date
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </Label>
            <Label className="sm:col-span-2">
              Title
              <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </Label>
            <Label className="sm:col-span-2">
              Notes
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
            </Label>
            <Label>
              Odometer
              <Input
                type="number"
                step="0.1"
                min={0}
                value={odometer}
                onChange={(event) => {
                  setOdometerEdited(true)
                  setOdometer(event.target.value)
                }}
              />
            </Label>
            {type !== 'refuel' && type !== 'reminder' ? (
              <Label>
                {`Cost (${MONEY_UNIT})`}
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={cost}
                  placeholder={MONEY_UNIT}
                  onChange={(event) => setCost(event.target.value)}
                />
              </Label>
            ) : null}
          </div>

          {type === 'refuel' ? (
            <div className="form-cluster grid gap-4 rounded-[var(--radius-lg)] p-4 sm:grid-cols-3">
              <Label>
                {`Cost (${MONEY_UNIT})`}
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={cost}
                  placeholder={MONEY_UNIT}
                  onChange={(event) => updateFuelField('cost', event.target.value)}
                  required
                />
              </Label>
              <Label>
                Liters
                <Input
                  type="number"
                  step="0.001"
                  min={0}
                  value={liters}
                  onChange={(event) => updateFuelField('liters', event.target.value)}
                  required
                />
              </Label>
              <Label>
                {`Price per liter (${PRICE_PER_LITER_UNIT})`}
                <Input
                  type="number"
                  step="0.001"
                  min={0}
                  value={pricePerLiter}
                  placeholder={PRICE_PER_LITER_UNIT}
                  onChange={(event) => updateFuelField('pricePerLiter', event.target.value)}
                />
              </Label>
              <label className="field-check flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-slate-700 sm:col-span-3">
                <input className="h-4 w-4 rounded border-slate-300 text-[color:var(--accent)] focus:ring-[color:var(--ring)]" type="checkbox" checked={isFullTank} onChange={(event) => setIsFullTank(event.target.checked)} />
                Full tank
              </label>
            </div>
          ) : null}

          {type === 'service' ? (
            <div className="form-cluster rounded-[var(--radius-lg)] p-4">
              <Label>
                Service category
                <Select value={serviceCategory} onChange={(event) => setServiceCategory(event.target.value as ServiceCategory)}>
                  {SERVICE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </Label>
            </div>
          ) : null}

          {type === 'expense' ? (
            <div className="form-cluster rounded-[var(--radius-lg)] p-4">
              <Label>
                Expense category
                <Select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value as ExpenseCategory)}>
                  {EXPENSE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </Label>
            </div>
          ) : null}

          {type === 'reminder' ? (
            <div className="form-cluster grid gap-4 rounded-[var(--radius-lg)] p-4">
              <Label>
                Due date
                <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
              </Label>
              <label className="field-check flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-slate-700">
                <input className="h-4 w-4 rounded border-slate-300 text-[color:var(--accent)] focus:ring-[color:var(--ring)]" type="checkbox" checked={repeatYearly} onChange={(event) => setRepeatYearly(event.target.checked)} />
                Repeat yearly
              </label>
              <label className="field-check flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-slate-700">
                <input className="h-4 w-4 rounded border-slate-300 text-[color:var(--accent)] focus:ring-[color:var(--ring)]" type="checkbox" checked={completed} onChange={(event) => setCompleted(event.target.checked)} />
                Completed
              </label>
            </div>
          ) : null}

          <div className="flex justify-end border-t border-[color:var(--border)] pt-5">
            <Button type="submit" size="lg">
              <Save className="h-4 w-4" aria-hidden="true" />
              {existing ? 'Save entry' : 'Create entry'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
