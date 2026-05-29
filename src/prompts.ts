/**
 * Chronicle — Summarization prompt templates + JSON parser.
 */

// ── Prompt Templates ────────────────────────────────────────────────

export const SUMMARIZE_SYSTEM_PROMPT = `<> Your task: Analyze the given story/roleplay and return a past-tense summary/breakdown in JSON format. The JSON must include three fields: title, content, and keywords. The JSON should be your only output.

<> Title field instructions:
Choose a short, unique, descriptive title that fits with the tone and theme of the story.

<> Content field instructions:
1. Begin the content field with "# Scene Summary {number} - {title}".
2. If relevant and possible, note the timeframe of the scene and 1-3 major locations involved
3. In the first group of bullet points (what happened): narrate 5-10 key highlights, details, or moments that meaningfully affected character development and memories. Carefully consider the natural memory formation of each character in the scene. OOC conversation is not useful here and should be ignored and excluded.
4. In the second group of bullet points (memorable quotes): capture 5-10 interesting or important character quotes/speech/thoughts, labeled by character name in parenthesis.

Complete example for content field:
    # Scene Summary 14 - Ashes Between Them

    > Locations: Helios Research Station, Observation Deck, Crew Quarters
    > Timeframe: Late night through early morning. During the final week before evacuation.
    > What happened:
    - Selene's growing frustration with the station leadership finally gave way to open distrust after she discovered the evacuation plans had been falsified.
    - Mirek struggled with guilt over previous command decisions and quietly admitted he no longer believed he deserved the crew's loyalty.
    - Jun's exhaustion and fear became more visible as he pushed himself to repair the transmitter, revealing how deeply he feared being abandoned again.
    - A tense confrontation in the observation deck forced the group to acknowledge long-buried resentment surrounding the failed rescue mission months earlier.
    - Despite the conflict, the survivors gradually began relying on one another more honestly, with several characters dropping defensive facades they had maintained since arriving on the station.
    - Director Vale's refusal to apologize revealed that his need for control mattered more to him than the crew's trust, permanently damaging his relationship with the others.

    > Memorable quotes:
    - (Selene) "You kept asking us to trust you while hiding everything that mattered!"
    - (Mirek) "Maybe I stopped acting like a captain a long time ago."
    - (Jun) "I'm tired of pretending I'm not scared all the time."
    - (Director Vale) "Leadership means carrying decisions nobody else can survive making."

<> Keyword field instructions (CRITICAL):
You MUST provide 15-30 specific, descriptive, relevant keywords that would help a vectorized database find this entry again if mentioned or alluded to. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names. Prioritize one-word keywords over phrases or word pairs. NEVER return an empty keys array — you must always generate at least 10 keywords.

Return ONLY the JSON, no other text. ALL THREE FIELDS (title, content, keywords) are REQUIRED — never omit or leave any field empty.`

export const SUMMARIZE_USER_PROMPT = `Title: {{TITLE}}

Messages to summarize:
---
{{MESSAGES}}
---

Generate a lorebook entry from these messages.`

// ── Builder ─────────────────────────────────────────────────────────

export function buildSummarizePrompt(
  messages: Array<{ role: string; content: string }>,
  title?: string,
  systemPromptOverride?: string,  // overrides default system prompt
  sceneNumber?: string,            // replaces {number} in the prompt (default or custom)
  recentContext?: string           // appended as context (empty string = skip)
): { systemPrompt: string; userPrompt: string } {
  let effectiveSystem = systemPromptOverride?.trim() || SUMMARIZE_SYSTEM_PROMPT

  // Replace {number} unconditionally — works for both default and custom prompts.
  // If the placeholder isn't present, the regex is a no-op.
  if (sceneNumber) {
    effectiveSystem = effectiveSystem.replace(/\{number\}/g, sceneNumber)
  }

  // Append recent context if provided
  if (recentContext) {
    effectiveSystem += recentContext
  }

  const formatted = messages
    .map((m, i) => `[${i + 1}] ${m.role}: ${m.content}`)
    .join('\n\n')

  const userPrompt = SUMMARIZE_USER_PROMPT.replace(
    '{{TITLE}}',
    title || '(generate a title)'
  ).replace('{{MESSAGES}}', formatted)

  return {
    systemPrompt: effectiveSystem,
    userPrompt,
  }
}

// ── JSON Sanitizer ──────────────────────────────────────────────────

/**
 * Prepares LLM-generated JSON text for parsing by fixing common quirks
 * in a single string-boundary-aware pass.
 *
 * Inside JSON strings (tracked with backslash-escape awareness):
 *   - Escapes literal control characters (\n → \\n, \r → \\r, \t → \\t, etc.)
 *
 * Outside JSON strings:
 *   - Strips trailing commas before } and ] (e.g., {"a": 1,} → {"a": 1})
 *
 * This unified approach avoids the bug where regex-based sanitizeJson()
 * could match ,} or ,] patterns inside string content.
 */
export function sanitizeJsonForParse(text: string): string {
  let result = ''
  let inString = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]

    // Backslash escape: preserve the backslash + next char, even inside strings.
    // This passes through existing escape sequences like \n, \", \\, \t unchanged.
    if (ch === '\\') {
      result += ch
      i++
      if (i < text.length) {
        result += text[i]
        i++
      }
      continue
    }

    // Double quote: toggle string state (only if not escaped)
    if (ch === '"') {
      inString = !inString
      result += ch
      i++
      continue
    }

    if (inString) {
      // Inside a string: escape control characters that are illegal in JSON.
      // Common ones get named escapes; others get \u00xx.
      if (ch === '\n') {
        result += '\\n'
        i++
        continue
      }
      if (ch === '\r') {
        result += '\\r'
        // If \r\n pair, treat as single escaped newline
        if (i + 1 < text.length && text[i + 1] === '\n') {
          i++
          result += '\\n'
        }
        i++
        continue
      }
      if (ch === '\t') {
        result += '\\t'
        i++
        continue
      }
      if (ch === '\b') {
        result += '\\b'
        i++
        continue
      }
      if (ch === '\f') {
        result += '\\f'
        i++
        continue
      }
      // Catch-all for other control chars (0x00-0x1F): \u00xx
      const code = ch.charCodeAt(0)
      if (code < 0x20) {
        result += '\\u' + code.toString(16).padStart(4, '0')
        i++
        continue
      }
    } else {
      // Outside strings: strip trailing commas before } and ]
      if (ch === ',') {
        let j = i + 1
        while (j < text.length && (text[j] === ' ' || text[j] === '\t' || text[j] === '\n' || text[j] === '\r')) {
          j++
        }
        if (j < text.length && (text[j] === '}' || text[j] === ']')) {
          // Skip the comma and its trailing whitespace — brace/bracket will be picked up next iteration
          i = j
          continue
        }
      }
    }

    result += ch
    i++
  }

  return result
}

// ── Fallback Key Extraction ───────────────────────────────────────────

const KEYWORD_STOP_WORDS = new Set([
  'this', 'that', 'with', 'from', 'were', 'they', 'have', 'been', 'what',
  'when', 'where', 'which', 'their', 'about', 'would', 'could', 'into',
  'over', 'after', 'before', 'between', 'under', 'while', 'there', 'said',
  'very', 'just', 'than', 'then', 'also', 'more', 'some', 'these', 'those',
  'should', 'because', 'without', 'through', 'against', 'during', 'still',
  'might', 'down', 'back', 'being', 'made', 'much', 'each', 'other',
  'before', 'after', 'above', 'below', 'upon', 'across', 'along', 'among',
  'around', 'behind', 'beneath', 'beside', 'beyond', 'inside', 'outside',
  'beneath', 'within', 'without', 'little', 'enough', 'every', 'almost',
  'quite', 'rather', 'already', 'however', 'though', 'either', 'neither',
  'whether', 'whatever', 'whoever', 'whomever', 'whose', 'whom', 'who',
  'which', 'that', 'these', 'those',
])

/**
 * Extracts significant keywords from summary content as a fallback
 * when the LLM returns no keys. Uses word frequency + length/stop-word filtering.
 * Returns up to 20 single words sorted by frequency.
 */
export function extractContentKeywords(content: string, title: string): string[] {
  const text = `${title} ${content}`.toLowerCase()

  // Split into words
  const words = text
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && w.length <= 30)
    .filter(w => !KEYWORD_STOP_WORDS.has(w))

  // Count frequency
  const freq = new Map<string, number>()
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1)
  }

  // Sort by frequency desc, length desc (prefer longer/more specific words),
  // then alphabetically for determinism
  return [...freq.entries()]
    .sort((a, b) => {
      const freqDiff = b[1] - a[1]
      if (freqDiff !== 0) return freqDiff
      const lenDiff = b[0].length - a[0].length
      if (lenDiff !== 0) return lenDiff
      return a[0].localeCompare(b[0])
    })
    .slice(0, 20)
    .map(([word]) => word)
}

/**
 * Try to parse a string as summary JSON.
 * Applies sanitizeJsonForParse before JSON.parse to handle LLM quirks
 * like trailing commas and unescaped control characters in strings.
 * Returns the validated result or null.
 */
function tryParseSummaryJson(raw: string): { title: string; keys: string[]; content: string } | null {
  try {
    const cleaned = sanitizeJsonForParse(raw)
    const parsed = JSON.parse(cleaned)
    return validateSummaryJson(parsed)
  } catch {
    return null
  }
}

// ── JSON Parser ─────────────────────────────────────────────────────

/**
 * Parses the LLM's JSON response into title, keys, and content.
 * Handles common LLM JSON output issues: markdown fences, trailing commas,
 * unescaped newlines in content, and truncated responses.
 *
 * Returns null if parsing fails completely (no valid content).
 */
export function parseSummaryJson(
  text: string
): { title: string; keys: string[]; content: string } | null {
  const trimmed = text.trim()

  // Truncation heuristic: if the output was cut off mid-stream,
  // the last char won't be a closing brace.
  const looksTruncated = trimmed.length > 0 && !trimmed.endsWith('}')

  // Strategy 1: Try direct JSON parse (with sanitization)
  const result1 = tryParseSummaryJson(trimmed)
  if (result1) return result1

  // Strategy 2: Strip ```json fences then parse (with sanitization)
  const fenced = trimmed.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
  const result2 = tryParseSummaryJson(fenced)
  if (result2) return result2

  // Strategy 3: Extract JSON object from within text (LLM sometimes wraps in prose).
  // Find the first { that starts a JSON object containing "title", "keys", "keywords", or "content",
  // then track brace depth to find the matching closing }.
  const jsonStart = trimmed.search(/\{\s*"(?:title|keys|keywords|key|tags|keyword_list|keywords_list|content)"/)
  if (jsonStart !== -1) {
    let depth = 0
    let jsonEnd = -1
    for (let i = jsonStart; i < trimmed.length; i++) {
      if (trimmed[i] === '{') depth++
      else if (trimmed[i] === '}') {
        depth--
        if (depth === 0) {
          jsonEnd = i + 1
          break
        }
      }
    }
    if (jsonEnd > jsonStart) {
      const result3 = tryParseSummaryJson(trimmed.slice(jsonStart, jsonEnd))
      if (result3) return result3
    }
  }

  // Strategy 4: Inline brace-matching — find "content" field, scan backwards for {,
  // then forward for matching }. Handles malformed JSON where brace-extraction missed.
  const contentKeyMatch = trimmed.match(/"content"\s*:\s*"/)
  if (contentKeyMatch && contentKeyMatch.index !== undefined) {
    let braceStart = -1
    let inStr = false
    for (let k = 0; k < contentKeyMatch.index; k++) {
      if (trimmed[k] === '\\') { k++; continue }
      if (trimmed[k] === '"') { inStr = !inStr; continue }
      if (!inStr && trimmed[k] === '{') { braceStart = k }
    }
    if (braceStart !== -1) {
      let depth = 0
      let braceEnd = -1
      for (let i = braceStart; i < trimmed.length; i++) {
        if (trimmed[i] === '{') depth++
        else if (trimmed[i] === '}') {
          depth--
          if (depth === 0) { braceEnd = i + 1; break }
        }
      }
      if (braceEnd > braceStart) {
        const result4 = tryParseSummaryJson(trimmed.slice(braceStart, braceEnd))
        if (result4) return result4
      }
    }
  }

  // Strategy 5: Content-field string scan — extract the value of "content" from
  // any JSON-like text by tracking backslash escapes to find the matching closing quote.
  if (contentKeyMatch && contentKeyMatch.index !== undefined) {
    const start = contentKeyMatch.index + contentKeyMatch[0].length
    let j = start
    while (j < trimmed.length) {
      if (trimmed[j] === '\\') { j += 2; continue }
      if (trimmed[j] === '"') {
        let prose = trimmed.slice(start, j)
          .replace(/\\n/g, '\n').replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          .trim()
        if (prose) {
          const titleMatch = trimmed.match(/"title"\s*:\s*"([^"]*)"/)
          return {
            title: titleMatch?.[1] || 'Untitled Entry',
            keys: extractContentKeywords(prose, titleMatch?.[1] || ''),
            content: prose,
          }
        }
        break
      }
      j++
    }
  }

  // Truncation signal
  if (looksTruncated) {
    console.warn('[Chronicle] LLM response may be truncated (no closing brace).')
  }

  return null
}

/**
 * Validates a parsed JSON object and returns partial results when possible.
 * Prioritizes: content (required) > title (has fallback) > keys (optional).
 */
function validateSummaryJson(obj: unknown): { title: string; keys: string[]; content: string } | null {
  if (!obj || typeof obj !== 'object') return null
  const o = obj as Record<string, unknown>

  const content = typeof o.content === 'string' && o.content.length > 0 ? o.content : ''
  const title = typeof o.title === 'string' ? o.title.trim() : ''
  // Accept multiple field name variants — different LLMs/providers use different names.
  const rawKeys = o.keys ?? o.keywords ?? o.key ?? o.tags ?? o.keyword_list ?? o.keywords_list
  const keys = Array.isArray(rawKeys)
    ? rawKeys.filter((k: unknown): k is string => {
        if (typeof k !== 'string') return false
        const cleaned = k.trim().slice(0, 100)
        return cleaned.length > 0
      }).map(k => k.trim().slice(0, 100))
    : []

  // Content is required — without it, nothing to save
  if (!content) return null

  return {
    title: title || 'Untitled Entry',
    keys,
    content,
  }
}

// ── Old-format parser (kept for reference, no longer used by default) ─

/**
 * Parses the old TITLE:/CONTENT: text format.
 * Kept for reference; not used by the default flow (parseSummaryJson is preferred).
 */
export function parseSummaryResponse(
  text: string
): { title: string; content: string } | null {
  const lines = text.split('\n')

  let lastTitleIdx = -1
  let lastContentIdx = -1

  for (let i = 0; i < lines.length; i++) {
    const upperLine = lines[i].toLocaleUpperCase()
    if (upperLine.startsWith('TITLE:')) {
      lastTitleIdx = i
    }
    if (upperLine.startsWith('CONTENT:')) {
      lastContentIdx = i
    }
  }

  if (lastContentIdx === -1) return null

  const titleLine = lastTitleIdx >= 0
    ? lines[lastTitleIdx].slice(6).trim()
    : null

  const content = lines.slice(lastContentIdx + 1).join('\n').trim()

  if (!content) return null

  return {
    title: titleLine || 'Untitled Entry',
    content,
  }
}
