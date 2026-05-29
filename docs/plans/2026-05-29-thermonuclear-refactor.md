# Chronicle Extension — Thermo-Nuclear Refactor Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Eliminate structural debt from the Chronicle extension — split the `worker.ts` monolith, consolidate duplicated parsing logic, deduplicate near-identical functions, and extract shared patterns into reusable abstractions. All changes preserve existing behavior.

**Architecture:** The refactor is split into 4 phases, ordered by impact and dependency. Phase 1 consolidates the JSON parsing chain (highest impact per line changed). Phase 2 splits `worker.ts` into focused modules. Phase 3 deduplicates `main.tsx` modal openers and the two world-book creation functions. Phase 4 extracts shared preset-manager patterns. Each phase ends with a build + manual verification step.

**Tech Stack:** TypeScript, Preact, Bun (bundler), Lumiverse Spindle API.

---

## Phase 1: Consolidate JSON Parsing (eliminate ~100 lines from worker.ts)

The `generateSummary` function in `worker.ts` (lines 225-316) implements 2 additional fallback strategies beyond what `parseSummaryJson` in `prompts.ts` already provides. These should be folded into `parseSummaryJson` as strategies 4 and 5, then `generateSummary` should just call `parseSummaryJson` and handle the null case.

### Task 1.1: Add fallback strategy 4 to `parseSummaryJson` (inline brace-matching)

**Objective:** Move the inline brace-matching + `sanitizeJsonForParse` fallback from `worker.ts` into `prompts.ts` as strategy 4.

**Files:**
- Modify: `src/prompts.ts:288-309` (inside `parseSummaryJson`)

**Step 1: Read the current `parseSummaryJson` to understand where to insert**

```bash
# Already verified — strategies 1-3 end at line 309, before the truncation check at line 312
```

**Step 2: Add strategy 4 after strategy 3 (brace-extraction) in `parseSummaryJson`**

Insert after line 309 (`}`), before the truncation check:

```typescript
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
```

**Step 3: Verify the build compiles**

Run: `cd ~/chronicle_ext && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors (or only pre-existing ones).

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add src/prompts.ts && git commit -m "refactor: add inline brace-matching as fallback strategy 4 in parseSummaryJson"
```

---

### Task 1.2: Add fallback strategy 5 to `parseSummaryJson` (content-field string scan)

**Objective:** Move the final content-field string scan from `worker.ts` into `prompts.ts` as strategy 5.

**Files:**
- Modify: `src/prompts.ts` (after strategy 4 just added)

**Step 1: Add strategy 5 after strategy 4**

```typescript
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
```

**Step 2: Verify the build compiles**

Run: `cd ~/chronicle_ext && npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

**Step 3: Commit**

```bash
cd ~/chronicle_ext && git add src/prompts.ts && git commit -m "refactor: add content-field string scan as fallback strategy 5 in parseSummaryJson"
```

---

### Task 1.3: Remove duplicated fallback chain from `worker.ts` `generateSummary`

**Objective:** Replace the ~100-line fallback chain in `generateSummary` with a single call to `parseSummaryJson`.

**Files:**
- Modify: `src/worker.ts:210-316` (the fallback chain after `parseSummaryJson` returns null)

**Step 1: Replace the fallback chain**

Replace lines 210-316 (everything after `const parsed = parseSummaryJson(text.trim())` through the last `return` before the catch block) with:

```typescript
    // parseSummaryJson now handles 5 fallback strategies internally.
    // If it returns null, all parsing failed — use raw text as content.
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
```

**Step 2: Verify the build compiles**

Run: `cd ~/chronicle_ext && npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

**Step 3: Build and verify the backend bundle**

Run: `cd ~/chronicle_ext && bun build src/worker.ts --outfile dist/worker.js --target=browser 2>&1 | tail -5`
Expected: Build succeeds.

**Step 4: Verify no regression in parsing behavior**

Run: `cd ~/chronicle_ext && grep -c 'parseSummaryJson' src/worker.ts`
Expected: `1` (the single call in generateSummary, no more inline fallback).

**Step 5: Commit**

```bash
cd ~/chronicle_ext && git add src/worker.ts && git commit -m "refactor: remove duplicated JSON fallback chain from generateSummary — consolidated into parseSummaryJson"
```

---

### Task 1.4: Remove unused import from worker.ts

**Objective:** Clean up the now-unused `sanitizeJsonForParse` import in worker.ts (it's only used in the deleted fallback chain).

**Files:**
- Modify: `src/worker.ts:41-46` (imports)

**Step 1: Check if `sanitizeJsonForParse` is still used in worker.ts**

Run: `cd ~/chronicle_ext && grep -n 'sanitizeJsonForParse' src/worker.ts`
Expected: Only the import line (the usage was in the deleted fallback chain).

**Step 2: Remove the unused import**

```typescript
import {
  buildSummarizePrompt,
  parseSummaryJson,
  extractContentKeywords,
} from './prompts'
```

(Remove `sanitizeJsonForParse` from the import list.)

**Step 3: Build**

Run: `cd ~/chronicle_ext && bun build src/worker.ts --outfile dist/worker.js --target=browser 2>&1 | tail -5`
Expected: Build succeeds.

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add src/worker.ts && git commit -m "chore: remove unused sanitizeJsonForParse import from worker.ts"
```

---

## Phase 2: Split worker.ts into Focused Modules

After Phase 1, `worker.ts` is ~1020 lines. Split it into 4 modules by responsibility.

### Task 2.1: Create `worker-state.ts` — state management + cleanup

**Objective:** Extract module-level state, interfaces, and cleanup logic from `worker.ts`.

**Files:**
- Create: `src/worker-state.ts`
- Modify: `src/worker.ts`

**Step 1: Create `src/worker-state.ts`**

Move from `worker.ts`:
- `PendingSummary` interface (lines 97-110)
- `_summarizingUsers` Set (line 91)
- `_summarizingTimeouts` Map (line 92)
- `SUMMARIZE_TIMEOUT_MS` constant (line 93)
- `_pendingSummaries` Map (line 112)
- `PENDING_TTL` constant (line 113)
- The `setInterval` cleanup block (lines 116-124)

```typescript
/**
 * Chronicle — Worker state
 * Module-level state for summarization locks and pending previews.
 */

export const SUMMARIZE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export const _summarizingUsers = new Set<string>()
export const _summarizingTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export interface PendingSummary {
  requestId: string
  title: string
  content: string
  keys: string[]
  chatId: string
  messageIds: string[]
  worldBookId?: string
  userId: string
  createdAt: number
  autoHidePrior?: boolean
  keepVisibleCount?: number
  sceneNumber?: string
}

export const _pendingSummaries = new Map<string, PendingSummary>()
const PENDING_TTL = 30 * 60 * 1000 // 30 minutes

// Periodic cleanup of expired pending summaries
setInterval(() => {
  const now = Date.now()
  for (const [id, pending] of _pendingSummaries) {
    if (now - pending.createdAt > PENDING_TTL) {
      _pendingSummaries.delete(id)
    }
  }
}, 60 * 1000)
```

**Step 2: Update worker.ts imports**

Replace the extracted declarations with:
```typescript
import {
  _summarizingUsers,
  _summarizingTimeouts,
  _pendingSummaries,
  SUMMARIZE_TIMEOUT_MS,
  type PendingSummary,
} from './worker-state'
```

**Step 3: Build**

Run: `cd ~/chronicle_ext && bun build src/worker.ts --outfile dist/worker.js --target=browser 2>&1 | tail -5`
Expected: Build succeeds.

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add src/worker-state.ts src/worker.ts && git commit -m "refactor: extract worker state into worker-state.ts"
```

---

### Task 2.2: Create `worker-llm.ts` — LLM interaction + prompt building

**Objective:** Extract `fetchMessageContent` and `generateSummary` from `worker.ts`.

**Files:**
- Create: `src/worker-llm.ts`
- Modify: `src/worker.ts`

**Step 1: Create `src/worker-llm.ts`**

Move from `worker.ts`:
- Spindle API return type interfaces (`ChatMessageDTO`, `GenerationResponse`, `ChatDTO`) — lines 50-88
- `checkPermissions` function — lines 128-134
- `fetchMessageContent` function — lines 138-160
- `generateSummary` function — lines 164-365 (now shorter after Phase 1)

The file should import from `./types`, `./prompts`, and `./worker-state` (for `PendingSummary` type, if needed).

Note: `generateSummary` currently imports from `./prompts`. Keep those imports in this new file.

**Step 2: Update worker.ts imports**

```typescript
import { checkPermissions, fetchMessageContent, generateSummary } from './worker-llm'
```

Remove the moved interfaces and functions from worker.ts.

**Step 3: Build**

Run: `cd ~/chronicle_ext && bun build src/worker.ts --outfile dist/worker.js --target=browser 2>&1 | tail -5`
Expected: Build succeeds.

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add src/worker-llm.ts src/worker.ts && git commit -m "refactor: extract LLM interaction into worker-llm.ts"
```

---

### Task 2.3: Create `worker-worldbooks.ts` — world book operations

**Objective:** Extract all world book logic from `worker.ts`.

**Files:**
- Create: `src/worker-worldbooks.ts`
- Modify: `src/worker.ts`

**Step 1: Create `src/worker-worldbooks.ts`**

Move from `worker.ts`:
- `WorldBookDTO` interface (lines 61-65)
- `WorldBookEntryDTO` interface (lines 67-73)
- `CHRONICLE_WORLD_BOOK_NAME` constant (line 773)
- `_creationLocks` Map (line 777)
- `getOrCreateChronicleBook` function (lines 779-825)
- `autoGenerateChronicleBook` function (lines 833-883)
- `resolveNextChronicleNumber` function (lines 890-916)
- `fetchRecentSummaries` function (lines 926-962)
- `saveLorebookEntry` function (lines 964-1042)

**Step 2: Update worker.ts imports**

```typescript
import {
  getOrCreateChronicleBook,
  autoGenerateChronicleBook,
  resolveNextChronicleNumber,
  fetchRecentSummaries,
  saveLorebookEntry,
  type WorldBookDTO,
} from './worker-worldbooks'
```

**Step 3: Build**

Run: `cd ~/chronicle_ext && bun build src/worker.ts --outfile dist/worker.js --target=browser 2>&1 | tail -5`
Expected: Build succeeds.

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add src/worker-worldbooks.ts src/worker.ts && git commit -m "refactor: extract world book operations into worker-worldbooks.ts"
```

---

### Task 2.4: Verify worker.ts is now slim

**Objective:** Confirm worker.ts is down to ~200-250 lines (message router + handlers only).

**Step 1: Count lines**

Run: `wc -l ~/chronicle_ext/src/worker.ts`
Expected: ~200-250 lines.

**Step 2: Verify what remains**

What should remain in worker.ts:
- `spindle` declaration
- `LOG` constant
- Imports from `./types`, `./worker-state`, `./worker-llm`, `./worker-worldbooks`
- `hideMessagesPriorTo` function (lines 376-424) — this could stay here or move to worker-worldbooks, but it's small and tightly coupled to the save flow
- `handleSummarizeV2` handler
- `handleSaveSummary` handler
- `handleDiscardSummary` handler
- `handleListConnections` handler
- `handleListLorebooks` handler
- `handleFrontendMessage` router
- `spindle.onFrontendMessage(handleFrontendMessage)` registration

**Step 3: Build the full extension**

Run: `cd ~/chronicle_ext && ./build.sh 2>&1 | tail -10`
Expected: Build succeeds, dist/ updated.

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add -A && git commit -m "refactor: worker.ts split complete — slim router remains"
```

---

## Phase 3: Deduplicate Near-Identical Functions

### Task 3.1: Deduplicate `getOrCreateChronicleBook` and `autoGenerateChronicleBook`

**Objective:** Merge the two near-identical world book creation functions into one parameterized function.

**Files:**
- Modify: `src/worker-worldbooks.ts`

**Step 1: Create a shared `getOrCreateBook` helper**

```typescript
/**
 * Shared world book creation with mutex protection.
 * @param nameResolver - Given existing books, returns the target name.
 *                        Return null to skip creation (book already exists).
 * @param description - Description for new book creation.
 * @param userId - User ID for API calls.
 */
async function getOrCreateBook(
  nameResolver: (existing: WorldBookDTO[]) => string | null,
  description: string,
  userId: string
): Promise<{ id: string }> {
  const name = 'will-be-resolved-inside'
  const key = `chronicle:${userId}:${Date.now()}` // unique per call

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

    const targetName = nameResolver(allBooks)
    if (!targetName) {
      // Book already exists — find it
      const existing = allBooks.find(b => b.name === nameResolver(allBooks) || allBooks.some(...))
      // Actually, this needs rethinking — see note below
    }

    // ... create if not found
  })()

  // ... mutex pattern
}
```

**Actually — pause.** Looking at this more carefully, the two functions have different naming strategies and different mutex keys. The cleanest approach is to extract the shared boilerplate (list → find → create → mutex) into a helper, and keep the two functions as thin wrappers that provide the name-resolution strategy:

```typescript
async function findOrCreateBook(
  matchName: string,
  description: string,
  userId: string
): Promise<{ id: string }> {
  const key = `chronicle:book:${matchName}:${userId}`
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
    const found = allBooks.find(b => b.name === matchName)
    if (found) return { id: found.id }

    const newBook = await Promise.race([
      spindle.world_books.create({ name: matchName, description }, userId) as Promise<WorldBookDTO>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timed out creating world book')), 10_000)
      ),
    ])
    spindle.log.info(`${LOG} Created world book: ${matchName} (${(newBook as WorldBookDTO).id})`)
    return { id: (newBook as WorldBookDTO).id }
  })()

  _creationLocks.set(key, promise)
  const safetyTimeout = setTimeout(() => _creationLocks.delete(key), 30_000)
  try {
    return await promise
  } finally {
    clearTimeout(safetyTimeout)
    _creationLocks.delete(key)
  }
}
```

Then the two existing functions become:

```typescript
async function getOrCreateChronicleBook(userId: string): Promise<{ id: string }> {
  return findOrCreateBook(
    CHRONICLE_WORLD_BOOK_NAME,
    'Lorebook entries generated by the Chronicle extension',
    userId
  )
}

async function autoGenerateChronicleBook(userId: string): Promise<{ id: string }> {
  // Compute the next Chronicle_N name by listing existing books,
  // then delegate to findOrCreateBook for the actual creation.
  const { data: books } = await Promise.race([
    spindle.world_books.list({ limit: 200, userId }) as Promise<{ data: WorldBookDTO[]; total: number }>,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Auto-generate lorebook list timed out')), 10_000)
    ),
  ])
  const allBooks = books as WorldBookDTO[]
  const chronicleNumbers = allBooks
    .map((b) => b.name.match(/^Chronicle_(\d+)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => parseInt(m[1], 10))
    .sort((a, b) => a - b)
  const nextN = chronicleNumbers.length > 0 ? chronicleNumbers[chronicleNumbers.length - 1] + 1 : 1
  const bookName = `Chronicle_${nextN}`
  // findOrCreateBook will list again to check existence, but that's acceptable
  // for code clarity. If the duplicate list is a concern, refactor findOrCreateBook
  // to accept a pre-fetched book list as an optional parameter.
  return findOrCreateBook(
    bookName,
    `Auto-generated Chronicle lorebook #${nextN}`,
    userId
  )
}
```

**Step 2: Apply the refactor**

Replace the two functions with `findOrCreateBook` + thin wrappers.

**Step 3: Build**

Run: `cd ~/chronicle_ext && bun build src/worker.ts --outfile dist/worker.js --target=browser 2>&1 | tail -5`
Expected: Build succeeds.

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add src/worker-worldbooks.ts && git commit -m "refactor: extract shared findOrCreateBook helper — dedup world book creation"
```

---

### Task 3.2: Deduplicate `openChronicleModal` and `openPreviewModal` in main.tsx

**Objective:** Merge the two near-identical modal openers into a single parameterized function.

**Files:**
- Modify: `src/main.tsx`

**Step 1: Create a shared `openModal` helper**

```typescript
interface ModalConfig {
  title: string
  preview?: SummarizePreview | null
  count: number
  entrySettings?: EntrySettings
  lorebookId?: string
  initialActivePrompt?: string
  initialConnectionId?: string
  initialGenerationParams?: GenerationParams
}

function openModal(config: ModalConfig) {
  if (!spindleCtx) return
  if (_modalOpen) return

  const { title, count, preview, entrySettings, lorebookId, initialActivePrompt, initialConnectionId, initialGenerationParams } = config

  const maxH = Math.min(720, window.innerHeight - 200)
  const modal = spindleCtx.ui.showModal({ title, width: 600, maxHeight: maxH })

  const handleGenerateStart = (params: {
    customPrompt: string | undefined
    connectionId: string | undefined
    lorebookId: string | undefined
    entrySettings: EntrySettings
    activePrompt: string | undefined
    generationParams?: GenerationParams
  }) => {
    startGenerating()
    _generationSelectedCount = count
    _generationEntrySettings = params.entrySettings
    _generationLorebookId = params.lorebookId
    _generationActivePrompt = params.activePrompt
    _generationConnectionId = params.connectionId
    _generationParams = params.generationParams
    showSummaryToast('generating', 'Generating summary\u2026')
    modal.dismiss()
  }

  _modalOpen = true
  if (_modalSafetyTimer) { clearTimeout(_modalSafetyTimer); _modalSafetyTimer = null }

  render(
    <ChronicleContext.Provider value={spindleCtx}>
      <ErrorBoundary name={preview ? 'preview-modal' : 'modal'}>
        <SummarizeFlow
          selectedCount={count}
          onRequestClose={() => modal.dismiss()}
          onGenerateStart={handleGenerateStart}
          {...(preview ? { preview, entrySettings, lorebookId, initialActivePrompt, initialConnectionId, initialGenerationParams } : {})}
        />
      </ErrorBoundary>
    </ChronicleContext.Provider>,
    modal.root
  )

  const dismissAndRelease = () => {
    render(null as any, modal.root)
    _modalOpen = false
    if (_modalSafetyTimer) { clearTimeout(_modalSafetyTimer); _modalSafetyTimer = null }
  }
  modal.onDismiss(dismissAndRelease)
  _modalSafetyTimer = setTimeout(() => {
    _modalOpen = false
    _modalSafetyTimer = null
  }, 60_000)
}
```

**Step 2: Rewrite the two functions as thin wrappers**

```typescript
function openChronicleModal(count: number) {
  if (count === 0 || _generating) return
  openModal({
    title: 'Create Summary / Memory',
    count,
  })
}

function openPreviewModal(previewData: SummarizePreview, count: number) {
  openModal({
    title: `Lorebook Entry Preview (${count} ${count === 1 ? 'message' : 'messages'})`,
    count,
    preview: previewData,
    entrySettings: _generationEntrySettings,
    lorebookId: _generationLorebookId,
    initialActivePrompt: _generationActivePrompt,
    initialConnectionId: _generationConnectionId,
    initialGenerationParams: _generationParams,
  })
}
```

**Step 3: Build**

Run: `cd ~/chronicle_ext && bun build src/main.tsx --outfile dist/frontend.js --target=browser 2>&1 | tail -5`
Expected: Build succeeds.

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add src/main.tsx && git commit -m "refactor: deduplicate modal openers into shared openModal helper"
```

---

## Phase 4: Extract Shared Patterns

### Task 4.1: Extract `usePersistedState` hook

**Objective:** Create a reusable hook that wraps localStorage read/write with try/catch, eliminating scattered `try { localStorage.getItem(...) } catch {}` blocks.

**Files:**
- Create: `src/hooks.ts`

**Step 1: Create `src/hooks.ts`**

```typescript
/**
 * Chronicle — Shared Preact hooks
 */
import { useState, useCallback } from 'preact/hooks'

/**
 * useState backed by localStorage. Reads on init, writes on change.
 * Swallows localStorage errors silently (SSR, private browsing, quota).
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  serialize: (v: T) => string = String,
  deserialize: (s: string) => T = (s) => s as unknown as T
): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) return deserialize(raw)
    } catch { /* ignore */ }
    return defaultValue
  })

  const setPersisted = useCallback((v: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof v === 'function' ? (v as (prev: T) => T)(prev) : v
      try { localStorage.setItem(key, serialize(next)) } catch { /* ignore */ }
      return next
    })
  }, [key, serialize])

  return [state, setPersisted]
}
```

**Step 2: Verify the build compiles**

Run: `cd ~/chronicle_ext && npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors.

**Step 3: Commit**

```bash
cd ~/chronicle_ext && git add src/hooks.ts && git commit -m "feat: add usePersistedState hook for localStorage-backed state"
```

---

### Task 4.2: Replace scattered localStorage in SummarizeFlow

**Objective:** Replace the 13 manual localStorage read/write blocks in `SummarizeFlow.tsx` with `usePersistedState` calls.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx`

**Step 1: Import the hook**

```typescript
import { usePersistedState } from '../hooks'
```

**Step 2: Replace each localStorage-backed state**

Replace the manual `useState` + `useEffect` patterns with `usePersistedState`:

```typescript
// Before:
const [autoHidePrior, setAutoHidePrior] = useState<boolean>(() => {
  try { return localStorage.getItem('chronicle:autoHidePrior') === 'true' } catch { return true }
})
useEffect(() => {
  try { localStorage.setItem('chronicle:autoHidePrior', String(autoHidePrior)) } catch {}
}, [autoHidePrior])

// After:
const [autoHidePrior, setAutoHidePrior] = usePersistedState<boolean>(
  'chronicle:autoHidePrior', true,
  String, v => v === 'true'
)
```

Apply this pattern to:
- `autoHidePrior` (default: `true`)
- `keepVisibleCount` (default: `10`, needs parseInt deserialize)
- `includeRecentContext` (default: `false`)
- `recentContextCount` (default: `3`, needs parseInt+clamp deserialize)
- `titleFormat` (default: `'{number} - {title}'`)
- `useCustomFormat` (default: `false`)

**Step 3: Remove the now-unused useEffect persistence effects**

Delete the `useEffect` blocks that were writing to localStorage for these 6 fields.

**Step 4: Build**

Run: `cd ~/chronicle_ext && bun build src/main.tsx --outfile dist/frontend.js --target=browser 2>&1 | tail -5`
Expected: Build succeeds.

**Step 5: Commit**

```bash
cd ~/chronicle_ext && git add src/components/SummarizeFlow.tsx && git commit -m "refactor: replace scattered localStorage in SummarizeFlow with usePersistedState"
```

---

### Task 4.3: Replace scattered localStorage in PromptManager and SettingsManager

**Objective:** Apply `usePersistedState` to the remaining manual localStorage blocks in the two preset manager components.

**Files:**
- Modify: `src/components/PromptManager.tsx`
- Modify: `src/components/SettingsManager.tsx`

**Step 1: Apply `usePersistedState` to `selectedPresetId` in both components**

Both components store the last-selected preset ID in localStorage with the same pattern. Replace with:

```typescript
// PromptManager:
const [selectedPresetId, setSelectedPresetId] = usePersistedState<string>(
  'chronicle_selected_prompt_preset', 'default'
)

// SettingsManager:
const [selectedPresetId, setSelectedPresetId] = usePersistedState<string>(
  'chronicle_selected_settings_preset', 'default'
)
```

Remove the `restoreSelectedPreset()` helper functions and the localStorage writes in `handlePresetChange`, `handleSavePreset`, `handleConfirmDelete`, and `ensureAutosavePreset`.

**Step 2: Build**

Run: `cd ~/chronicle_ext && bun build src/main.tsx --outfile dist/frontend.js --target=browser 2>&1 | tail -5`
Expected: Build succeeds.

**Step 3: Commit**

```bash
cd ~/chronicle_ext && git add src/components/PromptManager.tsx src/components/SettingsManager.tsx && git commit -m "refactor: replace scattered localStorage in PromptManager/SettingsManager with usePersistedState"
```

---

### Task 4.4: Clean up dead code

**Objective:** Remove dead exports and noisy comments.

**Files:**
- Modify: `src/prompts.ts` — remove `parseSummaryResponse` (dead code)
- Modify: `src/main.tsx` — remove re-export of `parseSummaryResponse`
- Modify: `src/types.ts` — remove `// NEW` comments from type unions

**Step 1: Remove `parseSummaryResponse` from prompts.ts**

Delete lines 349-387 (the function + its JSDoc comment).

**Step 2: Remove the re-export from main.tsx**

Remove `parseSummaryResponse` from the `export { ... } from './prompts'` line.

**Step 3: Remove `// NEW` comments from types.ts**

Remove the `// NEW` suffix from each type in the `FrontendToBackend` and `BackendToFrontend` unions.

**Step 4: Build**

Run: `cd ~/chronicle_ext && ./build.sh 2>&1 | tail -5`
Expected: Build succeeds.

**Step 5: Commit**

```bash
cd ~/chronicle_ext && git add src/prompts.ts src/main.tsx src/types.ts && git commit -m "chore: remove dead parseSummaryResponse, clean NEW comments from types"
```

---

## Phase Summary

| Phase | Tasks | Lines removed (est.) | Files created |
|-------|-------|---------------------|---------------|
| 1: JSON parsing consolidation | 4 | ~100 | 0 |
| 2: worker.ts split | 4 | 0 (reorganized) | 3 (`worker-state.ts`, `worker-llm.ts`, `worker-worldbooks.ts`) |
| 3: Function deduplication | 2 | ~80 | 0 |
| 4: Shared patterns | 4 | ~60 | 1 (`hooks.ts`) |
| **Total** | **14** | **~240** | **4** |

## Verification Checklist

After all phases:

- [ ] `cd ~/chronicle_ext && ./build.sh` succeeds
- [ ] `grep -c 'sanitizeJsonForParse' src/worker.ts` returns `0` (moved to prompts.ts only)
- [ ] `wc -l src/worker.ts` returns < 300
- [ ] `wc -l src/worker-*.ts` shows the split (3 new files)
- [ ] No `parseSummaryResponse` in any file
- [ ] `grep -c 'localStorage' src/components/SummarizeFlow.tsx` returns ≤ 2 (just the hook import)
- [ ] Manual test: Open Lumiverse → Select messages → Summarize → Preview → Save works
- [ ] Manual test: Auto-hide prior messages works
- [ ] Manual test: Custom prompt preset switching works
