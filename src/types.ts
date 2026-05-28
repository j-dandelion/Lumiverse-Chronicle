/**
 * Chronicle — Shared protocol types
 * SINGLE SOURCE OF TRUTH for all frontend↔backend message types and validators.
 *
 * Bun bundles frontend and backend separately, but both can import from this file
 * at build time — the shared types are bundled into each output independently.
 * When modifying types here, run `bun run check` to verify both bundles.
 */

export const PROTOCOL_VERSION = 2  // JSON output format, no hidden KEYS layer

// ── Shared types ────────────────────────────────────────────────────

export interface GenerationParams {
  temperature: number
  top_p: number
  max_tokens: number
  top_k: number
}

// ── Frontend → Backend ──────────────────────────────────────────────

export interface SummarizeRequestV2 {
  type: 'summarize_v2'
  protocolVersion: number
  messageIds: string[]
  worldBookId?: string
  title?: string
  customPrompt?: string       // overrides default system prompt
  previewOnly: boolean        // true = return preview, don't save
  connectionId?: string       // optional specific connection profile to use
  autoHidePrior?: boolean     // auto-hide messages prior to first selected after save
  keepVisibleCount?: number   // number of prior messages to keep visible (0 = hide all)
  params?: GenerationParams   // LLM generation parameters (temperature, top_p, etc.)
  includeRecentContext?: boolean  // fetch prior entries as context for scene numbering
  recentContextCount?: number     // how many prior entries to include (default 3)
}

export interface SummarizePreview {
  type: 'summarize_preview'
  requestId: string
  title: string
  content: string
  messageCount: number
  keys?: string[]             // auto-generated keys from LLM
}

export interface SaveSummaryRequest {
  type: 'save_summary'
  requestId: string           // identifies the pending preview
  title?: string              // optional user-edited title (overrides original)
  titleFormat?: string        // template for formatting the entry title (e.g., "Chronicle: {title}")
  keys?: string[]             // user-edited trigger keys (overrides LLM-generated keys from pending store)
  content?: string            // user-edited content (overrides LLM-generated content from pending store)
  settings?: Record<string, unknown>  // optional entry settings override (from SettingsManager)
  lorebookId?: string           // selected lorebook ID (or __auto_generate__)
}

export interface DiscardSummaryRequest {
  type: 'discard_summary'
  requestId: string
}

export interface SummarizeSaved {
  type: 'summarize_saved'
  entryId: string
  title: string
  preview: string
  worldBookId: string
}

export interface ListConnectionsRequest {
  type: 'list_connections'
}

export interface ConnectionsListResponse {
  type: 'connections_list'
  connections: Array<{
    id: string
    name: string
    provider: string
    api_url: string
    model: string
  }>
}

export interface ListLorebooksRequest {
  type: 'list_lorebooks'
}

export interface LorebookInfo {
  id: string
  name: string
}

export interface LorebooksListResponse {
  type: 'lorebooks_list'
  chatLinked: LorebookInfo | null       // persona.attached_world_book_id resolved
  characterLinked: LorebookInfo | null  // character.world_book_ids[0] resolved
  allLorebooks: LorebookInfo[]          // ALL world books the user has
}

export type FrontendToBackend =
  | SummarizeRequestV2       // NEW
  | SaveSummaryRequest       // NEW
  | DiscardSummaryRequest    // NEW
  | ListConnectionsRequest   // NEW
  | ListLorebooksRequest     // NEW

// ── Backend → Frontend ──────────────────────────────────────────────

export interface SummarizeProgress {
  type: 'summarize_progress'
  stage: 'fetching' | 'generating' | 'saving'
  message?: string
}

export interface SummarizeFailed {
  type: 'summarize_failed'
  error: string
  stage: 'fetching' | 'generating' | 'saving' | 'permission_denied'
  retryable: boolean
}

export interface DiscardConfirmed {
  type: 'discard_confirmed'
  requestId: string
}

export type BackendToFrontend =
  | SummarizeProgress
  | SummarizeFailed
  | SummarizePreview         // NEW
  | SummarizeSaved           // NEW
  | DiscardConfirmed         // NEW
  | ConnectionsListResponse  // NEW
  | LorebooksListResponse    // NEW

// ── Validation ───────────────────────────────────────────────────────

export function isValidSummarizeRequestV2(payload: unknown): payload is SummarizeRequestV2 {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  return (
    p.type === 'summarize_v2' &&
    p.protocolVersion === PROTOCOL_VERSION &&
    Array.isArray(p.messageIds) &&
    p.messageIds.length > 0 &&
    p.messageIds.every((id: unknown) => typeof id === 'string') &&
    typeof p.previewOnly === 'boolean'
  )
}

export function isValidSaveSummaryRequest(payload: unknown): payload is SaveSummaryRequest {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  return p.type === 'save_summary' && typeof p.requestId === 'string'
}

export function isValidDiscardSummaryRequest(payload: unknown): payload is DiscardSummaryRequest {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  return p.type === 'discard_summary' && typeof p.requestId === 'string'
}

export function isValidListConnectionsRequest(payload: unknown): payload is ListConnectionsRequest {
  if (!payload || typeof payload !== 'object') return false
  return (payload as Record<string, unknown>).type === 'list_connections'
}

export function isValidListLorebooksRequest(payload: unknown): payload is ListLorebooksRequest {
  if (!payload || typeof payload !== 'object') return false
  return (payload as Record<string, unknown>).type === 'list_lorebooks'
}
