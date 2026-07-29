import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import api from '../api/axios'
import { formatCOP } from '../utils/formatCOP'

const SELECT_CLASS =
  'rounded-lg border border-[var(--ep-border)] bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)] outline-none focus:border-[var(--ep-teal)]'

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'pagadas', label: 'Pagadas' },
]

function ModalDeuda({ open, onClose, deuda, tipoInicial, onGuardado }) {
  const esEdicion = Boolean(deuda)

  const [persona, setPersona] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState('ME_DEBEN')
  const [fechaLimite, setFechaLimite] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (deuda) {
      setPersona(deuda.persona)
      setMonto(String(deuda.monto))
      setDescripcion(deuda.descripcion || '')
      setTipo(deuda.tipo)
      setFechaLimite(deuda.fecha_limite ? String(deuda.fecha_limite).slice(0, 10) : '')
    } else {
      setPersona('')
      setMonto('')
      setDescripcion('')
      setTipo(tipoInicial || 'ME_DEBEN')
      setFechaLimite('')
    }
    setError('')
  }, [open, deuda, tipoInicial])

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      const payload = {
        persona,
        monto: Number(monto),
        descripcion,
        tipo,
        fecha_limite: fechaLimite || null,
      }
      if (esEdicion) {
        await api.put(`/deudas/${deuda.id}`, payload)
      } else {
        await api.post('/deudas', payload)
      }
      onGuardado()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la deuda')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? 'Editar deuda' : 'Nueva deuda'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={enviando} onClick={enviar}>Guardar</Button>
        </>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={enviar}>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--ep-text)]">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={SELECT_CLASS} required>
            <option value="ME_DEBEN">Me deben</option>
            <option value="LE_DEBO">Le debo</option>
          </select>
        </div>

        <Input label="Persona" type="text" value={persona} onChange={(e) => setPersona(e.target.value)} required />

        <Input
          label="Monto"
          type="number"
          min="0.01"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />

        <Input
          label="Descripción"
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <Input
          label="Fecha límite"
          type="date"
          value={fechaLimite}
          onChange={(e) => setFechaLimite(e.target.value)}
        />
      </form>
    </Modal>
  )
}

function ColumnaDeudas({ titulo, deudas, onEditar, onEliminar, onPagar, confirmandoEliminar, setConfirmandoEliminar }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--ep-text)]">{titulo}</h3>

      {deudas.length === 0 && (
        <Card className="p-4 text-center text-sm text-[var(--ep-text-sec)]">
          No hay deudas en esta categoría.
        </Card>
      )}

      {deudas.map((d) => (
        <Card key={d.id} colorStrip={d.pagada ? 'var(--ep-teal)' : 'var(--ep-mid)'} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-semibold text-[var(--ep-text)]">{d.persona}</h4>
            <Badge variant={d.pagada ? 'success' : 'warning'}>{d.pagada ? 'Pagada' : 'Pendiente'}</Badge>
          </div>

          <p className="mt-1 text-2xl font-bold text-[var(--ep-text)]">{formatCOP(d.monto)}</p>

          {d.descripcion && <p className="mt-1 text-sm text-[var(--ep-text-sec)]">{d.descripcion}</p>}

          {d.fecha_limite && (
            <p className="mt-1 text-xs text-[var(--ep-text-sec)]">
              Fecha límite: {new Date(`${String(d.fecha_limite).slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO')}
            </p>
          )}

          {confirmandoEliminar === d.id ? (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-[var(--ep-text-sec)]">¿Eliminar deuda?</span>
              <button onClick={() => onEliminar(d.id)} className="font-medium text-[var(--ep-danger)]">Sí</button>
              <button onClick={() => setConfirmandoEliminar(null)} className="font-medium text-[var(--ep-text-sec)]">No</button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {!d.pagada && (
                <Button variant="primary" size="sm" onClick={() => onPagar(d.id)}>
                  <CheckCircle2 size={14} />
                  Marcar como pagada
                </Button>
              )}
              <div className="flex gap-2">
                {!d.pagada && (
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => onEditar(d)}>
                    <Pencil size={14} />
                    Editar
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => setConfirmandoEliminar(d.id)}
                >
                  <Trash2 size={14} />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

export default function Deudas() {
  const [deudas, setDeudas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [deudaEditar, setDeudaEditar] = useState(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)

  const cargarDeudas = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      // GET /deudas soporta ?pagada=true|false server-side (deudas.controller.js -> listar);
      // "todas" simplemente omite el query param.
      const params = {}
      if (filtro === 'pendientes') params.pagada = 'false'
      if (filtro === 'pagadas') params.pagada = 'true'

      const { data } = await api.get('/deudas', { params })
      setDeudas(data ?? [])
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las deudas')
    } finally {
      setCargando(false)
    }
  }, [filtro])

  useEffect(() => {
    cargarDeudas()
  }, [cargarDeudas])

  const eliminar = async (id) => {
    try {
      await api.delete(`/deudas/${id}`)
      setConfirmandoEliminar(null)
      cargarDeudas()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar la deuda')
    }
  }

  const pagar = async (id) => {
    setError('')
    try {
      await api.patch(`/deudas/${id}/pagar`)
      cargarDeudas()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo marcar la deuda como pagada')
    }
  }

  const meDeuden = deudas.filter((d) => d.tipo === 'ME_DEBEN')
  const leDebo = deudas.filter((d) => d.tipo === 'LE_DEBO')

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--ep-text)]">Tus deudas</h2>
        <div className="flex items-center gap-3">
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className={SELECT_CLASS}>
            {FILTROS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <Button variant="primary" size="sm" onClick={() => setModalNuevo(true)}>
            <Plus size={16} />
            Nueva deuda
          </Button>
        </div>
      </div>

      {!cargando && deudas.length === 0 && (
        <Card className="p-6 text-center text-sm text-[var(--ep-text-sec)]">
          No tienes deudas registradas.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ColumnaDeudas
          titulo="Me deben"
          deudas={meDeuden}
          onEditar={setDeudaEditar}
          onEliminar={eliminar}
          onPagar={pagar}
          confirmandoEliminar={confirmandoEliminar}
          setConfirmandoEliminar={setConfirmandoEliminar}
        />
        <ColumnaDeudas
          titulo="Le debo"
          deudas={leDebo}
          onEditar={setDeudaEditar}
          onEliminar={eliminar}
          onPagar={pagar}
          confirmandoEliminar={confirmandoEliminar}
          setConfirmandoEliminar={setConfirmandoEliminar}
        />
      </div>

      <ModalDeuda
        open={modalNuevo || Boolean(deudaEditar)}
        onClose={() => {
          setModalNuevo(false)
          setDeudaEditar(null)
        }}
        deuda={deudaEditar}
        onGuardado={cargarDeudas}
      />
    </div>
  )
}
