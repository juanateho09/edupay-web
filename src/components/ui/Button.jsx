import { Loader2 } from 'lucide-react'

const VARIANTES = {
  primary: 'bg-[var(--ep-teal)] text-white hover:brightness-110 disabled:brightness-90',
  secondary: 'bg-[var(--ep-mid)] text-white hover:brightness-110 disabled:brightness-90',
  danger: 'bg-[var(--ep-danger)] text-white hover:brightness-110 disabled:brightness-90',
  ghost: 'bg-transparent text-[var(--ep-text)] border border-[var(--ep-border)] hover:bg-[var(--ep-border)]/20',
}

const TAMANOS = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-5 py-2.5 gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition
        disabled:cursor-not-allowed disabled:opacity-60
        ${VARIANTES[variant]} ${TAMANOS[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
