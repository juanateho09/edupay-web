import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Calendar,
  PieChart,
  Target,
  Receipt,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  User,
  LogOut,
} from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/bolsillos', label: 'Bolsillos', icon: Wallet },
  { to: '/calendario', label: 'Calendario', icon: Calendar },
  { separator: 'Planificación' },
  { to: '/presupuestos', label: 'Presupuestos', icon: PieChart },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/deudas', label: 'Deudas', icon: Receipt },
  { separator: 'Análisis' },
  { to: '/reportes', label: 'Reportes', icon: BarChart2 },
]

export default function Sidebar() {
  const [colapsado, setColapsado] = useState(false)
  const { tema, toggleTema } = useThemeStore()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const cerrarSesion = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className="flex h-full flex-col bg-[var(--ep-sidebar)] text-white transition-[width] duration-250 ease-in-out"
      style={{ width: colapsado ? 56 : 210, transitionDuration: '250ms' }}
    >
      <div className="flex items-center justify-between px-3 py-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <img src="/logo.png" alt="EP" className="h-7 w-7 shrink-0 rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
          {!colapsado && <span className="whitespace-nowrap text-lg font-semibold">Edupay</span>}
        </div>
      </div>

      <button
        onClick={() => setColapsado((c) => !c)}
        className="mx-3 mb-2 flex items-center justify-center rounded-lg border border-white/10 py-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
      >
        {colapsado ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="flex-1 overflow-y-auto px-2">
        {NAV_ITEMS.map((item, idx) =>
          item.separator ? (
            !colapsado ? (
              <div key={idx} className="mt-4 mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                {item.separator}
              </div>
            ) : (
              <div key={idx} className="my-3 border-t border-white/10" />
            )
          ) : (
            <div key={item.to} className="group relative">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition
                  ${isActive ? 'bg-[var(--ep-teal)] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
                }
              >
                <item.icon size={18} className="shrink-0" />
                {!colapsado && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>
              {colapsado && (
                <span className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 -translate-y-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </div>
          )
        )}
      </nav>

      <div className="border-t border-white/10 px-2 py-3">
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition
            ${isActive ? 'bg-[var(--ep-teal)] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
          }
        >
          <User size={18} className="shrink-0" />
          {!colapsado && <span className="whitespace-nowrap">Perfil</span>}
        </NavLink>

        <button
          onClick={toggleTema}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          {tema === 'light' ? <Moon size={18} className="shrink-0" /> : <Sun size={18} className="shrink-0" />}
          {!colapsado && <span className="whitespace-nowrap">Modo {tema === 'light' ? 'oscuro' : 'claro'}</span>}
        </button>

        <button
          onClick={cerrarSesion}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-red-400"
        >
          <LogOut size={18} className="shrink-0" />
          {!colapsado && <span className="whitespace-nowrap">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
