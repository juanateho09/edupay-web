import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownRight, Pencil, Trash2, Check, X, Download, Plus, Tags } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import ModalMovimiento from '../components/movimientos/ModalMovimiento'
import ModalCategorias from '../components/movimientos/ModalCategorias'
import api from '../api/axios'
import { useMesStore } from '../store/mesStore'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { formatCOP } from '../utils/formatCOP'

const SELECT_CLASS =
  'rounded-lg border border-[var(--ep-border)] bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)] outline-none focus:border-[var(--ep-teal)]'

function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Movimientos() {
  const { mes, anio } = useMesStore()

  const [movimientos, setMovimientos] = useState([])
  const [bolsillos, setBolsillos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exportando, setExportando] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)

  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const busquedaDebounced = useDebouncedValue(busqueda, 400)

  const [modal, setModal] = useState(null)
  const [modalCategorias, setModalCategorias] = useState(false)

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
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los catálogos')
    }
  }, [])

  const cargarMovimientos = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      if (busquedaDebounced.trim()) {
        const { data } = await api.get('/movimientos/buscar', { params: { q: busquedaDebounced.trim() } })
        setMovimientos(data ?? [])
        return
      }

      const params = { mes, anio }
      if (filtroTipo !== 'TODOS') params.tipo = filtroTipo
      if (filtroEstado !== 'TODOS') params.estado = filtroEstado
      if (filtroCategoria !== 'TODOS') params.categoria_id = filtroCategoria
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta

      const { data } = await api.get('/movimientos', { params })
      setMovimientos(data ?? [])
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los movimientos')
    } finally {
      setCargando(false)
    }
  }, [mes, anio, filtroTipo, filtroEstado, filtroCategoria, fechaDesde, fechaHasta, busquedaDebounced])

  useEffect(() => {
    cargarCatalogos()
  }, [cargarCatalogos])

  useEffect(() => {
    cargarMovimientos()
  }, [cargarMovimientos])

  const confirmar = async (id) => {
    try {
      await api.patch(`/movimientos/${id}/confirmar`)
      cargarMovimientos()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo confirmar el movimiento')
    }
  }

  const cancelar = async (id) => {
    try {
      await api.delete(`/movimientos/${id}/cancelar`)
      cargarMovimientos()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cancelar el movimiento')
    }
  }

  const eliminar = async (id) => {
    try {
      await api.delete(`/movimientos/${id}`)
      setConfirmandoEliminar(null)
      cargarMovimientos()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar el movimiento')
    }
  }

  const exportar = async () => {
    setExportando(true)
    setError('')
    try {
      const response = await api.get('/movimientos/exportar', {
        params: { mes, anio },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `edupay-${anio}-${String(mes).padStart(2, '0')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('No se pudo exportar el archivo')
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setModal({ tipo: 'INGRESO' })}>
            <Plus size={16} />
            Nuevo ingreso
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setModal({ tipo: 'GASTO' })}>
            <Plus size={16} />
            Nuevo gasto
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setModalCategorias(true)}>
            <Tags size={16} />
            Gestionar categorías
          </Button>
        </div>
        <Button variant="ghost" size="sm" loading={exportando} onClick={exportar}>
          <Download size={16} />
          Exportar Excel
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Buscar"
            type="text"
            placeholder="Descripción, categoría o etiqueta"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="min-w-[220px]"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--ep-text)]">Tipo</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={SELECT_CLASS}>
              <option value="TODOS">Todos</option>
              <option value="INGRESO">Ingreso</option>
              <option value="GASTO">Gasto</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--ep-text)]">Estado</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={SELECT_CLASS}>
              <option value="TODOS">Todos</option>
              <option value="REAL">Real</option>
              <option value="PLANEADO">Planeado</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--ep-text)]">Categoría</label>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className={SELECT_CLASS}>
              <option value="TODOS">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <Input label="Desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          <Input label="Hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-[var(--ep-border)] text-left text-[var(--ep-text-sec)]">
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Descripción</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Etiquetas</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!cargando && movimientos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-[var(--ep-text-sec)]">
                  No hay movimientos para los filtros seleccionados
                </td>
              </tr>
            )}
            {movimientos.map((m) => (
              <tr
                key={m.id}
                className={`border-b border-[var(--ep-border)] text-[var(--ep-text)] last:border-0 ${
                  m.estado === 'PLANEADO' ? 'border-dashed' : ''
                }`}
              >
                <td className="px-4 py-3">
                  {m.tipo === 'INGRESO' ? (
                    <ArrowUpRight size={16} className="text-[var(--ep-teal)]" />
                  ) : (
                    <ArrowDownRight size={16} className="text-[var(--ep-mid)]" />
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatFecha(m.fecha)}</td>
                <td className="px-4 py-3">{m.descripcion || '—'}</td>
                <td className="px-4 py-3">{m.categoria_nombre}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(m.etiquetas || []).map((et) => (
                      <Badge key={et.id} variant="neutral">{et.nombre}</Badge>
                    ))}
                  </div>
                </td>
                <td className={`px-4 py-3 font-medium ${m.tipo === 'INGRESO' ? 'text-[var(--ep-teal)]' : 'text-[var(--ep-text)]'}`}>
                  {formatCOP(m.monto)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={m.estado === 'REAL' ? 'success' : 'warning'}>
                    {m.estado === 'REAL' ? 'Real' : 'Planeado'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {confirmandoEliminar === m.id ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--ep-text-sec)]">¿Eliminar?</span>
                      <button onClick={() => eliminar(m.id)} className="font-medium text-[var(--ep-danger)]">Sí</button>
                      <button onClick={() => setConfirmandoEliminar(null)} className="font-medium text-[var(--ep-text-sec)]">No</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {m.estado === 'PLANEADO' ? (
                        <>
                          <button
                            onClick={() => confirmar(m.id)}
                            className="rounded p-1 text-[var(--ep-teal)] hover:bg-[var(--ep-teal)]/10"
                            aria-label="Confirmar"
                            title="Confirmar"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => cancelar(m.id)}
                            className="rounded p-1 text-[var(--ep-danger)] hover:bg-[var(--ep-danger)]/10"
                            aria-label="Cancelar"
                            title="Cancelar"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setModal({ tipo: m.tipo, movimiento: m })}
                            className="rounded p-1 text-[var(--ep-text-sec)] hover:bg-[var(--ep-border)]/30"
                            aria-label="Editar"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmandoEliminar(m.id)}
                            className="rounded p-1 text-[var(--ep-danger)] hover:bg-[var(--ep-danger)]/10"
                            aria-label="Eliminar"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ModalMovimiento
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        tipo={modal?.tipo}
        movimiento={modal?.movimiento}
        bolsillos={bolsillos}
        categorias={categorias}
        etiquetasDisponibles={etiquetasDisponibles}
        onGuardado={() => {
          cargarMovimientos()
          window.dispatchEvent(new CustomEvent('ep:movimiento-creado'))
        }}
      />

      <ModalCategorias
        open={modalCategorias}
        onClose={() => setModalCategorias(false)}
        categorias={categorias}
        onActualizado={cargarCatalogos}
      />
    </div>
  )
}
