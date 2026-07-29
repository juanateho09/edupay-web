import { useEffect } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

const ESTILOS = {
  success: 'bg-[var(--ep-teal)]/10 border-[var(--ep-teal)] text-[var(--ep-teal)]',
  error: 'bg-[var(--ep-danger)]/10 border-[var(--ep-danger)] text-[var(--ep-danger)]',
}

export default function Alert({ type = 'error', message, onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => onClose?.(), 4000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const Icono = type === 'success' ? CheckCircle2 : XCircle

  return (
    <div
      role="alert"
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${ESTILOS[type]}`}
    >
      <Icono size={18} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Cerrar" className="shrink-0 opacity-70 hover:opacity-100">
          <X size={16} />
        </button>
      )}
    </div>
  )
}
