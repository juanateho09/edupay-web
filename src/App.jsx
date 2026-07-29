import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Movimientos from './pages/Movimientos'
import Bolsillos from './pages/Bolsillos'
import Calendario from './pages/Calendario'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

function PlaceholderPage({ nombre }) {
  return <p className="text-sm text-[var(--ep-text-sec)]">Página de {nombre} próximamente.</p>
}

export default function App() {
  const cargarUsuario = useAuthStore((s) => s.cargarUsuario)
  const token = useAuthStore((s) => s.token)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    if (token) {
      cargarUsuario().finally(() => setListo(true))
    } else {
      setListo(true)
    }
  }, [])

  if (!listo) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/bolsillos" element={<Bolsillos />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/presupuestos" element={<PlaceholderPage nombre="Presupuestos" />} />
          <Route path="/metas" element={<PlaceholderPage nombre="Metas" />} />
          <Route path="/deudas" element={<PlaceholderPage nombre="Deudas" />} />
          <Route path="/reportes" element={<PlaceholderPage nombre="Reportes" />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
