/**
 * LorebookManager — Lorebook selection dropdown.
 * Fetches lorebooks from backend, shows linked + auto-generate + all lorebooks.
 */

import { useState, useEffect, useRef } from 'preact/hooks'
import type { FunctionComponent } from 'preact'
import { useChronicleCtx } from '../context'

interface LorebookInfo {
  id: string
  name: string
}

interface Props {
  onLorebookChange?: (lorebookId: string | undefined) => void
  loading?: boolean
}

// Special value sent to backend for auto-generate
export const AUTO_GENERATE_ID = '__auto_generate__'
// Special value meaning "no specific lorebook — use default Chronicle flow"
export const DEFAULT_LOREBOOK_ID = '__default__'

const LOREBOOK_SELECTED_KEY = 'chronicle_selected_lorebook'

export const LorebookManager: FunctionComponent<Props> = ({
  onLorebookChange,
  loading = false,
}) => {
  const [chatLinked, setChatLinked] = useState<LorebookInfo | null>(null)
  const [characterLinked, setCharacterLinked] = useState<LorebookInfo | null>(null)
  const [allLorebooks, setAllLorebooks] = useState<LorebookInfo[]>([])
  const [fetching, setFetching] = useState(true)

  // Restore saved selection from localStorage
  const restoreSelection = (): string => {
    try {
      const saved = localStorage.getItem(LOREBOOK_SELECTED_KEY)
      if (saved) {
        // __default__ is a legacy value — normalize away
        if (saved === DEFAULT_LOREBOOK_ID) {
          localStorage.removeItem(LOREBOOK_SELECTED_KEY)
          return AUTO_GENERATE_ID
        }
        return saved
      }
    } catch { /* ignore */ }
    return AUTO_GENERATE_ID
  }
  const [selectedId, setSelectedId] = useState<string>(restoreSelection)
  const receivedRef = useRef(false)
  const ctx = useChronicleCtx()

  // Request lorebook list from backend on mount
  useEffect(() => {
    if (ctx) {
      try {
        ctx.sendToBackend({ type: 'list_lorebooks' })
      } catch {
        console.warn('[Chronicle] Failed to request lorebook list')
      }
    }
    // Timeout fallback
    const timer = setTimeout(() => setFetching(false), 15_000)
    return () => clearTimeout(timer)
  }, [ctx])

  // Listen for lorebook list response — async validation pattern (anti-pattern #42)
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail as Record<string, unknown> | null
      if (!msg) return
      if (msg.type === 'lorebooks_list') {
        if (receivedRef.current) return
        receivedRef.current = true
        const chat = msg.chatLinked ? (msg.chatLinked as LorebookInfo) : null
        const char = msg.characterLinked ? (msg.characterLinked as LorebookInfo) : null
        const books = (msg.allLorebooks as LorebookInfo[]) || []
        setChatLinked(chat)
        setCharacterLinked(char)
        setAllLorebooks(books)

        // Validate saved selection against freshly fetched data
        // Uses functional updater to avoid stale closure
        setSelectedId((current) => {
          if (current === AUTO_GENERATE_ID || current === DEFAULT_LOREBOOK_ID) return current
          if (chat?.id === current || char?.id === current) return current
          if (books.some((b) => b.id === current)) return current
          // Saved ID no longer exists — fall back to Auto Generate
          try { localStorage.setItem(LOREBOOK_SELECTED_KEY, AUTO_GENERATE_ID) } catch {}
          return AUTO_GENERATE_ID
        })

        setFetching(false)
      }
    }
    window.addEventListener('chronicle:backend-message', handler)
    return () => window.removeEventListener('chronicle:backend-message', handler)
  }, [])

  // Report selected lorebook up to parent (skip DEFAULT_LOREBOOK_ID → undefined)
  // Only report after list is loaded — prevents stale localStorage IDs from reaching
  // the backend before the fetched response validates them.
  useEffect(() => {
    if (fetching) return
    const effectiveId = selectedId === DEFAULT_LOREBOOK_ID ? undefined : selectedId
    onLorebookChange?.(effectiveId)
  }, [selectedId, onLorebookChange, fetching])

  const handleChange = (e: Event) => {
    const id = (e.target as HTMLSelectElement).value
    setSelectedId(id)
    try { localStorage.setItem(LOREBOOK_SELECTED_KEY, id) } catch { /* ignore */ }
  }

  // Exclude linked books from "all lorebooks" to avoid duplicates in dropdown
  const linkedIds = new Set<string>()
  if (chatLinked) linkedIds.add(chatLinked.id)
  if (characterLinked) linkedIds.add(characterLinked.id)

  const isDisabled = loading || fetching

  return (
    <div data-chronicle="lorebook-manager">
      <div class="chronicle-lb-row">
        <label class="chronicle-lb-label">Lorebook to Use</label>
        <select
          class="chronicle-lb-select"
          value={selectedId}
          onChange={handleChange}
          disabled={isDisabled}
        >
          {characterLinked ? (
            <option value={characterLinked.id}>
              Character-linked ({characterLinked.name})
            </option>
          ) : !fetching ? (
            <option value="" disabled>
              Character-linked (empty)
            </option>
          ) : null}
          {chatLinked ? (
            <option value={chatLinked.id}>
              Persona-linked ({chatLinked.name})
            </option>
          ) : !fetching ? (
            <option value="" disabled>
              Persona-linked (empty)
            </option>
          ) : null}
          <option value={AUTO_GENERATE_ID}>
            Auto Generate
          </option>
          {allLorebooks
            .filter((b) => !linkedIds.has(b.id))
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))
          }
        </select>
        {fetching && (
          <span style={{
            fontSize: 'calc(10px * var(--lumiverse-font-scale, 1))',
            color: 'var(--lumiverse-text-dim)',
            marginTop: 2,
          }}>
            Loading lorebooks…
          </span>
        )}
      </div>
    </div>
  )
}
