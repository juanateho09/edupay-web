import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, ArrowLeftRight, Pencil, Trash2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'
import api from '../api/axios'
import { formatCOP } from '../utils/formatCOP'

const SELECT_CLASS =
  'rounded-lg border border-[var(--ep-border)] bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)] outline-none focus:border-[var(--ep-teal)]'

function ModalCrearEditar({ open, onClose, bolsillo, onGuardado }) {
  const esEdicion = Boolean(bolsillo)
  const [nombre, setNombre] = useState('')
  const [saldoInicial, setSaldoInicial] = useState('0')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setNombre(bolsillo?.nombre || '')
    setSaldoInicial('0')
    setError('')
  }, [open, bolsillo])

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      if (esEdicion) {
        await api.put(`/bolsillos/${bolsillo.id}`, { nombre })
      } else {
        await api.post('/bolsillos', { nombre, saldo_inicial: Number(saldoInicial || 0) })
      }
      onGuardado()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el bolsillo')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? 'Editar bolsillo' : 'Nuevo bolsillo'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={enviando} onClick={enviar}>Guardar</Button>
        </>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={enviar}>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <Input label="Nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        {!esEdicion && (
          <Input
            label="Saldo inicial"
            type="number"
            min="0"
            step="0.01"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
          />
        )}
      </form>
    </Modal>
  )
}

function ModalTransferir({ open, onClose, bolsillos, origenInicial, onGuardado }) {
  const [origenId, setOrigenId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setOrigenId(origenInicial || '')
    setDestinoId('')
    setMonto('')
    setFecha(new Date().toISOString().slice(0, 10))
    setDescripcion('')
    setError('')
  }, [open, origenInicial])

  const opcionesDestino = useMemo(() => bolsillos.filter((b) => b.id !== origenId), [bolsillos, origenId])

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await api.post('/bolsillos/transferir', {
        bolsillo_origen_id: origenId,
        bolsillo_destino_id: destinoId,
        monto: Number(monto),
        fecha,
        descripcion,
      })
      onGuardado()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo realizar la transferencia')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transferir entre bolsillos"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={enviando} disabled={bolsillos.length < 2} onClick={enviar}>
            Transferir
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={enviar}>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {bolsillos.length < 2 && !error && (
          <Alert type="error" message="Necesitas al menos dos bolsillos para transferir." onClose={() => {}} />
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--ep-text)]">Origen</label>
          <select value={origenId} onChange={(e) => setOrigenId(e.target.value)} className={SELECT_CLASS} required>
            <option value="" disabled>Selecciona un bolsillo</option>
            {bolsillos.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre} ({formatCOP(b.saldo)})</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--ep-text)]">Destino</label>
          <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} className={SELECT_CLASS} required>
            <option value="" disabled>Selecciona un bolsillo</option>
            {opcionesDestino.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>

        <Input
          label="Monto"
          type="number"
          min="0.01"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />
        <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        <Input
          label="Descripción"
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </form>
    </Modal>
  )
}

export default function Bolsillos() {
  const [bolsillos, setBolsillos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalCrear, setModalCrear] = useState(false)
  const [bolsilloEditar, setBolsilloEditar] = useState(null)
  const [bolsilloTransferir, setBolsilloTransferir] = useState(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)

  const cargarBolsillos = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get('/bolsillos')
      setBolsillos(data ?? [])
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los bolsillos')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarBolsillos()
  }, [cargarBolsillos])

  const totalSaldo = bolsillos.reduce((total, b) => total + Number(b.saldo ?? 0), 0)

  const eliminar = async (id) => {
    try {
      await api.delete(`/bolsillos/${id}`)
      setConfirmandoEliminar(null)
      cargarBolsillos()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar el bolsillo')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--ep-text)]">Tus bolsillos</h2>
        <Button variant="primary" size="sm" onClick={() => setModalCrear(true)}>
          <Plus size={16} />
          Nuevo bolsillo
        </Button>
      </div>

      {!cargando && bolsillos.length === 0 && (
        <Card className="p-6 text-center text-sm text-[var(--ep-text-sec)]">
          No tienes bolsillos creados todavía.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bolsillos.map((b) => {
          const saldo = Number(b.saldo ?? 0)
          const porcentaje = totalSaldo ? Math.round((saldo / totalSaldo) * 100) : 0
          const puedeEliminar = saldo === 0

          return (
            <Card key={b.id} colorStrip="var(--ep-teal)" className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-[var(--ep-text)]">{b.nombre}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setBolsilloEditar(b)}
                    className="rounded p-1 text-[var(--ep-text-sec)] hover:bg-[var(--ep-border)]/30"
                    aria-label="Editar"
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => puedeEliminar && setConfirmandoEliminar(b.id)}
                    disabled={!puedeEliminar}
                    className="rounded p-1 text-[var(--ep-danger)] hover:bg-[var(--ep-danger)]/10 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Eliminar"
                    title={puedeEliminar ? 'Eliminar' : 'Solo se puede eliminar con saldo en $0'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-2xl font-bold text-[var(--ep-teal)]">{formatCOP(saldo)}</p>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--ep-border)]">
                <div
                  className="h-full rounded-full bg-[var(--ep-teal)] transition-all"
                  style={{ width: `${porcentaje}%`, minWidth: '4px' }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--ep-text-sec)]">{porcentaje}% del total</p>

              {confirmandoEliminar === b.id ? (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-[var(--ep-text-sec)]">¿Eliminar bolsillo?</span>
                  <button onClick={() => eliminar(b.id)} className="font-medium text-[var(--ep-danger)]">Sí</button>
                  <button onClick={() => setConfirmandoEliminar(null)} className="font-medium text-[var(--ep-text-sec)]">No</button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setBolsilloTransferir(b.id)}
                >
                  <ArrowLeftRight size={14} />
                  Transferir
                </Button>
              )}
            </Card>
          )
        })}
      </div>

      <ModalCrearEditar
        open={modalCrear || Boolean(bolsilloEditar)}
        onClose={() => {
          setModalCrear(false)
          setBolsilloEditar(null)
        }}
        bolsillo={bolsilloEditar}
        onGuardado={cargarBolsillos}
      />

      <ModalTransferir
        open={Boolean(bolsilloTransferir)}
        onClose={() => setBolsilloTransferir(null)}
        bolsillos={bolsillos}
        origenInicial={bolsilloTransferir}
        onGuardado={cargarBolsillos}
      />
    </div>
  )
}
