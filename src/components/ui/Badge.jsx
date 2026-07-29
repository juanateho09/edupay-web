const VARIANTES = {
  success: 'bg-[var(--ep-teal)]/15 text-[var(--ep-teal)]',
  warning: 'bg-yellow-500/15 text-yellow-600',
  danger: 'bg-[var(--ep-danger)]/15 text-[var(--ep-danger)]',
  neutral: 'bg-[var(--ep-mid)]/15 text-[var(--ep-mid)]',
}

export default function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${VARIANTES[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
