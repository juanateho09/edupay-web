export default function Card({ children, colorStrip, className = '', ...props }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[10px] border bg-[var(--ep-card)] border-[var(--ep-border)] ${className}`}
      {...props}
    >
      {colorStrip && (
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: colorStrip }} />
      )}
      <div className={colorStrip ? 'pt-[3px]' : ''}>{children}</div>
    </div>
  )
}
