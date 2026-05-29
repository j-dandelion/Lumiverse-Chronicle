# Bug Fix Pass 2 — Chronicle Codebase

> **For Hermes:** Use subagent-driven-development to implement this plan task-by-task.

**Goal:** Fix 9 bugs (2 blockers, 7 majors) discovered during codebase critique of recent commits.

**Architecture:** All changes are in four files: `src/components/SummarizeFlow.tsx`, `src/worker.ts`, `src/prompts.ts`, `src/presets.ts`, `src/settings.ts`. Each fix is scoped to a single concern — no refactoring. Build and type-check after every task.

**Tech Stack:** TypeScript, Preact, Bun, Lumiverse Spindle API

---

### Task 1: Fix `sendToBackend` silent error swallowing

**BLOCKER #1.** The `sendToBackend` wrapper in `SummarizeFlow.tsx:102-108` has a try/catch that swallows all errors silently. `handleCreateSummary` wraps it in an outer try/catch expecting it to throw — but it never does. This means `onGenerateStart` fires and dismisses the modal even when the message was never delivered (e.g., `ctx` is null during teardown). User sees infinite "Generating summary…" toast.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx:102-108`

**Step 1: Change `sendToBackend` to report failure truthfully**

Replace the entire `sendToBackend` callback with a version that returns a success indicator and throws when `ctx` is null:

Current:
```ts
const sendToBackend = useCallback((payload: unknown) => {
  try {
    ctx?.sendToBackend(payload)
  } catch {
    // ctx may be null during teardown
  }
}, [ctx])
```

New:
```ts
const sendToBackend = useCallback((payload: unknown): boolean => {
  if (!ctx) return false
  try {
    ctx.sendToBackend(payload)
    return true
  } catch {
    // ctx.sendToBackend can throw if Spindle context is in a bad state
    return false
  }
}, [ctx])
```

Note: The old code used `ctx?.sendToBackend()` (optional chaining). The new code returns `false` instead of silently succeeding.

Objects line up because both the null-ctx path and the catch path now return `false`.

**Step 2: Update `handleCreateSummary` to check the return value**

In `handleCreateSummary`, change the try/catch around `sendToBackend`:

Current (lines 223-239):
```ts
try {
  sendToBackend({...})
} catch (err) {
  setFlowState('error')
  setErrorMessage(`Failed to send request: ${err instanceof Error ? err.message : String(err)}`)
  return
}
```

New:
```ts
const sent = sendToBackend({...})
if (!sent) {
  setFlowState('error')
  setErrorMessage('Failed to send request to backend. The Spindle context may be unavailable.')
  return
}
```

**Step 3: Type check and build**

```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add src/components/SummarizeFlow.tsx && git commit -m "fix: sendToBackend returns false on failure, stops handleCreateSummary from showing stale generating toast"
```

---

### Task 2: Add timeout to `getOrCreateChronicleBook` API calls

**BLOCKER #2.** `getOrCreateChronicleBook` at `worker.ts:640-678` calls `spindle.world_books.list()` and `spindle.world_books.create()` without `Promise.race` timeouts. Every other async handler in worker.ts has timeouts. If either call hangs, the `_creationLocks` mutex (line 644: `if (existing) return existing`) returns the pending promise forever — permanent deadlock for that userId until extension restart.

**Files:**
- Modify: `src/worker.ts:640-678`

**Step 1: Add timeouts to both API calls**

Replace the inline `(async () => { ... })()` with timed versions. Pattern matches `autoGenerateChronicleBook` (lines 692-697) exactly:

Current body of the promise:
```ts
// Line 648-668
const { data: books } = await spindle.world_books.list({ limit: 200, userId })
// ...find or create...
const newBook = await spindle.world_books.create(...)
```

New body:
```ts
const { data: books } = await Promise.race([
  spindle.world_books.list({ limit: 200, userId }) as Promise<{ data: WorldBookDTO[]; total: number }>,
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timed out listing world books')), 10_000)
  ),
])
// ...find or create...
const newBook = await Promise.race([
  spindle.world_books.create({ name: ..., description: ... }, userId) as WorldBookDTO,
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timed out creating world book')), 10_000)
  ),
]) as WorldBookDTO
```

The full function after the change:
```ts
async function getOrCreateChronicleBook(userId: string): Promise<{ id: string }> {
  const key = `chronicle:${CHRONICLE_WORLD_BOOK_NAME}:${userId}`
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
  try {
    return await promise
  } finally {
    _creationLocks.delete(key)
  }
}
```

**Step 2: Type check and build**

```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

**Step 3: Commit**

```bash
cd ~/chronicle_ext && git add src/worker.ts && git commit -m "fix: add 10s timeouts to getOrCreateChronicleBook API calls — prevents mutex deadlock on Spindle hang"
```

---

### Task 3: Fix save timeout catch that fires `hideMessagesPriorTo` on non-save errors

**MAJOR #7.** The catch block in `handleSaveSummary` (`worker.ts:505-512`) checks `message.includes('timed out')` to decide whether to fire `hideMessagesPriorTo` as a "save probably succeeded" fallback. But `autoGenerateChronicleBook` has its own 10s timeout ("Auto-generate lorebook list timed out") — if book creation times out, the error propagates to this catch handler, and `hideMessagesPriorTo` fires even though no save occurred.

**Files:**
- Modify: `src/worker.ts:505-506`

**Step 1: Scope the timeout-fallback hide to only the save's own 15s timeout**

The save operation's timeout is defined in `handleSaveSummary` at lines 476-478 with message "Save request timed out after 15s". The `autoGenerateChronicleBook` timeout message is "Auto-generate lorebook list timed out".

Change the condition from a broad `includes('timed out')` to match the specific save timeout message:

Current (line 506):
```ts
if (pending.autoHidePrior && message.includes('timed out')) {
```

New:
```ts
if (pending.autoHidePrior && message === 'Save request timed out after 15s') {
```

Using strict equality against the exact message is safer than substring matching — there are exactly two places that create this error message: the save timeout Promise.race in `handleSaveSummary`, and no other timeout in the call chain uses this exact string.

**Step 2: Type check and build**

```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

**Step 3: Commit**

```bash
cd ~/chronicle_ext && git add src/worker.ts && git commit -m "fix: scope hide-on-timeout fallback to exact save timeout — prevents hide when autoGenerateChronicleBook times out"
```

**Files:**
- Modify: `src/worker.ts:505-506`

---

### Task 4: Fix font-size mismatch on auto-hide count label

**MAJOR #3.** Commit `b19d853` changed `.chronicle-pm-label` font-size from `12px` → `11px` in `styles.ts:131`. But the "Number of prior messages to keep visible" label in `SummarizeFlow.tsx:424` has an inline `style` that overrides the class: `fontSize: 'calc(12px * var(--lumiverse-font-scale, 1))'`. It renders at 12px while all other labels render at 11px.

Also fix a second inconsistency while here: the adjacent info tooltip icon renders at `10px` (`.chronicle-info-icon`), and the number input at `12px` (`.chronicle-sf-autohide-input`). The label needs to match the input's size — so bump the label inline style down to 11px.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx:424`

**Step 1: Remove the font-size override from inline style**

The inline style at line 424 is:
```ts
style={{ opacity: autoHidePrior ? 1 : 0.5, fontSize: 'calc(12px * var(--lumiverse-font-scale, 1))' }}
```

Change to:
```ts
style={{ opacity: autoHidePrior ? 1 : 0.5 }}
```

The class `.chronicle-pm-label` now provides the 11px font-size cleanly. All labels in the extension render at the same size.

**Step 2: Type check and build**

```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

**Step 3: Commit**

```bash
cd ~/chronicle_ext && git add src/components/SummarizeFlow.tsx && git commit -m "fix: remove stale font-size override on auto-hide count label (.chronicle-pm-label now 11px via CSS class)"
```

---

### Task 5: Fix `parseSummaryResponse` to use LAST occurrence of markers

**MAJOR #4.** The regex in `prompts.ts:104-105` uses `/^TITLE:\s*(.+)$/m` and `/^CONTENT:\s*([\s\S]+)$/m`. These match the **first** occurrence in the LLM response. If the summary body text contains a line starting with `TITLE:` or `CONTENT:` (plausible for narrative summaries), the parsed result is wrong — truncated title, content starting from the wrong `CONTENT:` marker.

**Files:**
- Modify: `src/prompts.ts:101-113`

**Step 1: Replace regex with last-index-based extraction**

Instead of regex with `^...$m` (which matches first, not last), find the last occurrence of each marker in the text:

```ts
export function parseSummaryResponse(
  text: string
): { title: string; content: string } | null {
  // Find the LAST occurrence of each marker to avoid content injection
  const titleMarker = 'TITLE:'
  const contentMarker = 'CONTENT:'
  
  const lastTitleIdx = text.lastIndexOf(titleMarker)
  const lastContentIdx = text.lastIndexOf(contentMarker)
  
  if (lastContentIdx === -1) return null

  const titleLine = lastTitleIdx >= 0
    ? text.slice(lastTitleIdx + titleMarker.length, text.indexOf('\n', lastTitleIdx)).trim()
    : null

  const contentStart = lastContentIdx + contentMarker.length
  const content = text.slice(contentStart).trim()

  if (!content) return null

  return {
    title: titleLine || 'Untitled Entry',
    content,
  }
}
```

This finds the LAST `CONTENT:` and LAST `TITLE:` — even if the LLM's narrative summary mentions "the content was approved" on a line, the parsing ignores the first occurrence.

**Step 2: Type check and build**

```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

**Step 3: Commit**

```bash
cd ~/chronicle_ext && git add src/prompts.ts && git commit -m "fix: parseSummaryResponse uses lastIndexOf instead of regex — prevents content injection from LLM output containing TITLE:/CONTENT: lines"
```

---

### Task 6: Deduplicate preset IDs on import

**MAJOR #9.** Both `presets.ts:168-169` and `settings.ts:203-204` do `const merged = [...existing, ...valid]` without checking for ID collisions. If an imported JSON has a preset with the same ID as an existing one, it's silently duplicated. The first one found by `find`/`findIndex` wins, so the duplicate is invisible but persists in localStorage forever.

**Files:**
- Modify: `src/presets.ts:168-170`
- Modify: `src/settings.ts:203-205`

**Step 1: Add ID dedup to `presets.ts` import**

Current (lines 168-170):
```ts
const existing = loadUserPresets()
const merged = [...existing, ...valid]
saveUserPresets(merged)
```

New:
```ts
const existing = loadUserPresets()
const existingIds = new Set(existing.map((p) => p.id))
const deduped = valid.filter((p) => !existingIds.has(p.id))
const merged = [...existing, ...deduped]
saveUserPresets(merged)
```

**Step 2: Add ID dedup to `settings.ts` import**

Same pattern. Current (lines 203-204):
```ts
const existing = loadUserPresets()
const merged = [...existing, ...valid]
saveUserPresets(merged)
```

New:
```ts
const existing = loadUserPresets()
const existingIds = new Set(existing.map((p) => p.id))
const deduped = valid.filter((p) => !existingIds.has(p.id))
const merged = [...existing, ...deduped]
saveUserPresets(merged)
```

**Step 3: Type check and build**

```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add src/presets.ts src/settings.ts && git commit -m "fix: deduplicate preset IDs on import — prevents silent localStorage duplicates"
```

---

### Task 7: Fix Duplicate blink observer leak on rapid re-opens

**MAJOR #6.** `SummarizeFlow.tsx:286-318` creates a `MutationObserver` on `document.body` with `{ childList: true, subtree: true }` — fires on every DOM mutation. When `handleOpenConnectionsDrawer` is called, the modal is dismissed (component unmounts), but the first observer's 35s safety setTimeout still runs. If the user re-opens the modal and clicks "Set up a new connection profile" again within 35s, a SECOND observer is created. The first observer is never disconnected because `duplicateObserverRef.current` now points to the second one.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx:286-318`

**Step 1: Track all observer instances for proper cleanup**

The problem: `watchForDuplicate` disconnects `duplicateObserverRef.current` before creating a new observer, but the OLD observer (created by a previous call) is no longer referenced by the ref. The old observer lives on until its 35s safety timeout.

Fix: use a `Set<MutationObserver>` to track all active observers, and clean up all of them on unmount.

Add a module-level or ref-based Set:

```ts
const activeObserversRef = useRef<Set<MutationObserver>>(new Set())
```

Modify `watchForDuplicate`:

```ts
const watchForDuplicate = useCallback(() => {
  const observer = new MutationObserver(() => {
    if (Date.now() - moreActionsBlinkedRef.current > 30_000) {
      observer.disconnect()
      activeObserversRef.current.delete(observer)
      return
    }
    const items = document.querySelectorAll<HTMLElement>(
      '[class*="contextMenu"] button, [class*="ContextMenu"] button'
    )
    for (const btn of items) {
      if (btn.textContent?.includes('Duplicate')) {
        btn.classList.remove('chronicle-conn-highlight')
        void btn.offsetWidth
        btn.classList.add('chronicle-conn-highlight')
        observer.disconnect()
        activeObserversRef.current.delete(observer)
        break
      }
    }
  })

  activeObserversRef.current.add(observer)
  observer.observe(document.body, { childList: true, subtree: true })

  // Safety cleanup after 35s
  setTimeout(() => {
    observer.disconnect()
    activeObserversRef.current.delete(observer)
  }, 35_000)
}, [])
```

Update the unmount cleanup (lines 322-327):
```ts
useEffect(() => {
  return () => {
    for (const obs of activeObserversRef.current) {
      obs.disconnect()
    }
    activeObserversRef.current.clear()
  }
}, [])
```

Remove the old `duplicateObserverRef.current?.disconnect()` from `watchForDuplicate` and the unmount cleanup — it's replaced by the Set-based tracking.

Also remove the early-disconnect inside the observer callback that used `if (duplicateObserverRef.current === observer) duplicateObserverRef.current = null` — replaced by `activeObserversRef.current.delete(observer)`.

**Step 2: Performance guard — skip scanning when no relevant DOM changes**

The observer callback runs on EVERY mutation. Add a quick heuristic: only scan for context menu buttons if mutations added elements (not just attribute changes):

```ts
const observer = new MutationObserver((mutations) => {
  // Quick filter: only scan if mutations added any elements
  const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0)
  if (!hasAddedNodes && Date.now() - moreActionsBlinkedRef.current < 30_000) return
  // ...rest of the handler...
})
```

This avoids querySelectorAll on every keystroke or scroll event during the 30s window.

**Step 3: Type check and build**

```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

**Step 4: Commit**

```bash
cd ~/chronicle_ext && git add src/components/SummarizeFlow.tsx && git commit -m "fix: track all Duplicate blink observers via Set — prevents observer leak on rapid re-opens, adds performance guard"
```

---

### Task 8: Fix auto-hide count `selectedCount` guard using stale prop

**MINOR #10.** `SummarizeFlow.tsx:207` checks `if (selectedCount === 0) return`. But `selectedCount` is a prop snapshot from when the modal opened — not the live DOM state. `getSelectedMessageIds()` at line 215 reads the live DOM. These can disagree: the guard passes (prop says >0) but the actual DOM has no selected messages (deselected while modal was open), or vice versa.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx:207`

**Step 1: Move the guard to the actual DOM read**

Instead of checking `selectedCount` (prop), move the guard to check the result of `getSelectedMessageIds()`:

Current:
```ts
if (selectedCount === 0) return
// ...
const ids = getSelectedMessageIds()
if (ids.length === 0) { ... }
```

New — remove the prop-based guard entirely and keep only the DOM-based guard:

```ts
// Remove: if (selectedCount === 0) return

// Get selected message IDs from DOM
const ids = getSelectedMessageIds()

if (ids.length === 0) {
  setFlowState('error')
  setErrorMessage('No messages currently selected.')
  return
}
```

This changes behavior slightly: previously `selectedCount === 0` would silently return (no-op). Now it shows an error state. This is better UX — the user sees why nothing happened.

**Step 2: Type check and build**

```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

**Step 3: Commit**

```bash
cd ~/chronicle_ext && git add src/components/SummarizeFlow.tsx && git commit -m "fix: replace stale prop-based selectedCount guard with live DOM check — shows error when messages deselected while modal open"
```

---

## Verification

After all tasks are committed, do an end-to-end check:

```bash
cd ~/chronicle_ext && bun run check
git log --oneline -10
```

Expected: 0 TypeScript errors, 8 new commits.

Then run post-deploy verification:
```bash
cd ~/chronicle_ext && ./build.sh
grep -c "function unmountComponentAtNode" ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
grep -c "_creationLocks" ~/Lumiverse/data/extensions/chronicle/repo/dist/worker.js
```

## Risks

- **Task 1** changes the `sendToBackend` return type from `void` to `boolean`. All callers that ignore the return value (discardPending, handleSave, handleDiscard) continue to work unchanged — they don't check success, same as before.
- **Task 2** adds 10s timeouts to `getOrCreateChronicleBook`. If the user has 200+ world books and a slow connection, the list call might time out (10s should be generous — same timeout as all other list calls in the codebase).
- **Task 5** changes `parseSummaryResponse` from regex to `lastIndexOf`. If the LLM output doesn't contain `CONTENT:` at all, it returns `null` (same as before). Edge: if the LLM output has `CONTENT:\n` with nothing after, content is empty string which is falsy → returns null (slightly different from current regex behavior which would capture empty string as `content: ''`). This is fine — empty content shouldn't be saved.
- **Task 8** changes no-deselected-count from no-op to error state. This could surprise users who expected the button to do nothing silently. The error state is self-dismissing and shows a clear message.
