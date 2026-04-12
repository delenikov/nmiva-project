import { FormEvent, useEffect, useState } from 'react'
import { getPermissionState, sendPushTest, subscribeToPush, unsubscribeFromPush } from '../services/push'
import { getSettings, updateSettings } from '../services/api'
import { useAppContext } from '../context/AppContext'

export function SettingsPage() {
  const { token, logout, syncNow } = useAppContext()
  const [currency, setCurrency] = useState('EUR')
  const [pushEnabled, setPushEnabled] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void getPermissionState().then(setPermission)
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }
    void getSettings(token)
      .then((settings) => {
        setCurrency(settings.currency)
        setPushEnabled(settings.pushEnabled)
      })
      .catch(() => {
        setMessage('Settings unavailable while offline.')
      })
  }, [token])

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!token) {
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const updated = await updateSettings(token, { currency, pushEnabled })
      setCurrency(updated.currency)
      setPushEnabled(updated.pushEnabled)
      setMessage('Settings saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Settings save failed')
    } finally {
      setLoading(false)
    }
  }

  async function subscribe(): Promise<void> {
    if (!token) {
      return
    }
    try {
      await subscribeToPush(token)
      setPermission(await getPermissionState())
      setMessage('Push subscription enabled.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Push subscribe failed')
    }
  }

  async function unsubscribe(): Promise<void> {
    if (!token) {
      return
    }
    try {
      await unsubscribeFromPush(token)
      setMessage('Push subscription removed.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Push unsubscribe failed')
    }
  }

  async function testPush(): Promise<void> {
    if (!token) {
      console.log("Missing push token")
      return;
    }
    try {
      await sendPushTest(token)
      setMessage('Test push sent.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Test push failed')
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <h2>Settings</h2>
        <form className="form" onSubmit={save}>
          <label>
            Currency
            <input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={5} />
          </label>
          <p className="muted">Consumption unit: L/100km (fixed for MVP)</p>
          <label className="checkbox">
            <input type="checkbox" checked={pushEnabled} onChange={(event) => setPushEnabled(event.target.checked)} />
            Enable reminder notifications
          </label>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save settings'}</button>
        </form>
      </section>

      <section className="card">
        <h3>Notifications</h3>
        <p>Permission: <strong>{permission}</strong></p>
        <div className="action-group">
          <button type="button" onClick={() => void subscribe()}>Subscribe</button>
          <button type="button" onClick={() => void unsubscribe()}>Unsubscribe</button>
          <button type="button" onClick={() => void testPush()}>Send test push</button>
        </div>
      </section>

      <section className="card">
        <h3>Sync</h3>
        <button type="button" onClick={() => void syncNow()}>Sync now</button>
      </section>

      <section className="card">
        <button type="button" className="danger" onClick={logout}>Logout</button>
      </section>

      {message ? <p className="helper">{message}</p> : null}
    </div>
  )
}
