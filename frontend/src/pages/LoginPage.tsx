import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/api'
import { useAppContext } from '../context/AppContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { loginSuccess } = useAppContext()
  const [email, setEmail] = useState('demo@nmiva.local')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await login(email, password)
      await loginSuccess(result.token, result.user)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card form" onSubmit={onSubmit}>
        <h2>Login</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        <p className="helper">No account? <Link to="/register">Create one</Link></p>
      </form>
    </div>
  )
}
