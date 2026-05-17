import { FormEvent, useEffect, useState } from 'react'
import { Bell, LogOut, RefreshCw, Save, Send, Settings, WifiOff } from 'lucide-react'
import { getPermissionState, sendPushTest, subscribeToPush, unsubscribeFromPush } from '../services/push'
import { getSettings, updateSettings } from '../services/api'
import { useAppContext } from '../context/AppContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label } from '../components/ui/field'
import { MONEY_UNIT } from '../utils/currency'

export function SettingsPage() {
  const { token, logout, syncNow } = useAppContext()
  const [currency, setCurrency] = useState(MONEY_UNIT)
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
    <div className="grid gap-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">Settings</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Preferences, notifications, sync, and account actions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="icon-tile rounded-[var(--radius-lg)] p-2">
                <Settings className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Default units and reminder notification settings.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={save}>
              <Label>
                Currency
                <Input value={currency} placeholder={MONEY_UNIT} onChange={(event) => setCurrency(event.target.value)} maxLength={5} />
              </Label>
              <div className="form-cluster rounded-[var(--radius-lg)] px-4 py-3 text-sm text-slate-600">
                Consumption unit: <span className="font-medium text-slate-800">L/100km</span>
              </div>
              <label className="field-check flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold text-slate-700">
                <input className="h-4 w-4 rounded border-slate-300 text-[color:var(--accent)] focus:ring-[color:var(--ring)]" type="checkbox" checked={pushEnabled} onChange={(event) => setPushEnabled(event.target.checked)} />
                Enable reminder notifications
              </label>
              <div className="flex justify-end border-t border-[color:var(--border)] pt-5">
                <Button type="submit" disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                  {loading ? 'Saving...' : 'Save settings'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Push subscription controls.</CardDescription>
                </div>
                <Bell className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="form-cluster mb-4 flex items-center justify-between gap-3 rounded-[var(--radius-lg)] px-3 py-2">
                <span className="text-sm font-medium text-slate-600">Permission</span>
                <Badge variant={permission === 'granted' ? 'success' : permission === 'denied' ? 'danger' : 'neutral'}>{permission}</Badge>
              </div>
              <div className="grid gap-2">
                <Button type="button" variant="secondary" onClick={() => void subscribe()}>Subscribe</Button>
                <Button type="button" variant="secondary" onClick={() => void unsubscribe()}>
                  <WifiOff className="h-4 w-4" aria-hidden="true" />
                  Unsubscribe
                </Button>
                <Button type="button" variant="secondary" onClick={() => void testPush()}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send test push
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync</CardTitle>
              <CardDescription>Force a manual data sync.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="secondary" className="w-full" onClick={() => void syncNow()}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Sync now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Button type="button" variant="destructive" className="w-full" onClick={logout}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {message ? <div className="notice rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-slate-600">{message}</div> : null}
    </div>
  )
}
