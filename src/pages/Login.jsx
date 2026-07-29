import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const cargando = useAuthStore((s) => s.cargando)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ep-bg)] px-4">
      <div className="w-full max-w-sm rounded-[10px] border border-[var(--ep-border)] bg-[var(--ep-card)] p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/logo.png" alt="Edupay" className="h-12 w-12" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <h1 className="text-xl font-semibold text-[var(--ep-text)]">Edupay</h1>
          <p className="text-sm text-[var(--ep-text-sec)]">Inicia sesión en tu cuenta</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={enviar}>
          <Input
            label="Correo electrónico"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" loading={cargando} className="mt-2 w-full">
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--ep-text-sec)]">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-[var(--ep-teal)] hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
