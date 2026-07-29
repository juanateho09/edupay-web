import { useEffect, useState } from 'react'

export function useDebouncedValue(value, delayMs) {
  const [valorDebounced, setValorDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setValorDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return valorDebounced
}
