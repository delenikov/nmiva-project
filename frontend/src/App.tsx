import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { EntryFormPage } from './pages/EntryFormPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SettingsPage } from './pages/SettingsPage'
import { VehicleDetailsPage } from './pages/VehicleDetailsPage'
import { VehicleFormPage } from './pages/VehicleFormPage'
import { VehiclesPage } from './pages/VehiclesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="vehicles/new" element={<VehicleFormPage />} />
          <Route path="vehicles/:id" element={<VehicleDetailsPage />} />
          <Route path="vehicles/:id/edit" element={<VehicleFormPage />} />
          <Route path="vehicles/:id/add-entry" element={<EntryFormPage />} />
          <Route path="entries/:entryId/edit" element={<EntryFormPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
