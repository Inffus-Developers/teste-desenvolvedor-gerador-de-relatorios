import { type FormEvent, useEffect, useState } from 'react'
import { getAuthenticatedUser, login, logout } from './services/auth'
import { ApiError } from './services/api'
import type { User } from './types/auth'
import { CustomerModule } from './components/customers/CustomerModule'
import { BillingModule } from './components/billings/BillingModule'
import { BillingReportModule } from './components/reports/BillingReportModule'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(() => Boolean(sessionStorage.getItem('auth_token')))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [activeModule, setActiveModule] = useState<'customers' | 'billings' | 'reports'>('customers')

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token')

    if (!token) return

    getAuthenticatedUser()
      .then(({ user: authenticatedUser }) => setUser(authenticatedUser))
      .catch(() => sessionStorage.removeItem('auth_token'))
      .finally(() => setIsCheckingSession(false))
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFeedback('')
    setIsSubmitting(true)

    try {
      const response = await login(email, password)
      sessionStorage.setItem('auth_token', response.token)
      setUser(response.user)
      setPassword('')
      setFeedback('Login realizado com sucesso.')
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.errors.email?.[0] ?? requestError.message)
      } else {
        setError('Não foi possível conectar ao servidor.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    setIsSubmitting(true)
    setError('')

    try {
      await logout()
    } catch {
      // The local session must be cleared even if the token has expired.
    } finally {
      sessionStorage.removeItem('auth_token')
      setUser(null)
      setFeedback('Sessão encerrada com sucesso.')
      setIsSubmitting(false)
    }
  }

  if (isCheckingSession) {
    return (
      <main className="auth-layout" aria-live="polite">
        <div className="loader" role="status">Verificando sessão...</div>
      </main>
    )
  }

  if (user) {
    return (
      <main className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Sistema de faturamento</span>
            <h1>Olá, {user.name}</h1>
            <p>{user.email}</p>
          </div>
          <button className="button button--secondary" onClick={handleLogout} disabled={isSubmitting}>
            {isSubmitting ? 'Saindo...' : 'Sair'}
          </button>
        </header>

        <nav className="module-nav" aria-label="Módulos do sistema">
          <button className={activeModule === 'customers' ? 'is-active' : ''} onClick={() => setActiveModule('customers')}>Clientes</button>
          <button className={activeModule === 'billings' ? 'is-active' : ''} onClick={() => setActiveModule('billings')}>Cobranças</button>
          <button className={activeModule === 'reports' ? 'is-active' : ''} onClick={() => setActiveModule('reports')}>Relatórios</button>
        </nav>
        {feedback && <div className="alert alert--success page-feedback" role="status">{feedback}</div>}
        {activeModule === 'customers' && <CustomerModule />}
        {activeModule === 'billings' && <BillingModule />}
        {activeModule === 'reports' && <BillingReportModule />}
      </main>
    )
  }

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <span className="eyebrow">Gestão financeira</span>
        <h1>Faturamento claro, do cadastro ao relatório.</h1>
        <p>Acompanhe clientes, cobranças, pagamentos e resultados em um só lugar.</p>
      </section>

      <section className="auth-card" aria-labelledby="login-title">
        <div>
          <span className="eyebrow">Acesso seguro</span>
          <h2 id="login-title">Entre na sua conta</h2>
          <p>Use as credenciais fornecidas pelo administrador.</p>
        </div>

        {error && <div className="alert alert--error" role="alert">{error}</div>}
        {feedback && <div className="alert alert--success" role="status">{feedback}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@empresa.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
