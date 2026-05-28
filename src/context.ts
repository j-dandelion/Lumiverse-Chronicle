import { createContext } from 'preact'
import { useContext } from 'preact/hooks'
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'

/**
 * ChronicleContext — provides the Spindle frontend context to all Chronicle components.
 * Replaces the old pattern of reaching into globalThis.__chronicleCtx.
 */
export const ChronicleContext = createContext<SpindleFrontendContext | null>(null)

/**
 * Hook to access the Chronicle Spindle context.
 * Components should use this instead of checking globalThis directly.
 * Returns null if the component is rendered outside a ChronicleContext.Provider.
 */
export function useChronicleCtx(): SpindleFrontendContext | null {
  return useContext(ChronicleContext)
}
