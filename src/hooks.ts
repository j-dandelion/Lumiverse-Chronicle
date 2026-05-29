/**
 * Chronicle — Shared Preact hooks
 */
import { useState, useCallback } from 'preact/hooks'

/**
 * useState backed by localStorage. Reads on init, writes on change.
 * Swallows localStorage errors silently (SSR, private browsing, quota).
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  serialize: (v: T) => string = String,
  deserialize: (s: string) => T = (s) => s as unknown as T
): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) return deserialize(raw)
    } catch { /* ignore */ }
    return defaultValue
  })

  const setPersisted = useCallback((v: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof v === 'function' ? (v as (prev: T) => T)(prev) : v
      try { localStorage.setItem(key, serialize(next)) } catch { /* ignore */ }
      return next
    })
  }, [key, serialize])

  return [state, setPersisted]
}
