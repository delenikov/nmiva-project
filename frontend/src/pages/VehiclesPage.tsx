import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

export function VehiclesPage() {
  const { vehicles, activeVehicleLocalId, setActiveVehicle, deleteVehicle } = useAppContext()
  const visible = vehicles.filter((vehicle) => !vehicle.deleted)

  return (
    <div className="stack">
      <section className="card row-between">
        <h2>Vehicles</h2>
        <Link className="button-link" to="/app/vehicles/new">Add vehicle</Link>
      </section>

      {visible.length === 0 ? (
        <section className="card">
          <p>No vehicles yet.</p>
        </section>
      ) : (
        visible.map((vehicle) => (
          <article className="card" key={vehicle.localId}>
            <div className="row-between">
              <div>
                <h3>{vehicle.brand} {vehicle.model}</h3>
                <p>{vehicle.year} • {vehicle.fuelType} • ODO {vehicle.odometerStart}</p>
                <p className="muted">Sync: {vehicle.syncStatus}</p>
              </div>
              <div className="action-group">
                <button type="button" onClick={() => void setActiveVehicle(vehicle.localId)}>
                  {activeVehicleLocalId === vehicle.localId ? 'Active' : 'Set active'}
                </button>
                <Link className="button-link ghost" to={`/app/vehicles/${vehicle.localId}`}>History</Link>
                <Link className="button-link ghost" to={`/app/vehicles/${vehicle.localId}/edit`}>Edit</Link>
                <button type="button" className="danger" onClick={() => void deleteVehicle(vehicle.localId)}>Delete</button>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  )
}
