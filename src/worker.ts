/**
 * Chronicle — Backend worker (slim router)
 * Receives selected message IDs, fetches content, generates summary, creates world book entries.
 *
 * Protocol types and validators are imported from ./types (single source of truth).
 * LLM interaction lives in ./worker-llm.
 * World book operations live in ./worker-worldbooks.
 * Shared state lives in ./worker-state.
 */

declare const spindle: import('lumiverse-spindle-types').SpindleAPI

const LOG = '[Chronicle:Worker]'

import {
  isValidSummarizeRequestV2,
  isValidSaveSummaryRequest,
  isValidDiscardSummaryRequest,
  isValidListConnectionsRequest,
  isValidListLorebooksRequest,
  PROTOCOL_VERSION,
} from './types'
import type {
  SummarizeRequestV2,
  SaveSummaryRequest,
  DiscardSummaryRequest,
  LorebookInfo,
} from './types'

import {
  _summarizingUsers,
  _summarizingTimeouts,
  _pendingSummaries,
  SUMMARIZE_TIMEOUT_MS,
  type PendingSummary,
} from './worker-state'

import {
  checkPermissions,
  fetchMessageContent,
  generateSummary,
  type ChatDTO,
} from './worker-llm'

import {
  getOrCreateChronicleBook,
  resolveNextChronicleNumber,
  fetchRecentSummaries,
  saveLorebookEntry,
  type WorldBookDTO,
} from './worker-worldbooks'
import { withTimeout } from './timeout'

// ── Hide messages prior to selection ────────────────────────────────

/**
 * Hide messages prior to the first selected message.
 * If keepVisibleCount > 0, keeps that many messages immediately before the selection visible.
 *
 * getMessages() returns all messages ordered by index_in_chat ASC (chats.service.ts:1268).
 * Array index matches chronological position — no need to read index_in_chat field directly.
 */
async function hideMessagesPriorTo(
  chatId: string,
  selectedMessageIds: string[],
  userId: string,
  keepVisibleCount: number = 0
): Promise<void> {
  try {
    // 1. Get all messages in chat order (includes hidden messages — no filter at Spindle layer)
    const allMessages = await spindle.chat.getMessages(chatId) as unknown as Array<{ id: string }>

    // 2. Find indices of all selected messages
    const selectedIdSet = new Set(selectedMessageIds)
    const selectedIndices: number[] = []
    for (let i = 0; i < allMessages.length; i++) {
      if (selectedIdSet.has(allMessages[i].id)) {
        selectedIndices.push(i)
      }
    }

    if (selectedIndices.length === 0) return

    // 3. The first selected message (lowest index) determines the boundary
    //    Non-contiguous selections (e.g., messages #10, #50, #90): only #0-#9 are hidden
    const firstSelectedIdx = Math.min(...selectedIndices)

    // 4. Calculate which messages to hide
    //    Keep `keepVisibleCount` messages visible right before the selection
    const hideBeforeIdx = Math.max(0, firstSelectedIdx - keepVisibleCount)

    if (hideBeforeIdx <= 0) return  // Nothing to hide

    const idsToHide = allMessages.slice(0, hideBeforeIdx).map(m => m.id)

    if (idsToHide.length === 0) return

    // 5. Bulk hide with timeout guard (Spindle response-hang bug)
    //    setMessagesHidden may not be in published types — cast through any
    await withTimeout(
      (spindle.chat as any).setMessagesHidden(chatId, idsToHide, true) as Promise<void>,
      10_000,
      'Hide messages request'
    )
    spindle.log.info(`${LOG} Hid ${idsToHide.length} messages prior to selection (kept ${keepVisibleCount} visible)`)
  } catch (err: unknown) {
    spindle.log.warn(`${LOG} Failed to hide prior messages: ${err instanceof Error ? err.message : String(err)}`)
    // Non-fatal — don't block the save flow
  }
}

// ── Handlers ────────────────────────────────────────────────────────

async function handleSummarizeV2(req: SummarizeRequestV2, userId: string): Promise<void> {
  // 1. Check permissions
  const missingPermission = checkPermissions()
  if (missingPermission) {
    spindle.sendToFrontend({
      type: 'summarize_failed',
      error: `Missing permission: ${missingPermission}. Grant it in extension settings.`,
      stage: 'permission_denied',
      retryable: false,
    }, userId)
    return
  }

  // 1b. Sanity checks — prevent oversized requests
  if (req.messageIds.length > 100) {
    spindle.sendToFrontend({
      type: 'summarize_failed',
      error: `Too many messages selected (${req.messageIds.length}). Select up to 100 messages.`,
      stage: 'fetching',
      retryable: false,
    }, userId)
    return
  }

  // 1c. Preview-only enforcement — direct-save mode is no longer valid.
  //     This guard runs BEFORE any API calls (chat fetch, LLM generation)
  //     to avoid wasting tokens on a stale frontend or traffic replay.
  if (!req.previewOnly) {
    spindle.sendToFrontend({
      type: 'summarize_failed',
      error: 'Internal error: direct-save mode is no longer supported. Please refresh the page.',
      stage: 'generating',
      retryable: true,
    }, userId)
    return
  }

  // 2. Get active chat
  let chatId: string | undefined
  try {
    const activeChat = await spindle.chats.getActive(userId) as ChatDTO | null
    chatId = activeChat?.id
    if (!chatId) {
      spindle.sendToFrontend({
        type: 'summarize_failed',
        error: 'No active chat found. Open a chat first.',
        stage: 'fetching',
        retryable: false,
      }, userId)
      return
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    spindle.sendToFrontend({
      type: 'summarize_failed',
      error: `Failed to get active chat: ${message}`,
      stage: 'fetching',
      retryable: false,
    }, userId)
    return
  }

  spindle.sendToFrontend({ type: 'summarize_progress', stage: 'fetching' }, userId)

  // 3. Fetch messages
  let messages: Array<{ role: string; content: string }>
  try {
    messages = await fetchMessageContent(chatId, req.messageIds)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    spindle.sendToFrontend({
      type: 'summarize_failed',
      error: `Failed to fetch messages: ${message}`,
      stage: 'fetching',
      retryable: true,
    }, userId)
    return
  }

  if (messages.length === 0) {
    spindle.sendToFrontend({
      type: 'summarize_failed',
      error: 'No selected messages found in chat. Messages may have been deleted.',
      stage: 'fetching',
      retryable: false,
    }, userId)
    return
  }

  // 3b. Resolve scene number and recent context (only if a specific book is selected)
  let sceneNumber: string | undefined
  let recentContext: string | undefined
  const hasTargetBook = req.worldBookId && req.worldBookId !== '__auto_generate__'

  if (req.includeRecentContext && hasTargetBook) {
    const count = Math.max(1, Math.min(10, req.recentContextCount ?? 3))  // backend clamp
    const bookId = req.worldBookId!  // guaranteed non-null by hasTargetBook guard
    const [num, ctx] = await Promise.all([
      resolveNextChronicleNumber(bookId, userId),
      fetchRecentSummaries(bookId, userId, count),
    ])
    sceneNumber = num
    recentContext = ctx
  } else if (hasTargetBook) {
    // Even without recent context, resolve the number so {number} is filled
    sceneNumber = await resolveNextChronicleNumber(req.worldBookId!, userId)
  }

  // 4. Generate summary with optional custom prompt, connection, and params
  const summary = await generateSummary(messages, req.title, userId, req.customPrompt, req.connectionId, req.params, sceneNumber, recentContext)
  if (!summary) return // Error already sent to frontend

  // 5a. Preview mode — return without saving
  if (req.previewOnly) {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    _pendingSummaries.set(requestId, {
      requestId,
      title: summary.title,
      content: summary.content,
      keys: summary.keys,
      chatId,
      messageIds: req.messageIds,
      worldBookId: req.worldBookId,
      userId,
      createdAt: Date.now(),
      autoHidePrior: req.autoHidePrior,
      keepVisibleCount: req.keepVisibleCount,
      sceneNumber,
    })

    spindle.sendToFrontend({
      type: 'summarize_preview',
      requestId,
      title: summary.title,
      content: summary.content,
      keys: summary.keys,
      messageCount: messages.length,
    }, userId)
    return
  }
}

async function handleSaveSummary(req: SaveSummaryRequest, userId: string): Promise<void> {
  const pending = _pendingSummaries.get(req.requestId)
  if (!pending) {
    spindle.sendToFrontend({
      type: 'summarize_failed',
      error: 'Preview has expired or was already discarded. Please generate a new summary.',
      stage: 'generating',
      retryable: true,
    }, userId)
    return
  }

  // Verify the requesting user owns this pending summary
  if (pending.userId !== userId) {
    spindle.log.warn(`${LOG} User ${userId} tried to save pending summary of user ${pending.userId}`)
    return
  }

  spindle.sendToFrontend({ type: 'summarize_progress', stage: 'saving' }, userId)

  try {
    const effectiveTitle = req.title?.trim() || pending.title
    const effectiveContent = req.content ?? pending.content

    // Use save-time lorebookId first, fall back to generate-time pending.worldBookId
    const targetBookId = req.lorebookId || pending.worldBookId

    // Use request keys if provided (including empty array = user cleared all keys).
    // Undefined means "no keys specified — use the LLM-generated keys from pending store."
    const effectiveKeys = req.keys !== undefined ? req.keys : pending.keys

    // Race the save against a timeout — the Spindle API response can hang
    // even when the server-side operation succeeds.
    const saveResult = await withTimeout(
      saveLorebookEntry(
        { title: effectiveTitle, content: effectiveContent, keys: effectiveKeys },
        pending.chatId,
        pending.messageIds,
        targetBookId,
        userId,
        req.settings,
        req.titleFormat,
        pending.sceneNumber
      ),
      15_000,
      'Save request'
    )
    const { entryId, worldBookId } = saveResult

    // Only delete pending summary AFTER save succeeds — preserve it on failure for retry
    _pendingSummaries.delete(req.requestId)

    // Hide prior messages on successful save (fire-and-forget)
    if (pending.autoHidePrior) {
      hideMessagesPriorTo(
        pending.chatId, pending.messageIds, userId, pending.keepVisibleCount ?? 0
      ).catch((err) => {
        spindle.log.warn(`${LOG} hideMessagesPriorTo failed: ${err}`)
      })
    }

    spindle.sendToFrontend({
      type: 'summarize_saved',
      entryId,
      title: effectiveTitle,
      preview: pending.content.slice(0, 100),
      worldBookId,
    }, userId)
    spindle.log.info(`${LOG} Saved preview as lorebook entry "${effectiveTitle}" (${pending.messageIds.length} messages)`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)

    // If save timed out, the save may have succeeded server-side — hide anyway
    if (pending.autoHidePrior && message === 'Save request timed out after 15s') {
      hideMessagesPriorTo(
        pending.chatId, pending.messageIds, userId, pending.keepVisibleCount ?? 0
      ).catch((e) => {
        spindle.log.warn(`${LOG} hideMessagesPriorTo (timeout fallback) failed: ${e}`)
      })
    }

    spindle.sendToFrontend({
      type: 'summarize_failed',
      error: `Failed to save entry: ${message}`,
      stage: 'saving',
      retryable: true,
    }, userId)
  }
}

async function handleDiscardSummary(req: DiscardSummaryRequest, userId: string): Promise<void> {
  const pending = _pendingSummaries.get(req.requestId)
  if (pending && pending.userId === userId) {
    _pendingSummaries.delete(req.requestId)
    spindle.log.info(`${LOG} User ${userId} discarded pending summary ${req.requestId}`)
  }
  // Send confirmation so frontend can clean up confidently
  spindle.sendToFrontend({
    type: 'discard_confirmed',
    requestId: req.requestId,
  }, userId)
}

// ── Connection profiles ─────────────────────────────────────────────

async function handleListConnections(userId: string): Promise<void> {
  try {
    const connections = await withTimeout(
      Promise.resolve(spindle.connections.list(userId)) as Promise<Array<{
        id: string
        name: string
        provider: string
        api_url: string
        model: string
      }>>,
      10_000,
      'Connections list'
    )
    spindle.sendToFrontend({ type: 'connections_list', connections }, userId)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    spindle.log.warn(`${LOG} Failed to list connections: ${message}`)
    // Send empty list so the frontend stops loading
    spindle.sendToFrontend({ type: 'connections_list', connections: [] }, userId)
  }
}

// ── Lorebook listing ────────────────────────────────────────────────

async function handleListLorebooks(userId: string): Promise<void> {
  try {
    // 1. List ALL world books (with timeout — Spindle API can hang)
    const { data: books } = await withTimeout(
      spindle.world_books.list({ limit: 200, userId }) as Promise<{ data: WorldBookDTO[]; total: number }>,
      10_000,
      'Lorebook list request'
    )
    const allBooks = (books as WorldBookDTO[]).map((b) => ({ id: b.id, name: b.name }))

    // 2. Try to detect chat-linked lorebook (persona.attached_world_book_id)
    //    Soft permission check — if 'personas' not granted, skip gracefully
    let chatLinked: LorebookInfo | null = null
    try {
      if (spindle.permissions.has('personas')) {
        const persona = await spindle.personas.getActive(userId) as unknown as {
          attached_world_book_id: string | null
        } | null
        if (persona?.attached_world_book_id) {
          const book = allBooks.find((b) => b.id === persona.attached_world_book_id)
          if (book) chatLinked = book
        }
      }
    } catch (err) {
      spindle.log.warn(`${LOG} Failed to get persona-linked book: ${err}`)
    }

    // 3. Try to detect character-linked lorebook (character.world_book_ids)
    //    Soft permission check — if 'characters' not granted, skip gracefully
    let characterLinked: LorebookInfo | null = null
    try {
      if (spindle.permissions.has('characters')) {
        const activeChat = await spindle.chats.getActive(userId) as ChatDTO | null
        if (activeChat?.character_id) {
          const character = await spindle.characters.get(activeChat.character_id, userId) as unknown as {
            world_book_ids?: string[]
          } | null
          if (character?.world_book_ids?.length) {
            // Show the first linked lorebook (characters can have multiple)
            const firstBookId = character.world_book_ids[0]
            const book = allBooks.find((b) => b.id === firstBookId)
            if (book) characterLinked = book
          }
        }
      }
    } catch (err) {
      spindle.log.warn(`${LOG} Failed to get character-linked book: ${err}`)
    }

    spindle.sendToFrontend({
      type: 'lorebooks_list',
      chatLinked,
      characterLinked,
      allLorebooks: allBooks,
    }, userId)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    spindle.log.warn(`${LOG} Failed to list lorebooks: ${message}`)
    // Send empty data so frontend stops loading
    spindle.sendToFrontend({
      type: 'lorebooks_list',
      chatLinked: null,
      characterLinked: null,
      allLorebooks: [],
    }, userId)
  }
}

// ── Frontend message handler ───────────────────────────────────────

async function handleFrontendMessage(
  payload: unknown,
  userId: string
): Promise<void> {
    spindle.log.info(`${LOG} Received message: ` + JSON.stringify(payload))

  // Detect protocol version mismatch early for specific error message
  const raw = payload as Record<string, unknown> | null
  if (raw?.type === 'summarize_v2' && raw.protocolVersion !== PROTOCOL_VERSION) {
    spindle.sendToFrontend({
      type: 'summarize_failed',
      error: `Protocol version mismatch. Frontend: ${raw.protocolVersion ?? 'none'}, Backend: ${PROTOCOL_VERSION}. Please refresh the page.`,
      stage: 'permission_denied',
      retryable: false,
    }, userId)
    return
  }

  if (isValidSummarizeRequestV2(payload)) {
    if (_summarizingUsers.has(userId)) {
      spindle.sendToFrontend({
        type: 'summarize_failed',
        error: 'A summarization is already in progress for your account. Please wait.',
        stage: 'generating',
        retryable: true,
      }, userId)
      return
    }

    _summarizingUsers.add(userId)
    let _summarizationCompleted = false
    const timeoutId = setTimeout(() => {
      // Skip if the task already completed or errored (which sends its own message)
      if (_summarizationCompleted) return
      _summarizingUsers.delete(userId)
      _summarizingTimeouts.delete(userId)
      spindle.log.warn(`${LOG} Summarization lock for ${userId} auto-cleared after ${SUMMARIZE_TIMEOUT_MS / 1000}s timeout`)
      spindle.sendToFrontend({
        type: 'summarize_failed',
        error: 'Summarization timed out after 5 minutes.',
        stage: 'generating',
        retryable: true,
      }, userId)
    }, SUMMARIZE_TIMEOUT_MS)
    _summarizingTimeouts.set(userId, timeoutId)

    try {
      await handleSummarizeV2(payload, userId)
    } finally {
      _summarizationCompleted = true
      const t = _summarizingTimeouts.get(userId)
      if (t) { clearTimeout(t); _summarizingTimeouts.delete(userId) }
      _summarizingUsers.delete(userId)
    }

  } else if (isValidSaveSummaryRequest(payload)) {
    await handleSaveSummary(payload, userId)

  } else if (isValidDiscardSummaryRequest(payload)) {
    await handleDiscardSummary(payload, userId)

  } else if (isValidListConnectionsRequest(payload)) {
    await handleListConnections(userId)

  } else if (isValidListLorebooksRequest(payload)) {
    await handleListLorebooks(userId)

  } else {
    spindle.log.warn(`${LOG} Unknown or invalid message: ` + JSON.stringify(payload))
  }
}

// ── Register handler ────────────────────────────────────────────────

spindle.onFrontendMessage(handleFrontendMessage)

spindle.log.info(`${LOG} Worker started — ready to summarize`)
