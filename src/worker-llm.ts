/**
 * Chronicle — LLM interaction + prompt building
 * Fetches message content, calls the LLM, and parses responses.
 */

declare const spindle: import('lumiverse-spindle-types').SpindleAPI

import {
  buildSummarizePrompt,
  parseSummaryJson,
  extractContentKeywords,
} from './prompts'
import type { GenerationParams } from './types'

// ── Spindle API Return Types ────────────────────────────────────────

export interface ChatMessageDTO {
  id: string
  chat_id: string
  is_user: boolean
  content: string
  swipes?: unknown[]
  swipe_id?: string
  role?: string
  metadata?: Record<string, unknown>
}

export interface GenerationResponse {
  content: string
  reasoning?: string
  finish_reason: string
  tool_calls?: unknown[]
  usage?: Record<string, unknown>
}

export interface ChatDTO {
  id: string
  character_id?: string
  name?: string
  metadata?: Record<string, unknown>
}

// ── Permission check ────────────────────────────────────────────────

export function checkPermissions(): string | null {
  if (!spindle.permissions.has('generation')) return 'generation'
  if (!spindle.permissions.has('chat_mutation')) return 'chat_mutation'
  if (!spindle.permissions.has('world_books')) return 'world_books'
  if (!spindle.permissions.has('chats')) return 'chats'
  return null
}

// ── Fetch message content ──────────────────────────────────────────

export async function fetchMessageContent(
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

export async function generateSummary(
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
