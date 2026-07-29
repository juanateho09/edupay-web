import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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

// GET /metas ya devuelve saldo_actual, porcentaje_logrado y completada resueltos server-side
// (join con bolsillos en metas.service.js -> listar/enriquecer), no hace falta cruzar con
// GET /bolsillos salvo para poblar el selector del formulario de creación.
function ModalMeta({ open, onClose, meta, bolsillos, onGuardado }) {
  const esEdicion = Boolean(meta)

  const [nombre, setNombre] = useState('')
  const [montoObjetivo, setMontoObjetivo] = useState('')
  const [bolsilloId, setBolsilloId] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (meta) {
      setNombre(meta.nombre)
      setMontoObjetivo(String(meta.monto_objetivo))
      setBolsilloId(meta.bolsillo_id)
    } else {
      setNombre('')
      setMontoObjetivo('')
      setBolsilloId('')
    }
    setError('')
  }, [open, meta])

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      if (esEdicion) {
        // PUT /metas/:id solo acepta nombre/monto_objetivo (bolsillo_id es inmutable,
        // ver metas.controller.js -> editar).
        await api.put(`/metas/${meta.id}`, { nombre, monto_objetivo: Number(montoObjetivo) })
      } else {
        await api.post('/metas', {
          nombre,
          monto_objetivo: Number(montoObjetivo),
          bolsillo_id: bolsilloId,
        })
      }
      onGuardado()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la meta')
    } finally {
      setEnviando(false)
    }
  }

  const faltanBolsillos = !esEdicion && bolsillos.length === 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? 'Editar meta' : 'Nueva meta'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={enviando} disabled={faltanBolsillos} onClick={enviar}>
            Guardar
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={enviar}>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {faltanBolsillos && !error && (
          <Alert
            type="error"
            message="Necesitas al menos un bolsillo creado para asociar una meta."
            onClose={() => {}}
          />
        )}

        <Input label="Nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

        {esEdicion ? (
          <p className="text-sm text-[var(--ep-text-sec)]">
            Bolsillo: <span className="font-medium text-[var(--ep-text)]">{meta.bolsillo_nombre}</span>
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--ep-text)]">Bolsillo</label>
            <select value={bolsilloId} onChange={(e) => setBolsilloId(e.target.value)} className={SELECT_CLASS} required>
              <option value="" disabled>Selecciona un bolsillo</option>
              {bolsillos.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Monto objetivo"
          type="number"
          min="0.01"
          step="0.01"
          value={montoObjetivo}
          onChange={(e) => setMontoObjetivo(e.target.value)}
          required
        />
      </form>
    </Modal>
  )
}

export default function Metas() {
  const [metas, setMetas] = useState([])
  const [bolsillos, setBolsillos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [metaEditar, setMetaEditar] = useState(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)

  const cargarBolsillos = useCallback(async () => {
    try {
      const { data } = await api.get('/bolsillos')
      setBolsillos(data ?? [])
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los bolsillos')
    }
  }, [])

  const cargarMetas = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get('/metas')
      setMetas(data ?? [])
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las metas')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarBolsillos()
  }, [cargarBolsillos])

  useEffect(() => {
    cargarMetas()
  }, [cargarMetas])

  const eliminar = async (id) => {
    try {
      await api.delete(`/metas/${id}`)
      setConfirmandoEliminar(null)
      cargarMetas()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar la meta')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--ep-text)]">Tus metas</h2>
        <Button variant="primary" size="sm" onClick={() => setModalNuevo(true)}>
          <Plus size={16} />
          Nueva meta
        </Button>
      </div>

      {!cargando && metas.length === 0 && (
        <Card className="p-6 text-center text-sm text-[var(--ep-text-sec)]">
          No tienes metas creadas todavía.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metas.map((m) => {
          const saldoActual = Number(m.saldo_actual)
          const montoObjetivo = Number(m.monto_objetivo)
          const porcentaje = Number(m.porcentaje_logrado)
          const anchoBarra = Math.min(porcentaje, 100)

          return (
            <Card key={m.id} colorStrip="var(--ep-teal)" className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-[var(--ep-text)]">{m.nombre}</h3>
                {m.completada && <Badge variant="success">Completada</Badge>}
              </div>
              <p className="text-xs text-[var(--ep-text-sec)]">{m.bolsillo_nombre}</p>

              <p className="mt-2 text-3xl font-bold text-[var(--ep-teal)]">{porcentaje}%</p>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--ep-border)]">
                <div
                  className="h-full rounded-full bg-[var(--ep-teal)] transition-all"
                  style={{ width: `${anchoBarra}%`, minWidth: '4px' }}
                />
              </div>

              <p className="mt-2 text-sm text-[var(--ep-text-sec)]">
                {formatCOP(saldoActual)} de {formatCOP(montoObjetivo)}
              </p>

              {confirmandoEliminar === m.id ? (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-[var(--ep-text-sec)]">¿Eliminar meta?</span>
                  <button onClick={() => eliminar(m.id)} className="font-medium text-[var(--ep-danger)]">Sí</button>
                  <button onClick={() => setConfirmandoEliminar(null)} className="font-medium text-[var(--ep-text-sec)]">No</button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => setMetaEditar(m)}>
                    <Pencil size={14} />
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" className="flex-1" onClick={() => setConfirmandoEliminar(m.id)}>
                    <Trash2 size={14} />
                    Eliminar
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <ModalMeta
        open={modalNuevo || Boolean(metaEditar)}
        onClose={() => {
          setModalNuevo(false)
          setMetaEditar(null)
        }}
        meta={metaEditar}
        bolsillos={bolsillos}
        onGuardado={cargarMetas}
      />
    </div>
  )
}
