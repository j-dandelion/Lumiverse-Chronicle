/**
 * Chronicle — Backend relay
 * Forwards Spindle backend messages to Chronicle frontend components via custom DOM events.
 */

import type { SpindleFrontendContext } from 'lumiverse-spindle-types'

export function setupBackendListener(spindleCtx: SpindleFrontendContext): () => void {
  return spindleCtx.onBackendMessage((payload: unknown) => {
    const msg = payload as Record<string, unknown> | null
    if (!msg || typeof msg.type !== 'string') return

    switch (msg.type) {
      case 'summarize_progress':
      case 'summarize_failed':
      case 'summarize_preview':
      case 'summarize_saved':
      case 'connections_list':
      case 'discard_confirmed':
      case 'lorebooks_list':
        window.dispatchEvent(
          new CustomEvent('chronicle:backend-message', { detail: payload })
        )
        break
    }
  })
}
