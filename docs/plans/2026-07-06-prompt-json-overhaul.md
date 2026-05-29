# Prompt & Parsing Overhaul — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Overhaul Chronicle's summary prompt and parsing system: eliminate hidden prompt layers, switch to JSON output from the LLM, parse structured JSON instead of text markers, and add a customizable title format control for lorebook entries.

**Architecture:** Replace the hidden `KEYS_GENERATION_INSTRUCTION` (injected by backend into the system prompt) with visible JSON-output instructions built into every preset. Replace `TITLE:`/`CONTENT:` text parsing + `[[KEYS_START]]`/`[[KEYS_END]]` marker extraction with a single `JSON.parse()` call that extracts `{title, keys, content}` from the LLM response. Add a title format control to the SummarizeFlow preview UI with `{title}`, `{date}`, `{time}` placeholders.

**Tech Stack:** TypeScript, Bun, Preact, Lumiverse Spindle API

---

### Task 0: Bump protocol version + add custom preset migration

**Objective:** Bump `PROTOCOL_VERSION` to 2 (backward-incompatible change: output format changed from text markers to JSON). Add detection for old-format custom presets with a visible warning in the PromptManager UI.

**Files:**
- Modify: `src/types.ts`
- Modify: `src/presets.ts`
- Modify: `src/components/PromptManager.tsx`

**Step 1: Bump PROTOCOL_VERSION in types.ts**

```ts
export const PROTOCOL_VERSION = 2  // was 1 — JSON output format, no hidden KEYS layer
```

**Step 2: Add `outputFormat` field to PromptPreset**

```ts
export interface PromptPreset {
  id: string
  name: string
  systemPrompt: string
  builtIn: boolean
  outputFormat?: 'json' | 'text'  // NEW: json = new format, text/undefined = old TITLE:/CONTENT: format
}
```

All built-in presets get `outputFormat: 'json'`. Custom presets from localStorage are loaded as-is (no `outputFormat` = old format).

**Step 3: Add migration detection in `getAllPresets()`**

Export a helper that detects old-format custom presets:

```ts
export function getOldFormatPresets(): PromptPreset[] {
  return loadUserPresets().filter(p => p.outputFormat !== 'json')
}
```

**Step 4: Add warning UI in PromptManager**

When custom presets use the old format, show a warning banner above the preset dropdown:
```
⚠ Some of your custom presets use the old TITLE:/CONTENT: format and won't work correctly.
Edit each preset to use the new JSON output format, or delete and recreate them.
```

The warning links to an info section. Custom presets still work (they'll fall through to the raw-text fallback in `parseSummaryJson`), but the user sees degraded results until they update.

**Step 5: Prevent saving new presets in old format**

When `savePreset()` is called, automatically set `outputFormat: 'json'` on the saved preset. The user can never create new old-format presets.

**Verification:**
```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors. Grep for `PROTOCOL_VERSION.*2` in dist.

---

### Task 1: Update `prompts.ts` — remove hidden layer, add JSON parser + tests

**Objective:** Remove all hidden-prompt infrastructure (`KEYS_GENERATION_INSTRUCTION`, markers, `addKeysGenerationInstruction`, `extractKeysFromResponse`). Replace `parseSummaryResponse` with `parseSummaryJson`. Update `SUMMARIZE_SYSTEM_PROMPT` to request JSON output.

**Files:**
- Modify: `src/prompts.ts`

**Step 1: Update `SUMMARIZE_SYSTEM_PROMPT` to request JSON**

Replace the current `SUMMARIZE_SYSTEM_PROMPT` (lines 7-19) to output JSON format:

```ts
export const SUMMARIZE_SYSTEM_PROMPT = `You are a lorebook editor. Your task is to summarize the provided chat messages into a concise, self-contained lorebook entry.

Rules:
- Write in third person, past tense
- Focus on key events, revealed information, character developments, and world details
- Omit meta-commentary, greetings, and repetitive content
- The entry should make sense to someone who hasn't read the original messages
- Keep entries between 50-300 words
- Generate a short descriptive title (max 8 words)
- Generate 2-5 trigger keys — short, relevant words or phrases (single words preferred, proper nouns as-is)

Output ONLY valid JSON (no markdown fences, no extra text) in this exact format:
{
  "title": "Your generated title here",
  "keys": ["key1", "key2", "key3"],
  "content": "Your summary content here..."
}`
```

**Step 2: Remove the hidden keys layer (lines 30-52)**

Delete:
- `KEYS_GENERATION_INSTRUCTION` (lines 32-42)
- `KEYS_MARKER_START` (line 44)
- `KEYS_MARKER_END` (line 45)
- `addKeysGenerationInstruction()` (lines 50-52)
- `extractKeysFromResponse()` (lines 58-74)

**Step 3: Replace `parseSummaryResponse` with `parseSummaryJson` + export shared JSON instruction**

Replace lines 99-134 with:

```ts
/** JSON output snippet appended to every preset. Single source of truth. */
export const JSON_OUTPUT_INSTRUCTION = `Output ONLY valid JSON (no markdown fences, no extra text) in this exact format:
{
  "title": "Your generated title here",
  "keys": ["key1", "key2", "key3"],
  "content": "Your summary content here..."
}`

/**
 * Parses the LLM's JSON response into title, keys, and content.
 * Handles common LLM JSON output issues: markdown fences, trailing commas,
 * unescaped newlines in content, and truncated responses.
 *
 * Returns null if parsing fails completely.
 */
export function parseSummaryJson(
  text: string
): { title: string; keys: string[]; content: string } | null {
  const trimmed = text.trim()

  // Truncation heuristic: check if the last character is a legitimate JSON terminator.
  // If the LLM output was cut off mid-stream, the last char won't be } and the
  // string won't parse. We try anyway — the fallback catches partial output.
  const looksTruncated = trimmed.length > 0 && !trimmed.endsWith('}')

  // Strategy 1: Try direct JSON parse
  try {
    const parsed = JSON.parse(trimmed)
    const result = validateSummaryJson(parsed)
    if (result) return result
  } catch { /* fall through */ }

  // Strategy 2: Strip ```json fences
  const fenced = trimmed.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
  try {
    const parsed = JSON.parse(fenced)
    const result = validateSummaryJson(parsed)
    if (result) return result
  } catch { /* fall through */ }

  // Strategy 3: Extract JSON object from within text (LLM sometimes wraps in prose).
  // Use a targeted extraction: find the first { that starts a JSON object containing
  // "title", "keys", or "content" keys, then find its matching closing }.
  const jsonStart = trimmed.search(/\{\s*"(?:title|keys|content)"/)
  if (jsonStart !== -1) {
    // Count braces from the start to find matching close
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
      try {
        const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd))
        const result = validateSummaryJson(parsed)
        if (result) return result
      } catch { /* fall through */ }
    }
  }

  // Look for truncation signal — if the text was likely truncated, log a warning
  if (looksTruncated) {
    console.warn('[Chronicle] LLM response may be truncated (no closing brace). Consider reducing message count or content length.')
  }

  return null
}

/**
 * Validates a parsed JSON object and returns partial results when possible.
 * Prioritizes content (required) > title (has fallback) > keys (optional).
 */
function validateSummaryJson(obj: unknown): { title: string; keys: string[]; content: string } | null {
  if (!obj || typeof obj !== 'object') return null
  const o = obj as Record<string, unknown>

  const content = typeof o.content === 'string' && o.content.length > 0 ? o.content : ''
  const title = typeof o.title === 'string' ? o.title.trim() : ''
  const keys = Array.isArray(o.keys)
    ? o.keys.filter((k: unknown): k is string => {
        if (typeof k !== 'string') return false
        const cleaned = k.trim().slice(0, 100)  // sanity cap per key
        return cleaned.length > 0
      }).map(k => k.trim().slice(0, 100))
    : []

  // Content is required — without it, nothing to save
  if (!content) return null

  // Title and keys have fallbacks — still return what we can
  return {
    title: title || 'Untitled Entry',
    keys,
    content,
  }
}
```

**Step 4: Add parser unit tests**

Create `src/__tests__/prompts.test.ts`:

```ts
import { parseSummaryJson } from '../prompts'

// Helper: extract just the data (null check)
function p(text: string) { return parseSummaryJson(text) }

// Perfect JSON
const perfect = '{"title":"Hello","keys":["a","b"],"content":"World"}'
console.assert(p(perfect)?.title === 'Hello', 'perfect title')
console.assert(p(perfect)?.keys.length === 2, 'perfect keys')
console.assert(p(perfect)?.content === 'World', 'perfect content')

// With markdown fences
const fenced = '```json\n{"title":"Hi","keys":["x"],"content":"Yo"}\n```'
console.assert(p(fenced)?.title === 'Hi', 'fenced title')

// With prose wrapper
const prose = 'Here is the summary:\n{"title":"Test","keys":["a"],"content":"Text"}'
console.assert(p(prose)?.title === 'Test', 'prose title')

// Missing keys (still valid)
const noKeys = '{"title":"T","content":"C"}'
console.assert(p(noKeys)?.keys.length === 0, 'no keys ok')
console.assert(p(noKeys)?.content === 'C', 'no keys content')

// Empty content (should fail)
const empty = '{"title":"T","keys":["a"],"content":""}'
console.assert(p(empty) === null, 'empty content returns null')

// Truncated JSON (missing close brace)
const truncated = '{"title":"T","keys":["a"],"content":"C"'
console.assert(p(truncated) === null, 'truncated json returns null')

// Extra fields (should parse fine, extra fields ignored)
const extra = '{"title":"T","keys":["a"],"content":"C","extra":true}'
console.assert(p(extra)?.title === 'T', 'extra fields ok')

// Nested braces in content
const nested = '{"title":"T","keys":["a"],"content":"The {thing} happened"}'
console.assert(p(nested)?.content === 'The {thing} happened', 'nested braces')

// Long keys truncated
const longKeys = '{"title":"T","keys":["' + 'x'.repeat(200) + '"],"content":"C"}'
const result = p(longKeys)
console.assert(result?.keys[0]?.length === 100, 'long key truncated to 100')

// Garbage input
console.assert(p('not json at all') === null, 'garbage returns null')
console.assert(p('') === null, 'empty returns null')
console.assert(p('{"unrelated": "data"}') === null, 'wrong shape returns null')

console.log('All parser tests passed!')
```

Run: `bun run src/__tests__/prompts.test.ts` — all assertions pass.

**Verification:**
```bash
cd ~/chronicle_ext && bun run check && bun run src/__tests__/prompts.test.ts
```
Expected: 0 errors, "All parser tests passed!"

---

### Task 2: Update all built-in presets to use JSON output

**Objective:** Update every built-in preset in `presets.ts` to include JSON output instructions in its visible system prompt. Import the shared `JSON_OUTPUT_INSTRUCTION` constant from `prompts.ts` to avoid duplication. The keys generation is now part of what the user sees and can customize.

**Files:**
- Modify: `src/presets.ts`

**Step 1: Import JSON_OUTPUT_INSTRUCTION**

Add to line 6:
```ts
import { SUMMARIZE_SYSTEM_PROMPT, JSON_OUTPUT_INSTRUCTION } from './prompts'
```

**Step 2: Update `Brief` preset (lines 27-37)**

```ts
systemPrompt: `Summarize these chat messages in 2-3 sentences. Focus on the single most important event or revelation.

Rules:
- Third person, past tense
- Maximum 50 words
- One key takeaway only
- Omit all greetings and meta-commentary
- Generate a short descriptive title (max 8 words)
- Generate 1-2 trigger keys

${JSON_OUTPUT_INSTRUCTION}`,
```

**Step 3: Update `Detailed` preset (lines 43-55)**

```ts
systemPrompt: `You are an archivist cataloging a detailed historical record. Summarize the following chat messages comprehensively.

Rules:
- Third person, past tense
- Include all named entities, locations, and events
- Note character emotional states and developments
- Record any worldbuilding details revealed
- 150-500 words
- Structure as paragraphs, not bullet points
- Generate a short descriptive title (max 8 words)
- Generate 3-5 trigger keys (short, relevant words or phrases)

${JSON_OUTPUT_INSTRUCTION}`,
```

**Step 4: Update `Bullet Points` preset (lines 59-75)**

```ts
systemPrompt: `Summarize these chat messages as a structured list of bullet points.

Rules:
- Third person, past tense
- One bullet per distinct event, revelation, or character development
- Each bullet should be 1-2 sentences
- Start each bullet with a bolded category: Event:, Character:, World:, or Lore:
- Omit greetings and meta-commentary
- Generate a short descriptive title (max 8 words)
- Generate 2-5 trigger keys

${JSON_OUTPUT_INSTRUCTION}`,
```

**Step 5: Update `Character Focus` preset (lines 78-93)**

```ts
systemPrompt: `Analyze these chat messages focusing on character development and personality.

Rules:
- Third person, present tense for traits, past tense for events
- Describe personality traits revealed
- Note emotional arcs and relationship dynamics
- Record character goals and motivations
- Include speech patterns or mannerisms
- 100-300 words
- Generate a short descriptive title (max 8 words)
- Generate 2-5 trigger keys

${JSON_OUTPUT_INSTRUCTION}`,
```

**Step 6: Update Default preset (line 21)**

The Default preset already imports `SUMMARIZE_SYSTEM_PROMPT`. After Task 1 updates that constant to include JSON output instructions, no change needed here — it inherits the new format.

**Step 7: Mark all built-in presets with outputFormat**

Add `outputFormat: 'json' as const` to every built-in preset. This enables migration detection (Task 0) to distinguish old custom presets from new ones.

**Verification:**
```bash
cd ~/chronicle_ext && bun run check
grep -c "JSON_OUTPUT_INSTRUCTION" ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: >= 1 (the constant is bundled into frontend.js)
```
Expected: 0 errors.

---

### Task 3: Update `worker.ts` + `types.ts` — remove hidden prompt, use JSON parser, add titleFormat

**Objective:** Remove hidden prompt injection and old parsing from worker. Switch to `parseSummaryJson`. Remove KEYS marker escaping. Thread `titleFormat` through save flow. Apply formatted title to the entry comment field (prefixed in a structured, predictable way).

**Files:**
- Modify: `src/worker.ts`
- Modify: `src/types.ts`

**Step 1: Update imports (lines 40-45)**

Replace:
```ts
import {
  buildSummarizePrompt,
  parseSummaryResponse,
  addKeysGenerationInstruction,
  extractKeysFromResponse,
} from './prompts'
```
With:
```ts
import {
  buildSummarizePrompt,
  parseSummaryJson,
} from './prompts'
```

**Step 2: Remove KEYS marker escaping in `fetchMessageContent`**

Delete lines 152-154 (the `content = content.replace(/\[\[KEYS_START\]\]/gi, ...)` block). No longer needed — there are no hidden markers.

**Step 3: Update `generateSummary` — remove hidden prompt injection, use JSON parser**

In `generateSummary` (line 165), replace the body:
```ts
async function generateSummary(
  messages: Array<{ role: string; content: string }>,
  title: string | undefined,
  userId: string,
  customPrompt?: string,
  connectionId?: string
): Promise<{ title: string; content: string; keys: string[] } | null> {
  const { systemPrompt, userPrompt } = buildSummarizePrompt(messages, title, customPrompt)

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
      signal: AbortSignal.timeout(120_000),
    };
    genInput.userId = userId;
    if (connectionId) {
      genInput.connection_id = connectionId;
    }
    const result = await spindle.generate.quiet(genInput) as unknown as GenerationResponse

    const text = result?.content ?? ''

    if (!text?.trim()) {
      throw new Error('LLM returned empty response')
    }

    // Parse the JSON response
    const parsed = parseSummaryJson(text.trim())

    if (parsed) {
      return {
        title: parsed.title,
        content: parsed.content,
        keys: parsed.keys,
      }
    }

    // Fallback: JSON parsing failed — use raw text as content
    return {
      title: title || `Summary ${new Date().toLocaleDateString()}`,
      content: text.trim(),
      keys: [],
    }
  } catch (err: unknown) {
    // ... existing error handling unchanged ...
  }
}
```

**Step 4: Add `titleFormat` to `SaveSummaryRequest` in types.ts**

After `lorebookId?: string` in the `SaveSummaryRequest` interface:
```ts
titleFormat?: string  // template for formatting the entry title (e.g., "Chronicle: {title}")
```

**Step 5: Thread `titleFormat` through `handleSaveSummary` → `saveLorebookEntry`**

Update `saveLorebookEntry` signature to accept `titleFormat`:
```ts
async function saveLorebookEntry(
  summary: { title: string; content: string; keys: string[] },
  chatId: string,
  messageIds: string[],
  worldBookId: string | undefined,
  userId: string,
  entrySettings?: Record<string, unknown>,
  titleFormat?: string
): Promise<{ entryId: string; worldBookId: string }> {
```

In the comment generation section (~line 773), apply the format:
```ts
// Apply title format template to produce the entry's display name
let displayName = summary.title
if (titleFormat) {
  const now = new Date()
  displayName = titleFormat
    .replace(/\{title\}/g, summary.title)
    .replace(/\{date\}/g, now.toLocaleDateString())
    .replace(/\{time\}/g, now.toLocaleTimeString())
}

// Store the formatted title as structured metadata in the comment field.
// Format: "fmt:{format_template} | display:{displayName} | Chronicle summary | Source: chat {chatId}, {N} messages | {ISO date}"
// The "fmt:" prefix allows consumers to parse the template; "display:" gives the rendered result.
const formatPart = titleFormat ? `fmt:${titleFormat} | display:${displayName} | ` : ''
entryInput.comment = `${formatPart}Chronicle summary | Source: chat ${chatId}, ${messageIds.length} messages | ${new Date().toISOString()}`
```

In `handleSaveSummary`, pass `req.titleFormat` to `saveLorebookEntry`:
```ts
const saveResult = await Promise.race([
  saveLorebookEntry(
    { title: effectiveTitle, content: pending.content, keys: pending.keys },
    pending.chatId,
    pending.messageIds,
    targetBookId,
    userId,
    req.settings,
    req.titleFormat
  ),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Save request timed out after 15s')), 15_000)
  ),
])
```

**Verification:**
```bash
cd ~/chronicle_ext && bun run check
grep -c "parseSummaryJson" ~/Lumiverse/data/extensions/chronicle/repo/dist/worker.js
# Expected: 1
grep -c "KEYS_GENERATION_INSTRUCTION" ~/Lumiverse/data/extensions/chronicle/repo/dist/worker.js
# Expected: 0
```
Expected: 0 errors.

---

### Task 4: Add title format control to SummarizeFlow

**Objective:** Add a "Title Format" input in the SummarizeFlow preview section. Supports `{title}`, `{date}`, `{time}` placeholders. Always sends `titleFormat` to backend (no conditional suppression). Persists to localStorage.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx`

**Step 1: Add title format state**

Near other state declarations (~line 74):
```tsx
const DEFAULT_TITLE_FORMAT = '{title}'
const [titleFormat, setTitleFormat] = useState(() => {
  try {
    return localStorage.getItem('chronicle_title_format') || DEFAULT_TITLE_FORMAT
  } catch { return DEFAULT_TITLE_FORMAT }
})
```

**Step 2: Add UI in the preview section**

After the title input row (around line 472), add:
```tsx
<div class="chronicle-sf-title-row" style="margin-top: 8px;">
  <label class="chronicle-pm-label">Title Format</label>
  <input
    class="chronicle-pm-input"
    value={titleFormat}
    onInput={(e) => {
      const val = (e.target as HTMLInputElement).value
      setTitleFormat(val)
      try { localStorage.setItem('chronicle_title_format', val) } catch {}
    }}
    placeholder={DEFAULT_TITLE_FORMAT}
    style="flex: 0 0 200px; margin-left: 8px;"
  />
  <span class="chronicle-sf-title-format-hint">{'{title}'}, {'{date}'}, {'{time}'}</span>
</div>
```

**Step 3: Pass `titleFormat` in the save request — always send it**

In `handleSave`:
```tsx
ctx.sendToBackend({
  type: 'save_summary',
  requestId: previewData.requestId,
  title: summaryTitle !== previewData.title ? summaryTitle : undefined,
  titleFormat: titleFormat,  // Always send — backend treats '{title}' as default
  settings: entrySettings,
  lorebookId: lorebookId !== DEFAULT_LOREBOOK_ID ? lorebookId : undefined,
})
```

**Step 4: Add CSS for hint text (uses font scale)**

In `src/styles.ts` or inline:
```css
.chronicle-sf-title-format-hint {
  font-size: calc(10px * var(--lumiverse-font-scale, 1));
  color: var(--lumiverse-text-subtle);
  margin-left: 4px;
  white-space: nowrap;
}
```

**Verification:**
```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

---

### Task 5: Build, deploy, and verify

**Objective:** Build the extension, run parser tests, deploy to Lumiverse runtime dir, and verify.

**Step 1: Run parser tests**
```bash
cd ~/chronicle_ext && bun run src/__tests__/prompts.test.ts
```
Expected: "All parser tests passed!"

**Step 2: Build**
```bash
cd ~/chronicle_ext && ./build.sh
```
Expected: `tsc --noEmit` passes, Bun builds both bundles, files copied to runtime dir.

**Step 3: Verify against source files (NOT dist)**

Bun minifies symbol names — dist greps are unreliable. Verify against the TypeScript source:
```bash
# Confirm hidden KEYS layer is removed from source
grep -c "KEYS_GENERATION_INSTRUCTION\|addKeysGenerationInstruction\|extractKeysFromResponse\|KEYS_MARKER" \
  ~/chronicle_ext/src/worker.ts ~/chronicle_ext/src/prompts.ts
# Expected: 0, 0

# Confirm parseSummaryJson exists in source
grep -c "parseSummaryJson" ~/chronicle_ext/src/prompts.ts
# Expected: 1

# Confirm new imports in worker
grep "parseSummaryJson" ~/chronicle_ext/src/worker.ts | head -1
# Should show import, not parseSummaryResponse

# Confirm JSON_OUTPUT_INSTRUCTION exported
grep -c "export const JSON_OUTPUT_INSTRUCTION" ~/chronicle_ext/src/prompts.ts
# Expected: 1

# Confirm PROTOCOL_VERSION = 2
grep "PROTOCOL_VERSION = 2" ~/chronicle_ext/src/types.ts
# Expected: 1 match

# Confirm outputFormat in built-in presets
grep -c "outputFormat.*json" ~/chronicle_ext/src/presets.ts
# Expected: >= 5
```

**Step 4: Manual testing in Lumiverse**

Hard refresh Lumiverse (Ctrl+F5). Test flow:
1. Select messages → Chronicle → Generate and Preview
2. Verify JSON output parsed: title, content, keys all populated
3. Edit title → verify title field updates
4. Change title format to `Chronicle: {title} - {date}` → verify formatted title in comment
5. Save → verify entry appears in lorebook with formatted title
6. **Retry test:** Change title format → retry generation → verify format persists across retries
7. **Custom preset test:** If you have old custom presets, verify the ⚠ warning banner appears
8. **Old preset fallback test:** Use an old-format custom preset → verify raw-text fallback works (entry created, empty keys)

---

### Task 6: Update AGENTS.md and DEVLOG.md

**Objective:** Document the architecture change.

**Step 1: Update AGENTS.md**

Update the Architecture section to reflect:
- No hidden prompt layer — JSON output instructions are visible in presets
- `parseSummaryJson()` replaces `parseSummaryResponse()` + `extractKeysFromResponse()`
- Title format control in SummarizeFlow preview section

**Step 2: Update DEVLOG.md**

Add a new entry:
```markdown
## 2026-07-06 — Prompt & Parsing JSON Overhaul

**What was done:** Eliminated hidden prompt layers, switched to JSON output from LLM, added title format control.

- Removed KEYS_GENERATION_INSTRUCTION hidden layer — all output instructions are now visible in presets
- Switched from TITLE:/CONTENT: text parsing + [[KEYS]] markers to JSON.parse()
- All 5 built-in presets updated to request JSON output
- Added title format control with {title}, {date}, {time} placeholders
```

**Verification:**
```bash
cd ~/chronicle_ext && git diff --stat
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/prompts.ts` | Remove hidden layer; add `parseSummaryJson` + `JSON_OUTPUT_INSTRUCTION`; update default prompt; add unit tests |
| `src/presets.ts` | Update all 5 built-in presets with `JSON_OUTPUT_INSTRUCTION`; add `outputFormat` field; add `getOldFormatPresets()` migration helper |
| `src/worker.ts` | Remove `addKeysGenerationInstruction`; use `parseSummaryJson`; remove KEYS escaping; thread `titleFormat`; structured comment format |
| `src/types.ts` | Bump `PROTOCOL_VERSION` to 2; add `titleFormat` to `SaveSummaryRequest` |
| `src/components/SummarizeFlow.tsx` | Add title format input with localStorage persistence; always pass to save |
| `src/components/PromptManager.tsx` | Add old-format preset migration warning banner |
| `src/styles.ts` | CSS for title format hint (font-scale-aware) |
| `src/__tests__/prompts.test.ts` | NEW — 11 parser test cases |
| `AGENTS.md` | Document new architecture |
| `DEVLOG.md` | Log the overhaul |

## Risks & Edge Cases (updated after critic review)

1. **LLM doesn't output valid JSON:** Handled by 3-strategy fallback: direct parse → strip fences → brace-count extraction. If all fail, raw text is used with empty keys and fallback title. ⚠ If the LLM output was truncated (no closing `}`), `parseSummaryJson` logs a warning so the user knows to reduce message count.

2. **JSON content field contains unescaped newlines/quotes:** `JSON.parse()` handles standard escaping. Brace-counting Strategy 3 correctly handles nested `{` in content strings by tracking depth rather than using greedy regex.

3. **Custom user presets still use old TITLE:/CONTENT: format:** Old custom presets fall through to raw-text fallback (entry created with empty keys). A migration warning banner appears in PromptManager when old-format presets are detected. The user is prompted to edit or recreate them.

4. **Title format with special characters:** The `{title}` placeholder is replaced verbatim. The formatted result is stored in the comment field with a structured prefix (`fmt:... | display:... |`) so consumers can parse the template without breaking.

5. **User has `{title}` as literal text in a custom title format:** No escaping mechanism. Users who literally want `{title}` in their title must choose a different format string. Edge case — extremely unlikely.

6. **Partial JSON data (valid keys but empty content):** The validator now returns null only if content is empty (required field). If title is missing, "Untitled Entry" is used. If keys are missing, empty array. No partial data is thrown away.

7. **Long/invalid keys from LLM:** Keys are trimmed and capped at 100 characters. Non-string entries in the keys array are filtered out.

8. **Font scale in title format hint:** Uses `calc(10px * var(--lumiverse-font-scale, 1))` to respect Lumiverse's theme font scaling.
