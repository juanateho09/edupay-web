import { useEffect, useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Alert from '../ui/Alert'
import api from '../../api/axios'

const SELECT_CLASS =
  'rounded-lg border border-[var(--ep-border)] bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)] outline-none focus:border-[var(--ep-teal)]'

export default function ModalMovimiento({
  open,
  onClose,
  tipo,
  movimiento,
  bolsillos,
  categorias,
  etiquetasDisponibles,
  onGuardado,
  fechaInicial,
  estadoInicial = 'REAL',
}) {
  const esEdicion = Boolean(movimiento)

  const [bolsilloId, setBolsilloId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState(estadoInicial)
  const [etiquetaIds, setEtiquetaIds] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (movimiento) {
      setBolsilloId(movimiento.bolsillo_id)
      setCategoriaId(movimiento.categoria_id)
      setMonto(String(movimiento.monto))
      setFecha(movimiento.fecha.slice(0, 10))
      setDescripcion(movimiento.descripcion || '')
      setEstado(movimiento.estado)
      setEtiquetaIds((movimiento.etiquetas || []).map((e) => e.id))
    } else {
      setBolsilloId('')
      setCategoriaId('')
      setMonto('')
      setFecha(fechaInicial || new Date().toISOString().slice(0, 10))
      setDescripcion('')
      setEstado(estadoInicial)
      setEtiquetaIds([])
    }
    setError('')
  }, [open, movimiento, fechaInicial, estadoInicial])

  const categoriasFiltradas = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo]
  )

  const toggleEtiqueta = (id) => {
    setEtiquetaIds((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]))
  }

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      if (esEdicion) {
        await api.put(`/movimientos/${movimiento.id}`, {
          categoria_id: categoriaId,
          monto: Number(monto),
          fecha,
          descripcion,
          etiqueta_ids: etiquetaIds,
        })
      } else {
        await api.post('/movimientos', {
          bolsillo_id: bolsilloId,
          categoria_id: categoriaId,
          tipo,
          estado,
          monto: Number(monto),
          fecha,
          descripcion,
          etiqueta_ids: etiquetaIds,
        })
      }
      onGuardado()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el movimiento')
    } finally {
      setEnviando(false)
    }
  }

  const faltanRequisitos = !esEdicion && (bolsillos.length === 0 || categoriasFiltradas.length === 0)

  const titulo = esEdicion
    ? 'Editar movimiento'
    : estadoInicial === 'PLANEADO'
      ? 'Planear gasto'
      : tipo === 'INGRESO'
        ? 'Nuevo ingreso'
        : 'Nuevo gasto'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titulo}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant={tipo === 'INGRESO' ? 'primary' : 'secondary'}
            loading={enviando}
            disabled={faltanRequisitos}
            onClick={enviar}
          >
            Guardar
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={enviar}>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {faltanRequisitos && !error && (
          <Alert
            type="error"
            message={`Necesitas al menos un bolsillo y una categoría de tipo ${tipo === 'INGRESO' ? 'ingreso' : 'gasto'}.`}
            onClose={() => {}}
          />
        )}

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
          label="Fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
        <Input
          label="Descripción"
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        {!esEdicion && (
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

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--ep-text)]">Categoría</label>
          <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={SELECT_CLASS} required>
            <option value="" disabled>Selecciona una categoría</option>
            {categoriasFiltradas.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--ep-text)]">Etiquetas</label>
          <div className="flex flex-wrap gap-2">
            {etiquetasDisponibles.length === 0 && (
              <span className="text-sm text-[var(--ep-text-sec)]">No tienes etiquetas creadas</span>
            )}
            {etiquetasDisponibles.map((et) => (
              <button
                key={et.id}
                type="button"
                onClick={() => toggleEtiqueta(et.id)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  etiquetaIds.includes(et.id)
                    ? 'border-[var(--ep-teal)] bg-[var(--ep-teal)] text-white'
                    : 'border-[var(--ep-border)] text-[var(--ep-text-sec)] hover:border-[var(--ep-teal)]'
                }`}
              >
                {et.nombre}
              </button>
            ))}
          </div>
        </div>

        {!esEdicion && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--ep-text)]">Estado</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={estado === 'REAL' ? 'primary' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setEstado('REAL')}
              >
                Real
              </Button>
              <Button
                type="button"
                variant={estado === 'PLANEADO' ? 'primary' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setEstado('PLANEADO')}
              >
                Planeado
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
