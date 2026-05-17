import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, Lock, Mail, User } from 'lucide-react'
import { register } from '../services/api'
import { useAppContext } from '../context/AppContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input, Label } from '../components/ui/field'

export function RegisterPage() {
  const navigate = useNavigate()
  const { loginSuccess } = useAppContext()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await register(email, password, displayName)
      await loginSuccess(result.token, result.user)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell grid min-h-screen place-items-center px-4 py-8">
      <Card className="auth-card w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-slate-950 text-white shadow-[var(--shadow-sm)]">
            <Car className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="section-kicker">NMIVA</p>
          <CardTitle className="mt-2 text-2xl tracking-[-0.03em]">Register</CardTitle>
          <CardDescription>Set up fuel, service, expenses, and reminders.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <Label>
              Name
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input className="pl-9" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
              </div>
            </Label>
            <Label>
              Email
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input className="pl-9" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </Label>
            <Label>
              Password
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input className="pl-9" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
            </Label>
            {error ? <p className="rounded-[var(--radius-md)] border border-red-200 bg-[color:var(--danger-soft)] px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
            <Button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</Button>
            <p className="text-center text-sm text-slate-500">Have an account? <Link className="font-medium text-[color:var(--accent-strong)] hover:text-[color:var(--accent)]" to="/login">Login</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
