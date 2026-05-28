/**
 * Chronicle — Teardown
 * Cleanly removes all Chronicle-injected DOM, unmounts Preact components, and disconnects observers.
 */

interface TeardownState {
  _removeObserver: (() => void) | null
  _removeStyles: (() => void) | null
  _selectBarCleanup: { cleanup: () => void } | null
  _backendUnsub: (() => void) | null
  _moduleBackendUnsub: (() => void) | null
  _renders: Array<{ root: Element; unmount: () => void }>
  _teardownRef: { current: (() => void) | null }
}

export function createFullTeardown(state: TeardownState): () => void {
  return function fullTeardown() {
    state._removeObserver?.()
    state._removeObserver = null

    state._removeStyles?.()
    state._removeStyles = null

    state._selectBarCleanup?.cleanup()
    state._selectBarCleanup = null

    state._backendUnsub?.()
    state._backendUnsub = null

    state._moduleBackendUnsub?.()
    state._moduleBackendUnsub = null

    // Unmount all tracked Preact components (reverse order)
    for (const r of [...state._renders].reverse()) {
      try {
        r.unmount()
      } catch {
        // best-effort
      }
    }
    state._renders.length = 0

    // Only clean up elements from tracked renders — not a scorched-earth querySelectorAll
    // This avoids destroying other extensions' elements that use the same data attribute

    state._teardownRef.current = null
  }
}
