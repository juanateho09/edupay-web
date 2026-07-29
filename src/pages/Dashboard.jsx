import { useEffect, useState, useCallback } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Alert from '../components/ui/Alert'
import api from '../api/axios'
import { useMesStore } from '../store/mesStore'
import { formatCOP } from '../utils/formatCOP'

const NOMBRES_MES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function mesesAnteriores(mes, anio, cantidad) {
  const resultado = []
  for (let i = cantidad - 1; i >= 0; i--) {
    let m = mes - i
    let a = anio
    while (m <= 0) {
      m += 12
      a -= 1
    }
    resultado.push({ mes: m, anio: a })
  }
  return resultado
}

export default function Dashboard() {
  const { mes, anio } = useMesStore()

  const [balance, setBalance] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [bolsillos, setBolsillos] = useState([])
  const [deudasActivas, setDeudasActivas] = useState(0)
  const [datosGrafica, setDatosGrafica] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [balanceRes, movimientosRes, bolsillosRes, deudasRes] = await Promise.all([
        api.get('/reportes/balance', { params: { mes, anio } }),
        api.get('/movimientos', { params: { limit: 5 } }),
        api.get('/bolsillos'),
        api.get('/deudas', { params: { estado: 'pendiente' } }),
      ])

      setBalance(balanceRes.data)
      setMovimientos(movimientosRes.data?.data ?? movimientosRes.data ?? [])
      setBolsillos(bolsillosRes.data?.data ?? bolsillosRes.data ?? [])

      const listaDeudas = deudasRes.data?.data ?? deudasRes.data ?? []
      setDeudasActivas(listaDeudas.reduce((total, d) => total + Number(d.monto ?? 0), 0))

      const meses = mesesAnteriores(mes, anio, 6)
      const historicos = await Promise.all(
        meses.map(({ mes: m, anio: a }) => api.get('/reportes/balance', { params: { mes: m, anio: a } }))
      )
      setDatosGrafica(
        meses.map(({ mes: m }, idx) => ({
          nombre: NOMBRES_MES_CORTO[m - 1],
          ingresos: Number(historicos[idx].data?.ingresos_reales ?? 0),
          gastos: Number(historicos[idx].data?.gastos_reales ?? 0),
        }))
      )
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron cargar los datos del dashboard')
    } finally {
      setCargando(false)
    }
  }, [mes, anio])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  useEffect(() => {
    window.addEventListener('ep:movimiento-creado', cargarDatos)
    return () => window.removeEventListener('ep:movimiento-creado', cargarDatos)
  }, [cargarDatos])

  const balanceReal = Number(balance?.balance_real ?? 0)
  const balanceProyectado = Number(balance?.balance_proyectado ?? 0)
  const esSuperavit = balanceReal >= 0

  const kpis = [
    { label: 'Ingresos del mes', valor: balance?.ingresos_reales, color: 'var(--ep-teal)' },
    { label: 'Gastos reales', valor: balance?.gastos_reales, color: 'var(--ep-mid)' },
    { label: 'Gastos planeados', valor: balance?.total_planeado, color: 'var(--ep-light)' },
    { label: 'Deudas activas', valor: deudasActivas, color: 'var(--ep-danger)' },
  ]

  if (cargando && !balance) {
    return <p className="text-sm text-[var(--ep-text-sec)]">Cargando dashboard...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="rounded-[10px] bg-[var(--ep-sidebar)] p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/60">Balance real</p>
            <p className="text-3xl font-bold">{formatCOP(balanceReal)}</p>
            <p className="mt-1 text-sm text-white/50">Proyectado: {formatCOP(balanceProyectado)}</p>
          </div>
          <Badge variant={esSuperavit ? 'success' : 'danger'}>
            {esSuperavit ? 'Superávit' : 'Déficit'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} colorStrip={kpi.color} className="p-4">
            <p className="text-sm text-[var(--ep-text-sec)]">{kpi.label}</p>
            <p className="mt-1 text-xl font-semibold text-[var(--ep-text)]">{formatCOP(kpi.valor)}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--ep-text)]">Últimas transacciones</h3>
          <div className="flex flex-col gap-2">
            {movimientos.length === 0 && (
              <p className="text-sm text-[var(--ep-text-sec)]">Sin movimientos recientes</p>
            )}
            {movimientos.map((m) => (
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
                  <span className="text-sm text-[var(--ep-text)]">{m.descripcion || 'Sin descripción'}</span>
                </div>
                <span className="text-sm font-medium text-[var(--ep-text)]">{formatCOP(m.monto)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--ep-text)]">Bolsillos</h3>
          <div className="flex flex-col gap-3">
            {bolsillos.length === 0 && (
              <p className="text-sm text-[var(--ep-text-sec)]">No tienes bolsillos creados</p>
            )}
            {(() => {
              const totalSaldo = bolsillos.reduce((total, b) => total + Number(b.saldo ?? 0), 0)
              return bolsillos.map((b) => {
                const porcentaje = totalSaldo ? Math.round((Number(b.saldo) / totalSaldo) * 100) : 0
                return (
                  <div key={b.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-[var(--ep-text)]">{b.nombre}</span>
                      <span className="text-[var(--ep-text-sec)]">{porcentaje}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ep-border)]">
                      <div
                        className="h-full rounded-full bg-[var(--ep-teal)] transition-all"
                        style={{ width: `${porcentaje}%`, minWidth: '4px' }}
                      />
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--ep-text)]">Ingresos vs gastos (últimos 6 meses)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={datosGrafica}>
            <XAxis dataKey="nombre" stroke="var(--ep-text-sec)" fontSize={12} />
            <YAxis stroke="var(--ep-text-sec)" fontSize={12} />
            <Tooltip formatter={(value) => formatCOP(value)} />
            <Legend />
            <Bar dataKey="ingresos" name="Ingresos" fill="#027368" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastos" name="Gastos" fill="#5F7173" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
