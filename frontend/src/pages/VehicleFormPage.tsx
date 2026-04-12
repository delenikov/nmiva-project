import { FormEvent, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const FUEL_TYPES = ['petrol', 'diesel', 'lpg', 'hybrid', 'electric', 'other']

export function VehicleFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { vehicles, createVehicle, updateVehicle } = useAppContext()
  const existing = useMemo(() => vehicles.find((item) => item.localId === id) ?? null, [vehicles, id])
  const isEdit = Boolean(existing)

  const [brand, setBrand] = useState(existing?.brand ?? '')
  const [model, setModel] = useState(existing?.model ?? '')
  const [year, setYear] = useState(existing?.year ?? new Date().getFullYear())
  const [fuelType, setFuelType] = useState(existing?.fuelType ?? 'petrol')
  const [odometerStart, setOdometerStart] = useState(existing?.odometerStart ?? 0)

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const payload = {
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year),
      fuelType,
      odometerStart: Number(odometerStart)
    }
    if (isEdit && existing) {
      await updateVehicle(existing.localId, payload)
      navigate(`/app/vehicles/${existing.localId}`)
      return
    }
    await createVehicle(payload)
    navigate('/app/vehicles')
  }

  return (
    <section className="card">
      <h2>{isEdit ? 'Edit vehicle' : 'New vehicle'}</h2>
      <form className="form" onSubmit={onSubmit}>
        <label>Brand<input value={brand} onChange={(event) => setBrand(event.target.value)} required /></label>
        <label>Model<input value={model} onChange={(event) => setModel(event.target.value)} required /></label>
        <label>Year<input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} min={1950} max={2100} required /></label>
        <label>
          Fuel type
          <select value={fuelType} onChange={(event) => setFuelType(event.target.value)}>
            {FUEL_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Odometer start
          <input type="number" min={0} step="0.1" value={odometerStart} onChange={(event) => setOdometerStart(Number(event.target.value))} required />
        </label>
        <button type="submit">{isEdit ? 'Save changes' : 'Create vehicle'}</button>
      </form>
    </section>
  )
}
