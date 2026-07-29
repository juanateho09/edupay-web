import { useCallback, useEffect, useMemo, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import ModalMovimiento from '../components/movimientos/ModalMovimiento'
import api from '../api/axios'
import { useMesStore } from '../store/mesStore'
import { formatCOP } from '../utils/formatCOP'

function aFechaLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function Calendario() {
  const { mes: mesGlobal, anio: anioGlobal } = useMesStore()

  const [mesActivo, setMesActivo] = useState(mesGlobal)
  const [anioActivo, setAnioActivo] = useState(anioGlobal)
  const [movimientos, setMovimientos] = useState([])
  const [bolsillos, setBolsillos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null)
  const [modalPlanear, setModalPlanear] = useState(false)

  const cargarMovimientos = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const { data } = await api.get('/movimientos', { params: { mes: mesActivo, anio: anioActivo } })
      setMovimientos(data ?? [])
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los movimientos')
    } finally {
      setCargando(false)
    }
  }, [mesActivo, anioActivo])

  const cargarCatalogos = useCallback(async () => {
    try {
      const [bolsillosRes, categoriasRes, etiquetasRes] = await Promise.all([
        api.get('/bolsillos'),
        api.get('/categorias'),
        api.get('/etiquetas'),
      ])
      setBolsillos(bolsillosRes.data ?? [])
      setCategorias(categoriasRes.data ?? [])
      setEtiquetasDisponibles(etiquetasRes.data ?? [])
    } catch {
      // el panel de planeación mostrará el aviso de requisitos faltantes si aplica
    }
  }, [])

  useEffect(() => {
    cargarMovimientos()
  }, [cargarMovimientos])

  useEffect(() => {
    cargarCatalogos()
  }, [cargarCatalogos])

  const movimientosPorDia = useMemo(() => {
    const mapa = {}
    for (const m of movimientos) {
      const clave = m.fecha.slice(0, 10)
      if (!mapa[clave]) mapa[clave] = []
      mapa[clave].push(m)
    }
    return mapa
  }, [movimientos])

  const movimientosDelDia = fechaSeleccionada ? movimientosPorDia[aFechaLocal(fechaSeleccionada)] || [] : []

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null
    const dia = movimientosPorDia[aFechaLocal(date)]
    if (!dia) return null

    const tieneIngreso = dia.some((m) => m.tipo === 'INGRESO' && m.estado === 'REAL')
    const tieneGasto = dia.some((m) => m.tipo === 'GASTO' && m.estado === 'REAL')
    const tienePlaneado = dia.some((m) => m.estado === 'PLANEADO')

    return (
      <div className="mt-1 flex justify-center gap-0.5">
        {tieneIngreso && <span className="h-1.5 w-1.5 rounded-full bg-[var(--ep-teal)]" />}
        {tieneGasto && <span className="h-1.5 w-1.5 rounded-full bg-[var(--ep-mid)]" />}
        {tienePlaneado && <span className="h-1.5 w-1.5 rounded-full border border-dashed border-[var(--ep-text-sec)]" />}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="p-4">
          <Calendar
            className="ep-calendar"
            locale="es-CO"
            tileContent={tileContent}
            onClickDay={(date) => setFechaSeleccionada(date)}
            onActiveStartDateChange={({ activeStartDate }) => {
              setMesActivo(activeStartDate.getMonth() + 1)
              setAnioActivo(activeStartDate.getFullYear())
            }}
          />
        </Card>

        <Card className="min-w-[280px] flex-1 p-4">
          {!fechaSeleccionada ? (
            <p className="text-sm text-[var(--ep-text-sec)]">Selecciona un día para ver sus movimientos.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--ep-text)]">
                  {fechaSeleccionada.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <Button variant="secondary" size="sm" onClick={() => setModalPlanear(true)}>
                  <Plus size={14} />
                  Planear gasto
                </Button>
              </div>

              {!cargando && movimientosDelDia.length === 0 && (
                <p className="text-sm text-[var(--ep-text-sec)]">Sin movimientos ese día.</p>
              )}

              {movimientosDelDia.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                    m.estado === 'PLANEADO' ? 'border-dashed' : 'border-solid'
                  } border-[var(--ep-border)]`}
                >
                  <div className="flex items-center gap-2">
                    {m.tipo === 'INGRESO' ? (
                      <ArrowUpRight size={16} className="text-[var(--ep-teal)]" />
                    ) : (
                      <ArrowDownRight size={16} className="text-[var(--ep-mid)]" />
                    )}
                    <div>
                      <p className="text-sm text-[var(--ep-text)]">{m.descripcion || m.categoria_nombre}</p>
                      <p className="text-xs text-[var(--ep-text-sec)]">{m.categoria_nombre}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium text-[var(--ep-text)]">{formatCOP(m.monto)}</span>
                    <Badge variant={m.estado === 'REAL' ? 'success' : 'warning'}>
                      {m.estado === 'REAL' ? 'Real' : 'Planeado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ModalMovimiento
        open={modalPlanear}
        onClose={() => setModalPlanear(false)}
        tipo="GASTO"
        movimiento={null}
        bolsillos={bolsillos}
        categorias={categorias}
        etiquetasDisponibles={etiquetasDisponibles}
        fechaInicial={fechaSeleccionada ? aFechaLocal(fechaSeleccionada) : undefined}
        estadoInicial="PLANEADO"
        onGuardado={() => {
          cargarMovimientos()
          window.dispatchEvent(new CustomEvent('ep:movimiento-creado'))
        }}
      />
    </div>
  )
}
