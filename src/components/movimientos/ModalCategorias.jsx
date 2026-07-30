import { useMemo, useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Alert from '../ui/Alert'
import api from '../../api/axios'

const SELECT_CLASS =
  'rounded-lg border border-[var(--ep-border)] bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)] outline-none focus:border-[var(--ep-teal)]'

function Lista({ titulo, categorias, onEliminar, confirmandoId, onConfirmarEliminar, onCancelarEliminar }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-[var(--ep-text-sec)]">{titulo}</h3>
      {categorias.length === 0 && (
        <p className="text-sm text-[var(--ep-text-sec)]">No hay categorías de este tipo.</p>
      )}
      <ul className="flex flex-col gap-1">
        {categorias.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-[var(--ep-border)] px-3 py-2 text-sm text-[var(--ep-text)]"
          >
            <span>{c.nombre}</span>
            {confirmandoId === c.id ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--ep-text-sec)]">¿Eliminar?</span>
                <button onClick={() => onEliminar(c.id)} className="font-medium text-[var(--ep-danger)]">Sí</button>
                <button onClick={onCancelarEliminar} className="font-medium text-[var(--ep-text-sec)]">No</button>
              </div>
            ) : (
              <button
                onClick={() => onConfirmarEliminar(c.id)}
                className="rounded p-1 text-[var(--ep-danger)] hover:bg-[var(--ep-danger)]/10"
                aria-label={`Eliminar ${c.nombre}`}
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ModalCategorias({ open, onClose, categorias, onActualizado }) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('GASTO')
  const [creando, setCreando] = useState(false)
  const [confirmandoId, setConfirmandoId] = useState(null)
  const [error, setError] = useState('')

  const ingresos = useMemo(() => categorias.filter((c) => c.tipo === 'INGRESO'), [categorias])
  const gastos = useMemo(() => categorias.filter((c) => c.tipo === 'GASTO'), [categorias])

  const crear = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setCreando(true)
    setError('')
    try {
      await api.post('/categorias', { nombre: nombre.trim(), tipo })
      setNombre('')
      onActualizado()
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la categoría')
    } finally {
      setCreando(false)
    }
  }

  const eliminar = async (id) => {
    setError('')
    try {
      await api.delete(`/categorias/${id}`)
      setConfirmandoId(null)
      onActualizado()
    } catch (err) {
      setConfirmandoId(null)
      setError(err.response?.data?.error || 'No se pudo eliminar la categoría')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Gestionar categorías">
      <div className="flex flex-col gap-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Lista
            titulo="Ingresos"
            categorias={ingresos}
            confirmandoId={confirmandoId}
            onConfirmarEliminar={setConfirmandoId}
            onCancelarEliminar={() => setConfirmandoId(null)}
            onEliminar={eliminar}
          />
          <Lista
            titulo="Gastos"
            categorias={gastos}
            confirmandoId={confirmandoId}
            onConfirmarEliminar={setConfirmandoId}
            onCancelarEliminar={() => setConfirmandoId(null)}
            onEliminar={eliminar}
          />
        </div>

        <form className="flex flex-col gap-3 border-t border-[var(--ep-border)] pt-4" onSubmit={crear}>
          <h3 className="text-sm font-semibold text-[var(--ep-text-sec)]">Nueva categoría</h3>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="min-w-[180px] flex-1"
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--ep-text)]">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={SELECT_CLASS}>
                <option value="INGRESO">Ingreso</option>
                <option value="GASTO">Gasto</option>
              </select>
            </div>
            <Button type="submit" variant="primary" loading={creando} disabled={!nombre.trim()}>
              <Plus size={16} />
              Agregar
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
