/**
 * ConnectionManager — Connection profile selector.
 * Fetches available profiles from backend, persists the selection in localStorage.
 */

import { useState, useEffect, useRef } from 'preact/hooks'
import type { FunctionComponent } from 'preact'
import { useChronicleCtx } from '../context'
import {
  loadSelectedConnectionId,
  saveSelectedConnectionId,
  DEFAULT_CONNECTION_ID,
  type ConnectionProfile,
} from '../connections'

interface Props {
  onConnectionChange?: (connectionId: string | undefined) => void
  loading?: boolean
  onOpenConnectionsDrawer?: () => void
}

export const ConnectionManager: FunctionComponent<Props> = ({
  onConnectionChange,
  loading = false,
  onOpenConnectionsDrawer,
}) => {
  const [connections, setConnections] = useState<ConnectionProfile[]>([])
  const [selectedId, setSelectedId] = useState<string>(loadSelectedConnectionId)
  const [fetching, setFetching] = useState(true)
  const [hintDismissed, setHintDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem('chronicle_connHintDismissed') === 'true' } catch { return false }
  })
  const receivedRef = useRef(false)
  const ctx = useChronicleCtx()

  // Request connection list from backend on mount
  useEffect(() => {
    if (ctx) {
      try {
        ctx.sendToBackend({ type: 'list_connections' })
      } catch {
        console.warn('[Chronicle] Failed to request connection list')
      }
    }
    // Timeout fallback — if backend never responds, stop showing loading
    const timer = setTimeout(() => setFetching(false), 15_000)
    return () => clearTimeout(timer)
  }, [ctx])

  // Listen for connection list response
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail as Record<string, unknown> | null
      if (!msg) return
      if (msg.type === 'connections_list' && Array.isArray(msg.connections)) {
        if (receivedRef.current) return  // ignore stale responses
        receivedRef.current = true
        const conns = msg.connections as ConnectionProfile[]
        setConnections(conns)
        // Validate saved selection — if saved ID was deleted, fall back to Default
        setSelectedId((current) => {
          if (current !== DEFAULT_CONNECTION_ID && !conns.some((c) => c.id === current)) {
            saveSelectedConnectionId(DEFAULT_CONNECTION_ID)
            return DEFAULT_CONNECTION_ID
          }
          return current
        })
        setFetching(false)
      }
    }
    window.addEventListener('chronicle:backend-message', handler)
    return () => window.removeEventListener('chronicle:backend-message', handler)
  }, [])

  // Report selected connection up to parent
  // Only report after list is loaded — prevents stale localStorage IDs from reaching
  // the backend before the fetched response validates them.
  const effectiveConnectionId = selectedId === DEFAULT_CONNECTION_ID ? undefined : selectedId

  useEffect(() => {
    if (fetching) return
    onConnectionChange?.(effectiveConnectionId)
  }, [effectiveConnectionId, onConnectionChange, fetching])

  const handleChange = (e: Event) => {
    const id = (e.target as HTMLSelectElement).value
    setSelectedId(id)
    saveSelectedConnectionId(id)
  }

  const dismissHint = () => {
    setHintDismissed(true)
    try { localStorage.setItem('chronicle_connHintDismissed', 'true') } catch {}
  }

  const isDisabled = loading || fetching

  return (
    <div data-chronicle="connection-manager">
      <div class="chronicle-conn-row">
        <label class="chronicle-conn-label">Connection Profile</label>
        <select
          class="chronicle-conn-select"
          value={selectedId}
          onChange={handleChange}
          disabled={isDisabled}
        >
          <option value={DEFAULT_CONNECTION_ID}>
            {fetching ? 'Loading…' : 'Default'}
          </option>
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.provider})
            </option>
          ))}
        </select>
      </div>
      {!hintDismissed && (
      <div class="chronicle-conn-hint">
        <span class="chronicle-conn-hint-icon">ⓘ</span>
        <span class="chronicle-conn-hint-text">
          To use a different model, please set up a new{' '}
          <button
            class="chronicle-conn-link"
            onClick={() => onOpenConnectionsDrawer?.()}
          >
            connection profile
          </button>{' '}
          to use for summaries.
          <br />
          (Tip: Duplicate your current one to avoid re-entering API key)
        </span>
        <button class="chronicle-conn-hint-close" onClick={dismissHint} title="Dismiss">✕</button>
      </div>
      )}
    </div>
  )
}
