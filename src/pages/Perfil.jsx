import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'

function obtenerIniciales(nombre) {
  if (!nombre) return ''
  const partes = nombre.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function SeccionMiCuenta({ usuario }) {
  const fechaRegistro = usuario?.created_at
    ? new Date(usuario.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-[var(--ep-text)]">Mi cuenta</h3>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--ep-teal)] text-xl font-semibold text-white">
          {obtenerIniciales(usuario?.nombre)}
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--ep-text)]">{usuario?.nombre}</p>
          <p className="text-sm text-[var(--ep-text-sec)]">{usuario?.email}</p>
          <p className="mt-1 text-xs text-[var(--ep-text-sec)]">Miembro desde {fechaRegistro}</p>
        </div>
      </div>
    </Card>
  )
}

function SeccionCambiarPassword() {
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [alerta, setAlerta] = useState(null)

  const enviar = async (e) => {
    e.preventDefault()
    setAlerta(null)

    if (passwordNueva !== passwordConfirmar) {
      setAlerta({ type: 'error', message: 'La nueva contraseña y la confirmación no coinciden' })
      return
    }

    setEnviando(true)
    try {
      await api.patch('/auth/cambiar-password', { passwordActual, passwordNueva })
      setAlerta({ type: 'success', message: 'Contraseña actualizada correctamente' })
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordConfirmar('')
    } catch (err) {
      setAlerta({ type: 'error', message: err.response?.data?.error || 'No se pudo actualizar la contraseña' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-[var(--ep-text)]">Cambiar contraseña</h3>

      {alerta && (
        <div className="mt-3">
          <Alert type={alerta.type} message={alerta.message} onClose={() => setAlerta(null)} />
        </div>
      )}

      <form className="mt-4 flex flex-col gap-3" onSubmit={enviar}>
        <Input
          label="Contraseña actual"
          type="password"
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
          required
        />
        <Input
          label="Nueva contraseña"
          type="password"
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
          minLength={6}
          required
        />
        <Input
          label="Confirmar nueva contraseña"
          type="password"
          value={passwordConfirmar}
          onChange={(e) => setPasswordConfirmar(e.target.value)}
          minLength={6}
          required
        />
        <Button type="submit" variant="primary" loading={enviando} className="mt-2 self-start">
          Actualizar
        </Button>
      </form>
    </Card>
  )
}

function SeccionDangerZone() {
  const [alerta, setAlerta] = useState(null)

  const eliminarCuenta = () => {
    const primeraConfirmacion = window.confirm(
      '¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.'
    )
    if (!primeraConfirmacion) return

    const segundaConfirmacion = window.confirm(
      'Esta es tu última oportunidad. ¿Confirmas que quieres eliminar tu cuenta de forma permanente?'
    )
    if (!segundaConfirmacion) return

    setAlerta({ type: 'error', message: 'Función próximamente disponible' })
  }

  return (
    <Card className="p-5 border-[var(--ep-danger)]/40">
      <h3 className="text-base font-semibold text-[var(--ep-danger)]">Zona de peligro</h3>
      <p className="mt-1 text-sm text-[var(--ep-text-sec)]">
        Eliminar tu cuenta borrará todos tus datos de forma permanente.
      </p>

      {alerta && (
        <div className="mt-3">
          <Alert type={alerta.type} message={alerta.message} onClose={() => setAlerta(null)} />
        </div>
      )}

      <Button variant="danger" className="mt-4" onClick={eliminarCuenta}>
        Eliminar cuenta
      </Button>
    </Card>
  )
}

export default function Perfil() {
  const usuario = useAuthStore((s) => s.usuario)

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h2 className="text-lg font-semibold text-[var(--ep-text)]">Perfil</h2>
      <SeccionMiCuenta usuario={usuario} />
      <SeccionCambiarPassword />
      <SeccionDangerZone />
    </div>
  )
}
