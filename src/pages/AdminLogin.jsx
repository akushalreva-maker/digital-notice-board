import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from '../lib/supabase.js'

function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    if (!isSupabaseConfigured) {
      return undefined
    }

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isCurrent) return
      if (sessionError) setError(`Unable to check your session. ${sessionError.message}`)
      setUser(data?.session?.user || null)
      setLoading(false)
    })

    return () => { isCurrent = false }
  }, [])

  if (user) return <Navigate to="/admin" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError(supabaseConfigMessage)
      return
    }
    setSubmitting(true)
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (loginError) {
      setError(`Sign-in failed. ${loginError.message}`)
      return
    }
    setUser(data.user)
    navigate(location.state?.from || '/admin', { replace: true })
  }

  return (
    <main className="login-shell page-shell">
      <section className="login-card">
        <div className="login-emblem" aria-hidden="true">N</div>
        <p className="eyebrow">Administrator access</p>
        <h1>Welcome back.</h1>
        <p className="login-intro">Sign in to manage campus announcements.</p>
        {!isSupabaseConfigured && <p className="notice-banner" role="status">{supabaseConfigMessage}</p>}
        {error && <p className="form-alert" role="alert">{error}</p>}
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email address</span>
            <input autoComplete="username" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label className="field">
            <span>Password</span>
            <input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          <button className="button button-primary form-submit" disabled={loading || submitting || !isSupabaseConfigured} type="submit">
            {loading ? 'Checking session…' : submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <Link className="back-link login-back" to="/">← Return to notices</Link>
      </section>
    </main>
  )
}

export default AdminLogin
