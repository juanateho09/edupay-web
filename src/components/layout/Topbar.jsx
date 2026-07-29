import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Alert from '../ui/Alert'
import { useMesStore } from '../../store/mesStore'
import api from '../../api/axios'

const TITULOS = {
  '/dashboard': 'Dashboard',
  '/movimientos': 'Movimientos',
  '/bolsillos': 'Bolsillos',
  '/calendario': 'Calendario',
  '/presupuestos': 'Presupuestos',
  '/metas': 'Metas',
  '/deudas': 'Deudas',
  '/reportes': 'Reportes',
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function ModalNuevoMovimiento({ open, onClose, onCreado }) {
  const [tipo, setTipo] = useState('INGRESO')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState('')
  const [bolsilloId, setBolsilloId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [bolsillos, setBolsillos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    Promise.all([api.get('/bolsillos'), api.get('/categorias')])
      .then(([bolsillosRes, categoriasRes]) => {
        setBolsillos(bolsillosRes.data ?? [])
        setCategorias(categoriasRes.data ?? [])
      })
      .catch((err) => setError(err.response?.data?.error || 'No se pudieron cargar bolsillos/categorías'))
  }, [open])

  const cerrar = () => {
    setTipo('INGRESO')
    setMonto('')
    setDescripcion('')
    setBolsilloId('')
    setCategoriaId('')
    setError('')
    onClose()
  }

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await api.post('/movimientos', {
        tipo,
        monto: Number(monto),
        fecha,
        descripcion,
        estado: 'REAL',
        bolsillo_id: bolsilloId,
        categoria_id: categoriaId,
      })
      cerrar()
      onCreado?.()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el movimiento')
    } finally {
      setEnviando(false)
    }
  }

  const faltanRequisitos = bolsillos.length === 0 || categorias.length === 0

  return (
    <Modal
      open={open}
      onClose={cerrar}
      title="Nuevo movimiento"
      footer={
        <>
          <Button variant="ghost" onClick={cerrar}>Cancelar</Button>
          <Button variant="primary" loading={enviando} disabled={faltanRequisitos} onClick={enviar}>
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
            message="Necesitas al menos un bolsillo y una categoría antes de registrar movimientos."
            onClose={() => {}}
          />
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={tipo === 'INGRESO' ? 'primary' : 'ghost'}
            className="flex-1"
            onClick={() => setTipo('INGRESO')}
          >
            Ingreso
          </Button>
          <Button
            type="button"
            variant={tipo === 'GASTO' ? 'secondary' : 'ghost'}
            className="flex-1"
            onClick={() => setTipo('GASTO')}
          >
            Gasto
          </Button>
        </div>
        <Input
          label="Monto"
          type="number"
          min="0"
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
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--ep-text)]">Bolsillo</label>
          <select
            value={bolsilloId}
            onChange={(e) => setBolsilloId(e.target.value)}
            className="rounded-lg border border-[var(--ep-border)] bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)] outline-none focus:border-[var(--ep-teal)]"
            required
          >
            <option value="" disabled>Selecciona un bolsillo</option>
            {bolsillos.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--ep-text)]">Categoría</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="rounded-lg border border-[var(--ep-border)] bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)] outline-none focus:border-[var(--ep-teal)]"
            required
          >
            <option value="" disabled>Selecciona una categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  )
}

export default function Topbar() {
  const location = useLocation()
  const { mes, anio, setMesAnio } = useMesStore()
  const [modalAbierto, setModalAbierto] = useState(false)

  const titulo = TITULOS[location.pathname] || 'Edupay'

  return (
    <header className="flex items-center justify-between border-b border-[var(--ep-border)] bg-[var(--ep-card)] px-6 py-4">
      <h1 className="text-xl font-semibold text-[var(--ep-text)]">{titulo}</h1>

      <div className="flex items-center gap-3">
        <select
          value={mes}
          onChange={(e) => setMesAnio(Number(e.target.value), anio)}
          className="rounded-lg border border-[var(--ep-border)] bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)] outline-none focus:border-[var(--ep-teal)]"
        >
          {MESES.map((nombre, idx) => (
            <option key={idx} value={idx + 1}>{nombre}</option>
          ))}
        </select>
        <select
          value={anio}
          onChange={(e) => setMesAnio(mes, Number(e.target.value))}
          className="rounded-lg border border-[var(--ep-border)] bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)] outline-none focus:border-[var(--ep-teal)]"
        >
          {Array.from({ length: 5 }, (_, i) => anio - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <Button variant="primary" onClick={() => setModalAbierto(true)}>
          <Plus size={16} />
          Nuevo movimiento
        </Button>
      </div>

      <ModalNuevoMovimiento
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCreado={() => window.dispatchEvent(new CustomEvent('ep:movimiento-creado'))}
      />
    </header>
  )
}
