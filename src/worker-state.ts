/**
 * Chronicle — Worker state
 * Module-level state for summarization locks and pending previews.
 */

declare const spindle: import('lumiverse-spindle-types').SpindleAPI

export const SUMMARIZE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes — prevents deadlock if worker hangs

export const _summarizingUsers = new Set<string>()
export const _summarizingTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export interface PendingSummary {
  requestId: string
  title: string
  content: string
  keys: string[]              // auto-generated keys from LLM
  chatId: string
  messageIds: string[]
  worldBookId?: string
  userId: string
  createdAt: number
  autoHidePrior?: boolean     // auto-hide messages prior to first selected after save
  keepVisibleCount?: number   // number of prior messages to keep visible (0 = hide all)
  sceneNumber?: string        // scene number used in the LLM prompt (prevent save-time divergence)
}

export const _pendingSummaries = new Map<string, PendingSummary>()
const PENDING_TTL = 30 * 60 * 1000 // 30 minutes

// Periodic cleanup of expired pending summaries
setInterval(() => {
  const now = Date.now()
  for (const [id, pending] of _pendingSummaries) {
    if (now - pending.createdAt > PENDING_TTL) {
      _pendingSummaries.delete(id)
      spindle.log.info(`[Chronicle:Worker] Expired pending summary ${id}`)
    }
  }
}, 60 * 1000) // Check every minute
