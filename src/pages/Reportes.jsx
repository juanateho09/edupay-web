import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
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

const TIPOS_REPORTE = [
  { value: 'balance', label: 'Balance general' },
  { value: 'categorias', label: 'Por categoría' },
  { value: 'mensual', label: 'Mensual completo' },
]

// estado viene de reportes.service.js -> balance: 'SUPERAVIT' | 'DEFICIT' | 'EQUILIBRIO'
// (balance_real > 0 / < 0 / === 0).
const ESTADO_BALANCE_INFO = {
  SUPERAVIT: { label: 'Superávit', badge: 'success' },
  DEFICIT: { label: 'Déficit', badge: 'danger' },
  EQUILIBRIO: { label: 'Equilibrio', badge: 'neutral' },
}

function BarraHorizontal({ label, monto, porcentaje, colorClass = 'bg-[var(--ep-teal)]' }) {
  const ancho = Math.min(Math.max(porcentaje, 0), 100)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-[var(--ep-text)]">{label}</span>
        <span className="text-[var(--ep-text-sec)]">{formatCOP(monto)} · {porcentaje}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ep-border)]">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${ancho}%`, minWidth: '4px' }} />
      </div>
    </div>
  )
}

function BalanceCards({ data }) {
  const info = ESTADO_BALANCE_INFO[data.estado] || ESTADO_BALANCE_INFO.EQUILIBRIO

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--ep-text)]">
          Balance de {MESES[data.mes - 1]} {data.anio}
        </h3>
        <Badge variant={info.badge}>{info.label}</Badge>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card colorStrip="var(--ep-teal)" className="p-4">
          <p className="text-sm text-[var(--ep-text-sec)]">Ingresos reales</p>
          <p className="mt-1 text-xl font-semibold text-[var(--ep-teal)]">{formatCOP(data.ingresos_reales)}</p>
        </Card>
        <Card colorStrip="var(--ep-mid)" className="p-4">
          <p className="text-sm text-[var(--ep-text-sec)]">Gastos reales</p>
          <p className="mt-1 text-xl font-semibold text-[var(--ep-text)]">{formatCOP(data.gastos_reales)}</p>
        </Card>
        <Card colorStrip={data.balance_real >= 0 ? 'var(--ep-teal)' : 'var(--ep-danger)'} className="p-4">
          <p className="text-sm text-[var(--ep-text-sec)]">Balance real</p>
          <p className={`mt-1 text-xl font-semibold ${data.balance_real >= 0 ? 'text-[var(--ep-teal)]' : 'text-[var(--ep-danger)]'}`}>
            {formatCOP(data.balance_real)}
          </p>
          <p className="mt-1 text-xs text-[var(--ep-text-sec)]">Proyectado: {formatCOP(data.balance_proyectado)}</p>
        </Card>
      </div>
    </div>
  )
}

function CategoriasBarras({ data }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--ep-text)]">Ingresos por categoría</h3>
        <div className="flex flex-col gap-3">
          {data.ingresos.length === 0 && (
            <p className="text-sm text-[var(--ep-text-sec)]">Sin ingresos registrados en el período.</p>
          )}
          {data.ingresos.map((c) => (
            <BarraHorizontal
              key={c.categoria_id}
              label={c.nombre}
              monto={c.total}
              porcentaje={c.porcentaje_del_total}
              colorClass="bg-[var(--ep-teal)]"
            />
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--ep-text)]">Gastos por categoría</h3>
        <div className="flex flex-col gap-3">
          {data.gastos.length === 0 && (
            <p className="text-sm text-[var(--ep-text-sec)]">Sin gastos registrados en el período.</p>
          )}
          {data.gastos.map((c) => (
            <BarraHorizontal
              key={c.categoria_id}
              label={c.nombre}
              monto={c.total}
              porcentaje={c.porcentaje_del_total}
              colorClass="bg-[var(--ep-mid)]"
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

function VariacionStat({ label, valorActual, valorAnterior, variacionPct }) {
  const subio = variacionPct !== null && variacionPct > 0
  const bajo = variacionPct !== null && variacionPct < 0

  return (
    <Card className="p-4">
      <p className="text-sm text-[var(--ep-text-sec)]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[var(--ep-text)]">{formatCOP(valorActual)}</p>
      <div className="mt-1 flex items-center gap-1 text-xs">
        {subio && <ArrowUpRight size={14} className="text-[var(--ep-teal)]" />}
        {bajo && <ArrowDownRight size={14} className="text-[var(--ep-danger)]" />}
        <span className="text-[var(--ep-text-sec)]">
          {variacionPct === null ? 'Sin datos del mes anterior' : `${variacionPct}% vs ${formatCOP(valorAnterior)} el mes anterior`}
        </span>
      </div>
    </Card>
  )
}

function MensualDetalle({ data }) {
  return (
    <div className="flex flex-col gap-4">
      <BalanceCards data={data.balance} />
      <CategoriasBarras data={data.por_categoria} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VariacionStat
          label="Ingresos vs. mes anterior"
          valorActual={data.balance.ingresos_reales}
          valorAnterior={data.comparacion_mes_anterior.ingresos_mes_anterior}
          variacionPct={data.comparacion_mes_anterior.variacion_ingresos_pct}
        />
        <VariacionStat
          label="Gastos vs. mes anterior"
          valorActual={data.balance.gastos_reales}
          valorAnterior={data.comparacion_mes_anterior.gastos_mes_anterior}
          variacionPct={data.comparacion_mes_anterior.variacion_gastos_pct}
        />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--ep-text)]">Top 5 gastos del mes</h3>
        {data.top_gastos.length === 0 && (
          <p className="text-sm text-[var(--ep-text-sec)]">No hay gastos reales registrados en el período.</p>
        )}
        <div className="flex flex-col gap-2">
          {data.top_gastos.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-lg border border-[var(--ep-border)] px-3 py-2"
            >
              <div>
                <p className="text-sm text-[var(--ep-text)]">{g.descripcion || g.categoria_nombre}</p>
                <p className="text-xs text-[var(--ep-text-sec)]">
                  {g.categoria_nombre} · {g.bolsillo_nombre} · {new Date(`${String(g.fecha).slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO')}
                </p>
              </div>
              <span className="text-sm font-semibold text-[var(--ep-text)]">{formatCOP(g.monto)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function Reportes() {
  const { mes: mesActual, anio: anioActual } = useMesStore()

  const [bolsillosReporte, setBolsillosReporte] = useState([])
  const [cargandoBolsillos, setCargandoBolsillos] = useState(true)
  const [errorBolsillos, setErrorBolsillos] = useState('')

  const [tipoReporte, setTipoReporte] = useState('balance')
  const [mes, setMes] = useState(mesActual)
  const [anio, setAnio] = useState(anioActual)

  const [resultado, setResultado] = useState(null)
  const [cargandoResultado, setCargandoResultado] = useState(false)
  const [errorResultado, setErrorResultado] = useState('')

  const cargarBolsillosReporte = useCallback(async () => {
    setCargandoBolsillos(true)
    setErrorBolsillos('')
    try {
      const { data } = await api.get('/reportes/bolsillos')
      setBolsillosReporte(data ?? [])
    } catch (err) {
      setErrorBolsillos(err.response?.data?.error || 'No se pudo cargar la distribución de bolsillos')
    } finally {
      setCargandoBolsillos(false)
    }
  }, [])

  useEffect(() => {
    cargarBolsillosReporte()
  }, [cargarBolsillosReporte])

  const generar = async () => {
    setCargandoResultado(true)
    setErrorResultado('')
    try {
      const { data } = await api.get(`/reportes/${tipoReporte}`, { params: { mes, anio } })
      setResultado({ tipo: tipoReporte, data })
    } catch (err) {
      setErrorResultado(err.response?.data?.error || 'No se pudo generar el reporte')
    } finally {
      setCargandoResultado(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ep-text)]">
          <TrendingUp size={16} />
          Distribución de bolsillos
        </h3>
        {errorBolsillos && <Alert type="error" message={errorBolsillos} onClose={() => setErrorBolsillos('')} />}
        {!cargandoBolsillos && bolsillosReporte.length === 0 && !errorBolsillos && (
          <p className="text-sm text-[var(--ep-text-sec)]">No tienes bolsillos creados todavía.</p>
        )}
        <div className="flex flex-col gap-3">
          {bolsillosReporte.map((b) => (
            <BarraHorizontal key={b.id} label={b.nombre} monto={b.saldo} porcentaje={b.porcentaje_del_total} />
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--ep-text)]">Generar reporte</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--ep-text)]">Tipo de reporte</label>
            <select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)} className={SELECT_CLASS}>
              {TIPOS_REPORTE.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--ep-text)]">Mes</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className={SELECT_CLASS}>
              {MESES.map((nombre, idx) => (
                <option key={idx} value={idx + 1}>{nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--ep-text)]">Año</label>
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className={SELECT_CLASS}>
              {Array.from({ length: 5 }, (_, i) => anioActual - 2 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" size="md" loading={cargandoResultado} onClick={generar}>
            Generar
          </Button>
        </div>
      </Card>

      {errorResultado && <Alert type="error" message={errorResultado} onClose={() => setErrorResultado('')} />}

      {!errorResultado && !cargandoResultado && !resultado && (
        <Card className="p-6 text-center text-sm text-[var(--ep-text-sec)]">
          Selecciona un tipo de reporte, período y presiona "Generar" para ver los resultados.
        </Card>
      )}

      {resultado && resultado.tipo === 'balance' && <BalanceCards data={resultado.data} />}
      {resultado && resultado.tipo === 'categorias' && <CategoriasBarras data={resultado.data} />}
      {resultado && resultado.tipo === 'mensual' && <MensualDetalle data={resultado.data} />}
    </div>
  )
}
