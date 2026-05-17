import { FormEvent, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Car, Save } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label, Select } from '../components/ui/field'

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
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="icon-tile rounded-[var(--radius-lg)] p-2">
            <Car className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">{isEdit ? 'Edit vehicle' : 'New vehicle'}</CardTitle>
            <CardDescription>Profile details used across expenses, service history, and reminders.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label>
              Brand
              <Input value={brand} onChange={(event) => setBrand(event.target.value)} required />
            </Label>
            <Label>
              Model
              <Input value={model} onChange={(event) => setModel(event.target.value)} required />
            </Label>
            <Label>
              Year
              <Input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} min={1950} max={2100} required />
            </Label>
            <Label>
              Fuel type
              <Select value={fuelType} onChange={(event) => setFuelType(event.target.value)}>
                {FUEL_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Label>
            <Label className="sm:col-span-2">
              Odometer start
              <Input type="number" min={0} step="0.1" value={odometerStart} onChange={(event) => setOdometerStart(Number(event.target.value))} required />
            </Label>
          </div>
          <div className="flex justify-end border-t border-[color:var(--border)] pt-5">
            <Button type="submit" size="lg">
              <Save className="h-4 w-4" aria-hidden="true" />
              {isEdit ? 'Save changes' : 'Create vehicle'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
