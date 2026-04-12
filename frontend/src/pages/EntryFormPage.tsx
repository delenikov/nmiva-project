import { FormEvent, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import type { EntryType, ExpenseCategory, ServiceCategory } from '../types/models'

const ENTRY_TYPES: EntryType[] = ['refuel', 'service', 'expense', 'reminder']
const SERVICE_CATEGORIES: ServiceCategory[] = ['oil', 'filters', 'brakes', 'tires', 'repair', 'other']
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['insurance', 'parking', 'wash', 'toll', 'other']

export function EntryFormPage() {
  const { id, entryId } = useParams<{ id: string; entryId: string }>()
  const navigate = useNavigate()
  const { entries, createEntry, updateEntry } = useAppContext()
  const existing = useMemo(() => entries.find((entry) => entry.localId === entryId) ?? null, [entries, entryId])
  const vehicleLocalId = existing?.vehicleLocalId ?? id ?? ''
  const [type, setType] = useState<EntryType>(existing?.type ?? 'refuel')
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10))
  const [title, setTitle] = useState(existing?.title ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [odometer, setOdometer] = useState(existing?.odometer?.toString() ?? '')
  const [cost, setCost] = useState(existing?.cost?.toString() ?? '')
  const [liters, setLiters] = useState(existing?.liters?.toString() ?? '')
  const [pricePerLiter, setPricePerLiter] = useState(existing?.pricePerLiter?.toString() ?? '')
  const [isFullTank, setIsFullTank] = useState(existing?.isFullTank ?? true)
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>(existing?.serviceCategory ?? 'other')
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>(existing?.expenseCategory ?? 'other')
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? '')
  const [repeatYearly, setRepeatYearly] = useState(existing?.repeatYearly ?? false)
  const [completed, setCompleted] = useState(existing?.completed ?? false)

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const payload = {
      vehicleLocalId,
      type,
      date,
      title,
      notes: notes || undefined,
      odometer: odometer.length > 0 ? Number(odometer) : undefined,
      cost: cost.length > 0 ? Number(cost) : undefined,
      liters: liters.length > 0 ? Number(liters) : undefined,
      pricePerLiter: pricePerLiter.length > 0 ? Number(pricePerLiter) : undefined,
      isFullTank,
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
    <section className="card">
      <h2>{existing ? 'Edit entry' : 'Add entry'}</h2>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Type
          <select value={type} onChange={(event) => setType(event.target.value as EntryType)}>
            {ENTRY_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} /></label>

        <label>Odometer<input type="number" step="0.1" min={0} value={odometer} onChange={(event) => setOdometer(event.target.value)} /></label>
        <label>Cost<input type="number" step="0.01" min={0} value={cost} onChange={(event) => setCost(event.target.value)} /></label>

        {type === 'refuel' ? (
          <>
            <label>Liters<input type="number" step="0.001" min={0} value={liters} onChange={(event) => setLiters(event.target.value)} required /></label>
            <label>Price per liter<input type="number" step="0.001" min={0} value={pricePerLiter} onChange={(event) => setPricePerLiter(event.target.value)} /></label>
            <label className="checkbox"><input type="checkbox" checked={isFullTank} onChange={(event) => setIsFullTank(event.target.checked)} />Full tank</label>
          </>
        ) : null}

        {type === 'service' ? (
          <label>
            Service category
            <select value={serviceCategory} onChange={(event) => setServiceCategory(event.target.value as ServiceCategory)}>
              {SERVICE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        ) : null}

        {type === 'expense' ? (
          <label>
            Expense category
            <select value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value as ExpenseCategory)}>
              {EXPENSE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        ) : null}

        {type === 'reminder' ? (
          <>
            <label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></label>
            <label className="checkbox"><input type="checkbox" checked={repeatYearly} onChange={(event) => setRepeatYearly(event.target.checked)} />Repeat yearly</label>
            <label className="checkbox"><input type="checkbox" checked={completed} onChange={(event) => setCompleted(event.target.checked)} />Completed</label>
          </>
        ) : null}

        <button type="submit">{existing ? 'Save entry' : 'Create entry'}</button>
      </form>
    </section>
  )
}
