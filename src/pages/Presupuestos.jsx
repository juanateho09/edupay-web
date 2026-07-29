import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import api from '../api/axios'
import { useMesStore } from '../store/mesStore'
import { formatCOP } from '../utils/formatCOP'

const SELECT_CLASS =
  'rounded-lg border border-[var(--ep-border)] bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)] outline-none focus:border-[var(--ep-teal)]'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Umbrales y etiquetas alineados 1:1 con presupuestos.service.js del backend
// (porcentaje > 100 => EXCEDIDO, >= 75 => ALERTA, si no => OK). El color "warning"
// reutiliza la misma escala amarilla que ya usa Badge.jsx para su variante "warning",
// en vez de introducir un nuevo color hardcodeado.
const ESTADO_INFO = {
  OK: { label: 'En orden', badge: 'success', textClass: 'text-[var(--ep-teal)]', barClass: 'bg-[var(--ep-teal)]' },
  ALERTA: { label: 'Cerca del límite', badge: 'warning', textClass: 'text-yellow-600', barClass: 'bg-yellow-500' },
  EXCEDIDO: { label: 'Excedido', badge: 'danger', textClass: 'text-[var(--ep-danger)]', barClass: 'bg-[var(--ep-danger)]' },
}

function ModalPresupuesto({ open, onClose, presupuesto, categorias, mes, anio, onGuardado }) {
  const esEdicion = Boolean(presupuesto)

  const [categoriaId, setCategoriaId] = useState('')
  const [limite, setLimite] = useState('')
  const [mesForm, setMesForm] = useState(mes)
  const [anioForm, setAnioForm] = useState(anio)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (presupuesto) {
      setCategoriaId(presupuesto.categoria_id)
      setLimite(String(presupuesto.limite))
      setMesForm(presupuesto.mes)
      setAnioForm(presupuesto.anio)
    } else {
      setCategoriaId('')
      setLimite('')
      setMesForm(mes)
      setAnioForm(anio)
    }
    setError('')
  }, [open, presupuesto, mes, anio])

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      if (esEdicion) {
        // PUT /presupuestos/:id solo acepta `limite` (categoria_id/mes/anio son inmutables,
        // ver presupuestos.controller.js -> editar).
        await api.put(`/presupuestos/${presupuesto.id}`, { limite: Number(limite) })
      } else {
        await api.post('/presupuestos', {
          categoria_id: categoriaId,
          limite: Number(limite),
          mes: mesForm,
          anio: anioForm,
        })
      }
      onGuardado()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el presupuesto')
    } finally {
      setEnviando(false)
    }
  }

  const faltanCategorias = !esEdicion && categorias.length === 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? 'Editar límite de presupuesto' : 'Nuevo presupuesto'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={enviando} disabled={faltanCategorias} onClick={enviar}>
            Guardar
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={enviar}>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {faltanCategorias && !error && (
          <Alert
            type="error"
            message="Necesitas al menos una categoría de tipo gasto para crear un presupuesto."
            onClose={() => {}}
          />
        )}

        {esEdicion ? (
          <p className="text-sm text-[var(--ep-text-sec)]">
            Categoría:{' '}
            <span className="font-medium text-[var(--ep-text)]">{presupuesto.categoria_nombre}</span>
            {' — '}
            {MESES[presupuesto.mes - 1]} {presupuesto.anio}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--ep-text)]">Categoría</label>
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={SELECT_CLASS} required>
                <option value="" disabled>Selecciona una categoría de gasto</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-[var(--ep-text)]">Mes</label>
                <select value={mesForm} onChange={(e) => setMesForm(Number(e.target.value))} className={SELECT_CLASS}>
                  {MESES.map((nombre, idx) => (
                    <option key={idx} value={idx + 1}>{nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium text-[var(--ep-text)]">Año</label>
                <select value={anioForm} onChange={(e) => setAnioForm(Number(e.target.value))} className={SELECT_CLASS}>
                  {Array.from({ length: 5 }, (_, i) => anioForm - 2 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        <Input
          label="Límite"
          type="number"
          min="0.01"
          step="0.01"
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
          required
        />
      </form>
    </Modal>
  )
}

export default function Presupuestos() {
  const { mes, anio } = useMesStore()

  const [presupuestos, setPresupuestos] = useState([])
  const [categoriasGasto, setCategoriasGasto] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [presupuestoEditar, setPresupuestoEditar] = useState(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)

  const cargarCategorias = useCallback(async () => {
    try {
      const { data } = await api.get('/categorias', { params: { tipo: 'GASTO' } })
      setCategoriasGasto(data ?? [])
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar las categorías')
    }
  }, [])

  const cargarPresupuestos = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get('/presupuestos', { params: { mes, anio } })
      setPresupuestos(data ?? [])
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los presupuestos')
    } finally {
      setCargando(false)
    }
  }, [mes, anio])

  useEffect(() => {
    cargarCategorias()
  }, [cargarCategorias])

  useEffect(() => {
    cargarPresupuestos()
  }, [cargarPresupuestos])

  const eliminar = async (id) => {
    try {
      await api.delete(`/presupuestos/${id}`)
      setConfirmandoEliminar(null)
      cargarPresupuestos()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar el presupuesto')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--ep-text)]">
          Presupuestos de {MESES[mes - 1]} {anio}
        </h2>
        <Button variant="primary" size="sm" onClick={() => setModalNuevo(true)}>
          <Plus size={16} />
          Nuevo presupuesto
        </Button>
      </div>

      {!cargando && presupuestos.length === 0 && (
        <Card className="p-6 text-center text-sm text-[var(--ep-text-sec)]">
          No tienes presupuestos creados para este período.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presupuestos.map((p) => {
          const limite = Number(p.limite)
          const gastoActual = Number(p.gasto_actual)
          const porcentaje = Number(p.porcentaje_consumido)
          const info = ESTADO_INFO[p.estado] || ESTADO_INFO.OK
          const anchoBarra = Math.min(porcentaje, 100)

          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-[var(--ep-text)]">{p.categoria_nombre}</h3>
                <Badge variant={info.badge}>{info.label}</Badge>
              </div>

              <p className={`mt-2 text-3xl font-bold ${info.textClass}`}>{porcentaje}%</p>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--ep-border)]">
                <div
                  className={`h-full rounded-full transition-all ${info.barClass}`}
                  style={{ width: `${anchoBarra}%`, minWidth: '4px' }}
                />
              </div>

              <p className="mt-2 text-sm text-[var(--ep-text-sec)]">
                {formatCOP(gastoActual)} de {formatCOP(limite)} gastado
              </p>

              {confirmandoEliminar === p.id ? (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-[var(--ep-text-sec)]">¿Eliminar presupuesto?</span>
                  <button onClick={() => eliminar(p.id)} className="font-medium text-[var(--ep-danger)]">Sí</button>
                  <button onClick={() => setConfirmandoEliminar(null)} className="font-medium text-[var(--ep-text-sec)]">No</button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => setPresupuestoEditar(p)}>
                    <Pencil size={14} />
                    Editar límite
                  </Button>
                  <Button variant="danger" size="sm" className="flex-1" onClick={() => setConfirmandoEliminar(p.id)}>
                    <Trash2 size={14} />
                    Eliminar
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <ModalPresupuesto
        open={modalNuevo || Boolean(presupuestoEditar)}
        onClose={() => {
          setModalNuevo(false)
          setPresupuestoEditar(null)
        }}
        presupuesto={presupuestoEditar}
        categorias={categoriasGasto}
        mes={mes}
        anio={anio}
        onGuardado={cargarPresupuestos}
      />
    </div>
  )
}
