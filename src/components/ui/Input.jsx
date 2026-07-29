export default function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || props.name

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--ep-text)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-lg border bg-[var(--ep-card)] px-3 py-2 text-sm text-[var(--ep-text)]
          border-[var(--ep-border)] outline-none transition
          focus:border-[var(--ep-teal)] focus:ring-1 focus:ring-[var(--ep-teal)]
          ${error ? 'border-[var(--ep-danger)]' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[var(--ep-danger)]">{error}</span>}
    </div>
  )
}
