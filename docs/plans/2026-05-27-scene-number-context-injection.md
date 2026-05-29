# Scene Number + Recent Context Injection — Implementation Plan (v2)

> **For Hermes:** Implement task-by-task. Commit after each.

**Goal:** Resolve the next scene number before the LLM call, inject it into the system prompt's `{number}` placeholder, and optionally include recent lorebook entry summaries as context so the LLM writes a coherent next scene.

**Architecture:** `handleSummarizeV2` calls `resolveNextChronicleNumber` + `fetchRecentSummaries` *before* `generateSummary`. These values thread through `generateSummary` → `buildSummarizePrompt`, which substitutes `{number}` in the system prompt and appends a "Recent scene summaries" context block. The resolved scene number is stored in `PendingSummary` to prevent divergence between prompt and save-time title format. A new UI toggle in the idle section of `SummarizeFlow` controls the feature.

**Tech Stack:** TypeScript, Preact, Spindle API (`world_books.entries.list`), Bun build

**Key decisions:**
- Feature **disabled** when `lorebookId` is `undefined` or `__auto_generate__` (no book to count or fetch from)
- `{number}` replaced in ALL prompts (default and custom) — the regex is a no-op if the placeholder isn't present
- Recent context formatted as a compact block appended to the system prompt
- `fetchRecentSummaries` fetches 500 entries, sorts by scene number from comment (descending), takes top N — works around Spindle API's default `order_value ASC` sort which returns oldest first
- Scene number stored in `PendingSummary` so save-time title format resolution uses the same number
- `recentContextCount` clamped to 1-10 in both UI and backend
- `__auto_generate__` case: scene number NOT resolved (book doesn't exist yet), prompt contains literal `{number}` — accepted limitation documented in DEVLOG

---

### Task 1: Add `includeRecentContext` to protocol types + store `sceneNumber` in PendingSummary

**Objective:** Extend the summarize request and the pending store to carry the new context flags and resolved scene number.

**Files:**
- Modify: `src/types.ts`
- Modify: `src/worker.ts` (PendingSummary interface only)

**Step 1: Update `SummarizeRequestV2` interface**

Add two optional fields after `params`:
```ts
export interface SummarizeRequestV2 {
  // ... existing fields ...
  params?: GenerationParams
  includeRecentContext?: boolean  // fetch prior entries as context for scene numbering
  recentContextCount?: number     // how many prior entries to include (default 3)
}
```

**Step 2: Update `PendingSummary` interface** (worker.ts ~line 96)

Add `sceneNumber` field:
```ts
interface PendingSummary {
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
  sceneNumber?: string  // NEW: scene number used in the LLM prompt
}
```

**Step 3: Verify**

```bash
cd ~/chronicle_ext && bun run check
```

Expected: 0 errors

**Step 4: Commit**

```bash
git add src/types.ts src/worker.ts
git commit -m "feat: add includeRecentContext fields + sceneNumber to protocol/store"
```

---

### Task 2: Fix `resolveNextChronicleNumber` regex for variable-length numbers

**Objective:** The existing `\d{2}` regex breaks at 100+ entries. Change to `\d+` (1+ digits) to handle any scene count. Remove the `padStart(2, '0')` — let the number be its natural length.

**Files:**
- Modify: `src/worker.ts`

**Step 1: Update regex and padding**

In `resolveNextChronicleNumber` (~line 847):
```ts
// OLD:
const match = entry.comment.match(/^(\d{2})(?:\s*-)?/)
// ...
return String(maxNum + 1).padStart(2, '0')

// NEW:
const match = entry.comment.match(/^(\d+)(?:\s*-)?/)
// ...
return String(maxNum + 1)
```

**Step 2: Verify**

```bash
cd ~/chronicle_ext && bun run check
```

Expected: 0 errors

**Step 3: Commit**

```bash
git add src/worker.ts
git commit -m "fix: resolveNextChronicleNumber uses variable-length digit regex"
```

---

### Task 3: Add `fetchRecentSummaries` helper to worker

**Objective:** Fetch recent N entries from the target world book and format them as LLM context. Works around the Spindle API's default `order_value ASC` sort (returns oldest first) by fetching a larger batch and sorting by scene number from comments.

**Files:**
- Modify: `src/worker.ts`

**Step 1: Add the function**

Add after `resolveNextChronicleNumber` (~line 858):

```ts
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
```

**Step 2: Verify**

```bash
cd ~/chronicle_ext && bun run check
```

Expected: 0 errors

**Step 3: Commit**

```bash
git add src/worker.ts
git commit -m "feat: add fetchRecentSummaries helper with scene-number sorting"
```

---

### Task 4: Thread scene number + recent context into prompt builder

**Objective:** Update `buildSummarizePrompt` to accept optional `sceneNumber` and `recentContext`. Replace `{number}` unconditionally (works for both default and custom prompts — no-op if placeholder absent).

**Files:**
- Modify: `src/prompts.ts`

**Step 1: Update function signature and logic**

```ts
export function buildSummarizePrompt(
  messages: Array<{ role: string; content: string }>,
  title?: string,
  systemPromptOverride?: string,
  sceneNumber?: string,        // replaces {number} in the prompt (default or custom)
  recentContext?: string        // appended as context (empty string = skip)
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

  return { systemPrompt: effectiveSystem, userPrompt }
}
```

**Step 2: Add unit tests for `buildSummarizePrompt`**

Add to `src/__tests__/prompts.test.ts`:

```ts
import { buildSummarizePrompt } from '../prompts'

// ── buildSummarizePrompt tests ──────────────────────────────────────

// 21. Default prompt without sceneNumber — {number} stays literal
const bp1 = buildSummarizePrompt([{ role: 'user', content: 'hello' }], 'Test')
assert(bp1.systemPrompt.includes('{number}'), '{number} present when no sceneNumber')

// 22. Default prompt with sceneNumber — {number} replaced
const bp2 = buildSummarizePrompt([{ role: 'user', content: 'hello' }], 'Test', undefined, '05')
assert(!bp2.systemPrompt.includes('{number}'), '{number} removed when sceneNumber provided')
assert(bp2.systemPrompt.includes('05'), 'scene number injected: 05')

// 23. Custom prompt with sceneNumber — {number} replaced in custom prompt too
const bp3 = buildSummarizePrompt(
  [{ role: 'user', content: 'hello' }], 'Test',
  'Custom prompt with {number} placeholder', '42'
)
assert(!bp3.systemPrompt.includes('{number}'), '{number} replaced in custom prompt')
assert(bp3.systemPrompt.includes('Custom prompt with 42'), 'scene number injected in custom prompt: 42')

// 24. Recent context appended to system prompt
const bp4 = buildSummarizePrompt(
  [{ role: 'user', content: 'hello' }], 'Test', undefined, '03',
  '\n\n<> Recent scenes:\n- Scene 02: stuff happened'
)
assert(bp4.systemPrompt.includes('Recent scenes:'), 'recent context appended')

// 25. User prompt template still works
assert(bp1.userPrompt.includes('Test'), 'title in user prompt')
assert(bp1.userPrompt.includes('hello'), 'message content in user prompt')
```

**Step 3: Verify**

```bash
cd ~/chronicle_ext && bun run check && bun test
```

Expected: 0 errors, 41 passed (36 existing + 5 new)

**Step 4: Commit**

```bash
git add src/prompts.ts src/__tests__/prompts.test.ts
git commit -m "feat: inject sceneNumber and recentContext into summarize prompt + tests"
```

---

### Task 5: Wire up resolution + context fetch in handleSummarizeV2

**Objective:** Call `resolveNextChronicleNumber` and `fetchRecentSummaries` before `generateSummary`, pass results through, and store sceneNumber in PendingSummary.

**Files:**
- Modify: `src/worker.ts`

**Step 1: Update `generateSummary` signature**

Add optional params:
```ts
async function generateSummary(
  messages: Array<{ role: string; content: string }>,
  title: string | undefined,
  userId: string,
  customPrompt?: string,
  connectionId?: string,
  params?: GenerationParams,
  sceneNumber?: string,      // NEW
  recentContext?: string      // NEW
): Promise<{ title: string; content: string; keys: string[] } | null> {
  const { systemPrompt, userPrompt } = buildSummarizePrompt(
    messages, title, customPrompt, sceneNumber, recentContext
  )
  // ... rest unchanged
```

**Step 2: Add resolution logic to `handleSummarizeV2`**

After `// 3. Fetch messages` block (around line 494) and before `// 4. Generate summary`:

```ts
  // 3b. Resolve scene number and recent context (only if a specific book is selected)
  let sceneNumber: string | undefined
  let recentContext: string | undefined
  const hasTargetBook = req.worldBookId && req.worldBookId !== '__auto_generate__'

  if (req.includeRecentContext && hasTargetBook) {
    const count = Math.max(1, Math.min(10, req.recentContextCount ?? 3))  // backend clamp
    const [num, ctx] = await Promise.all([
      resolveNextChronicleNumber(req.worldBookId, userId),
      fetchRecentSummaries(req.worldBookId, userId, count),
    ])
    sceneNumber = num
    recentContext = ctx
  } else if (hasTargetBook) {
    // Even without recent context, resolve the number so {number} is filled
    sceneNumber = await resolveNextChronicleNumber(req.worldBookId, userId)
  }
```

**Step 3: Pass to `generateSummary`**

Change the generateSummary call from:
```ts
const summary = await generateSummary(messages, req.title, userId, req.customPrompt, req.connectionId, req.params)
```
To:
```ts
const summary = await generateSummary(messages, req.title, userId, req.customPrompt, req.connectionId, req.params, sceneNumber, recentContext)
```

**Step 4: Store sceneNumber in pending summary**

After the `_pendingSummaries.set(requestId, {...})` call (~line 502), add `sceneNumber`:
```ts
    _pendingSummaries.set(requestId, {
      // ... existing fields ...
      keepVisibleCount: req.keepVisibleCount,
      sceneNumber,  // NEW
    })
```

**Step 5: Thread sceneNumber through saveLorebookEntry**

Update `saveLorebookEntry` to accept an optional `sceneNumber` param, and update `handleSaveSummary` to pass `pending.sceneNumber`.

In `saveLorebookEntry` signature (add after `titleFormat?: string`):
```ts
  sceneNumber?: string  // pre-resolved scene number from preview phase
```

In `saveLorebookEntry` body, replace the resolve call:
```ts
    if (titleFormat.includes('{number}')) {
      const nextNum = sceneNumber ?? await resolveNextChronicleNumber(targetBookId, userId)
      resolvedFormat = titleFormat.replace(/\{number\}/g, nextNum)
    }
```

In `handleSaveSummary`, pass `pending.sceneNumber`:
```ts
    const saveResult = await Promise.race([
      saveLorebookEntry(
        { title: effectiveTitle, content: pending.content, keys: effectiveKeys },
        pending.chatId, pending.messageIds, targetBookId, userId,
        req.settings, req.titleFormat, pending.sceneNumber  // pass sceneNumber
      ),
```

**Step 6: Verify**

```bash
cd ~/chronicle_ext && bun run check
```

Expected: 0 errors

**Step 7: Commit**

```bash
git add src/worker.ts
git commit -m "feat: resolve scene number before LLM call, prevent save-time divergence"
```

---

### Task 6: Add UI toggle in SummarizeFlow

**Objective:** Add "Include recent summaries as context" checkbox in the idle section, visually consistent with auto-hide controls. Clamp input values instead of silently rejecting.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx`

**Step 1: Add state to SummarizeFlow**

After the `keepVisibleCount` state block (~line 110), add:
```ts
  // Recent context settings (persisted)
  const [includeRecentContext, setIncludeRecentContext] = useState<boolean>(() => {
    try { return localStorage.getItem('chronicle:includeRecentContext') === 'true' } catch { return false }
  })
  const [recentContextCount, setRecentContextCount] = useState<number>(() => {
    try {
      const v = localStorage.getItem('chronicle:recentContextCount')
      return v ? Math.max(1, Math.min(10, parseInt(v, 10) || 3)) : 3
    } catch { return 3 }
  })
```

**Step 2: Thread into the summarize request**

Update the `sendToBackend` call in `handleCreateSummary` (~line 270):
```ts
    sendToBackend({
        type: 'summarize_v2',
        // ... existing fields ...
        params: generationParams,
        includeRecentContext: includeRecentContext,
        recentContextCount: recentContextCount,
      })
```

**Step 3: Add UI markup**

Place between the auto-hide section and the `LorebookManager`:
```tsx
          {/* Recent context controls */}
          <div class="chronicle-sf-autohide">
            <div class="chronicle-sf-autohide-toggle-row">
              <label class="chronicle-sf-autohide-toggle">
                <input
                  type="checkbox"
                  checked={includeRecentContext}
                  disabled={!lorebookId || lorebookId === '__auto_generate__'}
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked
                    setIncludeRecentContext(checked)
                    try { localStorage.setItem('chronicle:includeRecentContext', String(checked)) } catch {}
                  }}
                />
                <span style={{ opacity: (!lorebookId || lorebookId === '__auto_generate__') ? 0.5 : 1 }}>
                  Include recent summaries as context
                </span>
              </label>
              <span class="chronicle-info-icon" data-tooltip="Fetches the most recent lorebook entries and includes their summaries as context for the LLM. This helps the LLM write a coherent next scene and use the correct scene number. Requires a lorebook to be selected.">i</span>
            </div>
            <div class="chronicle-sf-autohide-count">
              <input
                class="chronicle-sf-autohide-input"
                type="number"
                min="1"
                max="10"
                step="1"
                value={recentContextCount}
                disabled={!includeRecentContext || !lorebookId || lorebookId === '__auto_generate__'}
                onInput={(e) => {
                  const raw = (e.target as HTMLInputElement).value
                  if (raw === '') {
                    setRecentContextCount(3)
                  } else {
                    const v = parseInt(raw, 10)
                    if (!isNaN(v) && v >= 1) {
                      // Clamp to range — don't silently reject
                      setRecentContextCount(Math.max(1, Math.min(10, v)))
                      try { localStorage.setItem('chronicle:recentContextCount', String(Math.max(1, Math.min(10, v)))) } catch {}
                    }
                  }
                }}
              />
              <label class="chronicle-pm-label" style={{ opacity: (includeRecentContext && lorebookId && lorebookId !== '__auto_generate__') ? 1 : 0.5 }}>
                Number of recent entries to include
              </label>
            </div>
          </div>
```

**Step 4: Add dependency to `handleCreateSummary`'s useCallback**

Add `includeRecentContext` and `recentContextCount` to the dependency array at line 292.

**Step 5: Verify**

```bash
cd ~/chronicle_ext && bun run check
```

Expected: 0 errors

**Step 6: No CSS changes needed**

The new UI reuses existing `chronicle-sf-autohide` classes.

**Step 7: Commit**

```bash
git add src/components/SummarizeFlow.tsx
git commit -m "feat: add includeRecentContext UI toggle with input clamping"
```

---

### Task 7: Integration verification + DEVLOG

**Objective:** Build, deploy, verify, document.

**Step 1: Build + deploy**

```bash
cd ~/chronicle_ext && ./build.sh
```

**Step 2: Verify in deployed bundles**

```bash
grep -c 'includeRecentContext' ~/Lumiverse/data/extensions/chronicle/repo/dist/worker.js
grep -c 'fetchRecentSummaries' ~/Lumiverse/data/extensions/chronicle/repo/dist/worker.js
grep -c 'sceneNumber' ~/Lumiverse/data/extensions/chronicle/repo/dist/worker.js
grep -c 'Include recent summaries' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
```

Expected: all > 0

**Step 3: Run tests**

```bash
cd ~/chronicle_ext && bun test
```

Expected: 41 passed, 0 failed

**Step 4: Manual E2E verification**

1. Open Lumiverse, select a chat with a lorebook attached
2. Select messages, open Chronicle modal
3. Without a lorebook selected: verify "Include recent summaries" toggle is disabled/greyed
4. Select a lorebook: verify toggle becomes enabled
5. Check the toggle, set count to 2, click "Generate and Preview"
6. Verify the preview content heading shows the correct scene number (not literal `{number}`)
7. Save the entry, verify the title format uses the same number

**Step 5: DEVLOG entry**

Add at top of DEVLOG.md:
```markdown
## 2026-05-27 — Scene number + recent context injection

**What was done:** The LLM now receives the correct scene number and optional recent summaries as context, fixing the `{number}` ambiguity in the content heading.

### Changes
1. **Scene number resolution moved before LLM call:** `resolveNextChronicleNumber` runs in `handleSummarizeV2` (was only in `saveLorebookEntry` for titleFormat).
2. **Number stored in pending store:** Scene number flows through `PendingSummary` → `saveLorebookEntry`, preventing divergence between the content heading and entry title format.
3. **`{number}` injected into ALL prompts:** `buildSummarizePrompt` replaces `{number}` unconditionally — works for default and custom prompts.
4. **Recent context injection:** New `fetchRecentSummaries` fetches entries and sorts by scene number (descending) from comments, since the API returns oldest-first. Formats as a `<> Recent scene summaries` block.
5. **`resolveNextChronicleNumber` regex:** Changed from `\d{2}` to `\d+` to handle >99 scenes.
6. **UI toggle:** "Include recent summaries as context" checkbox with configurable count (1-10, default 3). Disabled when no lorebook selected. Persisted to localStorage.

### Known limitation
- **`__auto_generate__` books:** Scene number and recent context are NOT resolved when the lorebook is auto-generated (book doesn't exist yet). `{number}` remains literal in the prompt.

### Files changed
- **Modified:** `src/types.ts`, `src/prompts.ts`, `src/worker.ts`, `src/components/SummarizeFlow.tsx`, `src/__tests__/prompts.test.ts`

### Verification
- TypeScript: 0 errors
- Parser + prompt builder tests: 41 passed
- Build + deploy: succeeded
```

**Step 6: Commit**

```bash
git add DEVLOG.md
git commit -m "docs: DEVLOG for scene number + recent context feature"
```

---

## Edge Cases & Risks (updated)

| Case | Behavior |
|------|----------|
| No lorebook selected | UI toggle disabled; no number resolution or context fetch; `{number}` stays literal (LLM may make something up) |
| `__auto_generate__` book | Same as above — accepted limitation (book doesn't exist yet) |
| World book has >500 entries | `resolveNextChronicleNumber` and `fetchRecentSummaries` only scan first 500 (existing limit) |
| World book has >99 entries | `\d+` regex handles variable-length numbers; padding removed |
| `fetchRecentSummaries` fails | Returns empty string; generation proceeds without context (non-fatal); logged via `spindle.log.warn` |
| `resolveNextChronicleNumber` fails | Returns `'1'` (updated fallback) |
| Custom prompt with `{number}` | `{number}` IS replaced (unconditional replacement — v2 fix) |
| Entries have no comment | Skipped in number resolution (existing behavior); labeled "Entry N" in context |
| Preview saved minutes later, new entry added in between | No divergence — scene number stored in PendingSummary, reused at save time (v2 fix) |
| User types "15" in count input | Clamped to 10 (not silently rejected — v2 fix) |
| `recentContextCount` missing from request | Backend defaults to 3 and clamps 1-10 (v2 fix) |
