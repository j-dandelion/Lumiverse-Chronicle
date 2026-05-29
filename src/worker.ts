/**
 * Chronicle — Backend worker
 * Receives selected message IDs, fetches content, generates summary, creates world book entries.
 *
 * Protocol types and validators are imported from ./types (single source of truth).
 *
 * Key APIs (verified from Lumiverse source):
 * - spindle.onFrontendMessage((payload, userId) => {})
 * - spindle.sendToFrontend(payload, userId?)
 * - spindle.chats.getActive(userId?) → ChatDTO
 * - spindle.chat.getMessages(chatId) → ChatMessageDTO[]
 * - spindle.generate.quiet({ messages }) → GenerationResponse
 * - spindle.world_books.entries.create(worldBookId, input, userId?) → WorldBookEntryDTO
 * - spindle.world_books.list(options?) → { data, total }
 * - spindle.world_books.create(input, userId?) → WorldBookDTO
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
  ListConnectionsRequest,
  ListLorebooksRequest,
  LorebookInfo,
  GenerationParams,
} from './types'

import {
  buildSummarizePrompt,
  parseSummaryJson,
  sanitizeJsonForParse,
  extractContentKeywords,
} from './prompts'

// ── Spindle API Return Types ────────────────────────────────────────

interface ChatMessageDTO {
  id: string
  chat_id: string
  is_user: boolean
  content: string
  swipes?: unknown[]
  swipe_id?: string
  role?: string
  metadata?: Record<string, unknown>
}

interface WorldBookDTO {
  id: string
  name: string
  description?: string
}

interface WorldBookEntryDTO {
  id: string
  key: string[]
  content: string
  comment?: string
  created_at: number
}

interface GenerationResponse {
  content: string
  reasoning?: string
  finish_reason: string
  tool_calls?: unknown[]
  usage?: Record<string, unknown>
}

interface ChatDTO {
  id: string
  character_id?: string
  name?: string
  metadata?: Record<string, unknown>
}
// ── State ───────────────────────────────────────────────────────────

const _summarizingUsers = new Set<string>()
const _summarizingTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const SUMMARIZE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes — prevents deadlock if worker hangs

// ── Pending preview store ─────────────────────────────────────────

interface PendingSummary {
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

const _pendingSummaries = new Map<string, PendingSummary>()
const PENDING_TTL = 30 * 60 * 1000 // 30 minutes

// Periodic cleanup of expired pending summaries
setInterval(() => {
  const now = Date.now()
  for (const [id, pending] of _pendingSummaries) {
    if (now - pending.createdAt > PENDING_TTL) {
      _pendingSummaries.delete(id)
      spindle.log.info(`${LOG} Expired pending summary ${id}`)
    }
  }
}, 60 * 1000) // Check every minute (was every 5 min — expired entries could linger 25 min)

// ── Permission check ────────────────────────────────────────────────

function checkPermissions(): string | null {
  if (!spindle.permissions.has('generation')) return 'generation'
  if (!spindle.permissions.has('chat_mutation')) return 'chat_mutation'
  if (!spindle.permissions.has('world_books')) return 'world_books'
  if (!spindle.permissions.has('chats')) return 'chats'
  return null
}

// ── Fetch message content ──────────────────────────────────────────

async function fetchMessageContent(
  chatId: string,
  messageIds: string[]
): Promise<Array<{ role: string; content: string }>> {
  const messages = await spindle.chat.getMessages(chatId)
  const idSet = new Set(messageIds)
  const MAX_CONTENT_LENGTH = 2000

  return (messages as unknown as ChatMessageDTO[])
    .filter((m) => idSet.has(m.id))
    .map((m) => {
      let content = m.content ?? ''
      // Truncate long messages to keep prompt size manageable
      if (content.length > MAX_CONTENT_LENGTH) {
        content = content.slice(0, MAX_CONTENT_LENGTH) + '…[truncated]'
      }

      return {
        role: m.role ?? (m.is_user ? 'user' : 'assistant'),
        content,
      }
    })
}

// ── LLM summarization ──────────────────────────────────────────────

async function generateSummary(
  messages: Array<{ role: string; content: string }>,
  title: string | undefined,
  userId: string,
  customPrompt?: string,
  connectionId?: string,  // optional connection profile to use
  params?: GenerationParams,
  sceneNumber?: string,    // replaces {number} in the system prompt
  recentContext?: string   // appended as context block
): Promise<{ title: string; content: string; keys: string[] } | null> {
  const { systemPrompt, userPrompt } = buildSummarizePrompt(messages, title, customPrompt, sceneNumber, recentContext)

  // NO MORE hidden prompt injection — the JSON-output instructions are
  // already part of the visible system prompt from the selected preset.

  spindle.sendToFrontend({ type: 'summarize_progress', stage: 'generating' }, userId)

  try {
    const genInput: any = {
      type: 'quiet' as const,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      signal: AbortSignal.timeout(120_000), // 2-minute LLM timeout
    };
    genInput.userId = userId; // Required for operator-scoped extensions
    if (connectionId) {
      genInput.connection_id = connectionId;
    }
    if (params) {
      genInput.parameters = {
        temperature: params.temperature,
        top_p: params.top_p,
        max_tokens: params.max_tokens,
        top_k: params.top_k,
      }
    }
    const result = await spindle.generate.quiet(genInput) as unknown as GenerationResponse

    const text = result?.content ?? ''

    if (!text?.trim()) {
      throw new Error('LLM returned empty response')
    }

    // parseSummaryJson now handles 5 fallback strategies internally.
    // If it returns null, all parsing failed — use raw text as content.
    const parsed = parseSummaryJson(text.trim())

    if (parsed) {
      const keys = (parsed.keys.length > 0)
        ? parsed.keys
        : extractContentKeywords(parsed.content, parsed.title)
      return {
        title: parsed.title,
        content: parsed.content,
        keys,
      }
    }

    // All parsing strategies failed — return raw text as content
    return {
      title: title || `Summary ${new Date().toLocaleDateString()}`,
      content: text.trim(),
      keys: extractContentKeywords(text.trim(), title || ''),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const errName = err instanceof Error ? err.name : ''

    if (message.includes('PERMISSION_DENIED')) {
      spindle.sendToFrontend(
        {
          type: 'summarize_failed',
          error: 'Generation permission is required. Enable it in extension settings.',
          stage: 'permission_denied',
          retryable: false,
        },
        userId
      )
    } else if (message.includes('429') || message.includes('rate limited')) {
      spindle.sendToFrontend(
        {
          type: 'summarize_failed',
          error: 'Rate limited by LLM provider. Try again in a moment.',
          stage: 'generating',
          retryable: true,
        },
        userId
      )
    } else if (errName === 'AbortError' || errName === 'TimeoutError' || message.toLowerCase().includes('timed out')) {
      spindle.sendToFrontend(
        {
          type: 'summarize_failed',
          error: 'Summarization timed out after 2 minutes. The LLM request took too long.',
          stage: 'generating',
          retryable: true,
        },
        userId
      )
    } else {
      spindle.sendToFrontend(
        {
          type: 'summarize_failed',
          error: `Summarization failed: ${message}`,
          stage: 'generating',
          retryable: true,
        },
        userId
      )
    }

    return null
  }
}

// ── New handler: summarize_v2 with preview support ─────────────────

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
    await Promise.race([
      (spindle.chat as any).setMessagesHidden(chatId, idsToHide, true) as Promise<void>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Hide messages request timed out')), 10_000)
      ),
    ])
    spindle.log.info(`${LOG} Hid ${idsToHide.length} messages prior to selection (kept ${keepVisibleCount} visible)`)
  } catch (err: unknown) {
    spindle.log.warn(`${LOG} Failed to hide prior messages: ${err instanceof Error ? err.message : String(err)}`)
    // Non-fatal — don't block the save flow
  }
}

// ── New handler: summarize_v2 with preview support ─────────────────

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
    const saveResult = await Promise.race([
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
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Save request timed out after 15s')), 15_000)
      ),
    ])
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
    const connections = await Promise.race([
      spindle.connections.list(userId) as unknown as Array<{
        id: string
        name: string
        provider: string
        api_url: string
        model: string
      }>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timed out after 10s')), 10_000)
      ),
    ])
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
    const { data: books } = await Promise.race([
      spindle.world_books.list({ limit: 200, userId }) as Promise<{ data: WorldBookDTO[]; total: number }>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Lorebook list request timed out after 10s')), 10_000)
      ),
    ])
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

// ── World book entry creation ──────────────────────────────────────

const CHRONICLE_WORLD_BOOK_NAME = 'Chronicle'

// Mutex for book creation to prevent race conditions when two concurrent
// requests both detect "no book" and both try to create one.
const _creationLocks = new Map<string, Promise<{ id: string }>>()

async function getOrCreateChronicleBook(userId: string): Promise<{ id: string }> {
  const key = `chronicle:${CHRONICLE_WORLD_BOOK_NAME}:${userId}`

  // If another request is already creating this book, wait for it
  const existing = _creationLocks.get(key)
  if (existing) return existing

  const promise = (async () => {
    const { data: books } = await Promise.race([
      spindle.world_books.list({ limit: 200, userId }) as Promise<{ data: WorldBookDTO[]; total: number }>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timed out listing world books')), 10_000)
      ),
    ])
    const allBooks = books as WorldBookDTO[]
    const chronicleBook = allBooks.find((b) => b.name === CHRONICLE_WORLD_BOOK_NAME)

    if (chronicleBook) {
      return { id: chronicleBook.id }
    }

    const newBook = await Promise.race([
      spindle.world_books.create(
        { name: CHRONICLE_WORLD_BOOK_NAME, description: 'Lorebook entries generated by the Chronicle extension' },
        userId
      ) as Promise<WorldBookDTO>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timed out creating world book')), 10_000)
      ),
    ])

    spindle.log.info(`${LOG} Created Chronicle world book: ${(newBook as WorldBookDTO).id}`)
    return { id: (newBook as WorldBookDTO).id }
  })()

  _creationLocks.set(key, promise)

  // Safety timeout — auto-release lock after 30s if the finally block doesn't run
  const safetyTimeout = setTimeout(() => _creationLocks.delete(key), 30_000)

  try {
    return await promise
  } finally {
    clearTimeout(safetyTimeout)
    _creationLocks.delete(key)
  }
}
/**
 * Creates the next available Chronicle_N book.
 * - Searches for existing books matching "Chronicle_N" (N = 1, 2, 3...)
 * - Skips the unnumbered "Chronicle" book created by getOrCreateChronicleBook
 * - Finds the highest N, creates Chronicle_{N+1}
 * - If no Chronicle_N books exist, creates "Chronicle_1"
 */
async function autoGenerateChronicleBook(userId: string): Promise<{ id: string }> {
  // Use mutex to prevent two concurrent calls from computing the same N
  const key = `chronicle:auto_generate:${userId}`
  const existing = _creationLocks.get(key)
  if (existing) return existing

  const promise = (async () => {
    const { data: books } = await Promise.race([
      spindle.world_books.list({ limit: 200, userId }) as Promise<{ data: WorldBookDTO[]; total: number }>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auto-generate lorebook list timed out')), 10_000)
      ),
    ])
    const allBooks = books as WorldBookDTO[]

    // Match "Chronicle_N" where N is digits — intentionally skips bare "Chronicle"
    const chronicleNumbers = allBooks
      .map((b) => b.name.match(/^Chronicle_(\d+)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => parseInt(m[1], 10))
      .sort((a, b) => a - b)

    const nextN = chronicleNumbers.length > 0 ? chronicleNumbers[chronicleNumbers.length - 1] + 1 : 1
    const bookName = `Chronicle_${nextN}`

    const newBook = await Promise.race([
      spindle.world_books.create(
        { name: bookName, description: `Auto-generated Chronicle lorebook #${nextN}` },
        userId
      ) as Promise<WorldBookDTO>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timed out creating lorebook')), 10_000)
      ),
    ])

    spindle.log.info(`${LOG} Auto-generated Chronicle book: ${bookName} (${newBook.id})`)
    return { id: newBook.id }
  })()

  _creationLocks.set(key, promise)

  // Safety timeout — auto-release lock after 30s if the finally block doesn't run
  const safetyTimeout = setTimeout(() => _creationLocks.delete(key), 30_000)

  try {
    return await promise
  } finally {
    clearTimeout(safetyTimeout)
    _creationLocks.delete(key)
  }
}

/**
 * Find the next chronicle entry number for a world book by parsing
 * existing entry comments for leading numbers (e.g. "01 - Title | ...").
 * Returns "1" if no numbered entries found or listing fails.
 */
async function resolveNextChronicleNumber(
  worldBookId: string,
  userId: string
): Promise<string> {
  try {
    const result = await spindle.world_books.entries.list(worldBookId, {
      limit: 500,
      userId,
    }) as { data: Array<{ comment?: string }>; total: number }

    let maxNum = 0
    for (const entry of result.data) {
      if (!entry.comment) continue
      // Match a number at the start of the comment,
      // optionally followed by " - " (the `{number} - {title}` format separator)
      const match = entry.comment.match(/^(\d+)(?:\s*-)?/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }
    return String(maxNum + 1)
  } catch (err) {
    spindle.log.warn(`${LOG} resolveNextChronicleNumber failed: ${err}`)
    return '1'
  }
}

/**
 * Fetches the most recent entries from the target world book and formats
 * them as compact context for the LLM. Returns empty string on failure or if no entries.
 *
 * The Spindle API returns entries sorted by order_value ASC, id ASC (oldest first).
 * We fetch a generous batch (500), extract scene numbers from comments, sort by
 * scene number descending, and take the top `count` entries.
 */
async function fetchRecentSummaries(
  worldBookId: string,
  userId: string,
  count: number = 3
): Promise<string> {
  try {
    const result = await spindle.world_books.entries.list(worldBookId, {
      limit: 500,
      userId,
    }) as { data: Array<{ comment?: string; content?: string }> }

    if (!result.data.length) return ''

    // Extract scene number from comment, sort descending, take top N
    const withNumbers = result.data
      .map(entry => {
        const numMatch = entry.comment?.match(/^(\d+)(?:\s*-)?/)
        return {
          entry,
          sceneNum: numMatch ? parseInt(numMatch[1], 10) : 0,
        }
      })
      .sort((a, b) => b.sceneNum - a.sceneNum)
      .slice(0, count)

    const summaries = withNumbers.map(({ entry, sceneNum }) => {
      const sceneLabel = sceneNum > 0 ? `Scene ${sceneNum}` : 'Entry'
      const snippet = (entry.content ?? '').slice(0, 200).replace(/\n/g, ' ')
      return `${sceneLabel}: ${snippet}${entry.content && entry.content.length > 200 ? '…' : ''}`
    })

    return `\n\n<> Recent scene summaries (for continuity — the messages above follow these scenes):\n${summaries.map(s => `- ${s}`).join('\n')}`
  } catch (err) {
    spindle.log.warn(`${LOG} fetchRecentSummaries failed: ${err}`)
    return '' // Non-fatal — continue without context
  }
}

async function saveLorebookEntry(
  summary: { title: string; content: string; keys: string[] },
  chatId: string,
  messageIds: string[],
  worldBookId: string | undefined,
  userId: string,
  entrySettings?: Record<string, unknown>,
  titleFormat?: string,
  sceneNumber?: string  // pre-resolved scene number from preview phase
): Promise<{ entryId: string; worldBookId: string }> {
  let targetBookId = worldBookId

  // Handle auto-generate: create Chronicle_N
  if (targetBookId === '__auto_generate__') {
    const book = await autoGenerateChronicleBook(userId)
    targetBookId = book.id
  }

  if (!targetBookId) {
    const book = await getOrCreateChronicleBook(userId)
    targetBookId = book.id
  }

  // Build the entry input from settings (settingsToCreateInput already produces snake_case API keys)
  const entryInput: Record<string, unknown> = { ...(entrySettings || {}) }

  // Use LLM auto-generated keys, or title-based fallback
  entryInput.key = (summary.keys && summary.keys.length > 0)
    ? summary.keys
    : [summary.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 50)]

  // Secondary keys not user-configurable
  entryInput.keysecondary = []

  // Override with actual content from summary
  entryInput.content = summary.content

  // Auto-generate source metadata with optional title format
  // Apply title format template to produce the entry's display name
  let displayName = summary.title
  if (titleFormat) {
    // Resolve {number} if the format uses it — reads existing entries to find n+1
    let resolvedFormat = titleFormat
    if (titleFormat.includes('{number}')) {
      const nextNum = sceneNumber ?? await resolveNextChronicleNumber(targetBookId, userId)
      resolvedFormat = titleFormat.replace(/\{number\}/g, nextNum)
    }
    const now = new Date()
    displayName = resolvedFormat
      .replace(/\{title\}/g, summary.title)
      .replace(/\{date\}/g, now.toLocaleDateString())
      .replace(/\{time\}/g, now.toLocaleTimeString())
  }
  // Use displayName (formatted title) as the leading part of the comment.
  // displayName is either the titleFormat-rendered string or the raw summary.title.
  entryInput.comment = `${displayName} | Chronicle summary | Source: chat ${chatId}, ${messageIds.length} messages | ${new Date().toISOString()}`

  // All remaining fields (key, keysecondary, comment, position, depth, role,
  // order_value, selective, constant, disabled, case_sensitive, match_whole_words,
  // use_regex, use_probability, vectorized, probability, scan_depth, selective_logic,
  // priority, sticky, cooldown, delay, prevent_recursion, exclude_recursion,
  // delay_until_recursion, group_name, group_weight, group_override, automation_id)
  // are valid CreateWorldBookEntryInput fields passed through from settings.

  const entry = await spindle.world_books.entries.create(
    targetBookId,
    entryInput,
    userId
  ) as WorldBookEntryDTO

  return {
    entryId: entry.id,
    worldBookId: targetBookId,
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
