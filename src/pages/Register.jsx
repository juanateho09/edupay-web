import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const registrar = useAuthStore((s) => s.registrar)
  const cargando = useAuthStore((s) => s.cargando)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await registrar(nombre, email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la cuenta')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ep-bg)] px-4">
      <div className="w-full max-w-sm rounded-[10px] border border-[var(--ep-border)] bg-[var(--ep-card)] p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/logo.png" alt="Edupay" className="h-12 w-12" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <h1 className="text-xl font-semibold text-[var(--ep-text)]">Edupay</h1>
          <p className="text-sm text-[var(--ep-text-sec)]">Crea tu cuenta</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={enviar}>
          <Input
            label="Nombre"
            type="text"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
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
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--ep-text-sec)]">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-[var(--ep-teal)] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
