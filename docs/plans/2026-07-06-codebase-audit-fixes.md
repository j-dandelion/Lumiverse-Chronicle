# Chronicle Codebase Audit — Fix Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Fix 12 bugs and issues discovered during a full codebase audit of the Chronicle Spindle extension (21 files, ~3,000 lines). Two additional issues deferred: m2 (LLM progress feedback — low impact, existing spinner is adequate) and M5/`||` operator (design choice, not bug).

**Architecture:** The fixes span the frontend (Preact components, DOM interaction, select-mode), backend (worker.ts protocol handling, dead code), and supporting modules (selectors, persistence). All fixes are local to the Chronicle extension — no Lumiverse core changes needed.

**Tech Stack:** TypeScript, Preact, Bun build, Spindle API (Lumiverse)

---

## Audit Summary

### BLOCKER (1 issue)
- **B1**: `RangeSelector` clicks return virtual row from `closest('[data-message-id]')` but `getMessageElements()` returns card elements — `indexOf` mismatch makes range selection fail/silent

### MAJOR (6 issues)
- **M1**: `getSelectedMessageIds()` scans `[data-message-id]` matching both virtual rows and card elements — potential duplicate IDs
- **M2**: `SummarizeFlow` modal has no guard against double-open (clicking Summarize button twice opens two modals)
- **M3**: `worker.ts:654` checks `entrySettings?.worldBookId` but `settingsToCreateInput()` intentionally strips it — dead code
- **M4**: `SummarizeButton` MutationObserver fires on `attributes + childList + subtree` on the entire chat container — every keystroke triggers a full DOM scan
- **M5**: `worker.ts:397` uses `||` for title fallback — empty string `""` is falsy; should use `??` for exact null/undefined check
- **M6**: `SummarizeFlow`'s `handleOpenConnectionsDrawer` uses hardcoded button `title="Connections"` and text `"More actions"` — fragile to Lumiverse UI updates

### MINOR (7 issues)
- **m1**: `LorebookManager` dropdown missing `__default__` option — restoring old localStorage value shows blank dropdown
- **m2**: No progress feedback during 2-min LLM wait — user sees spinner with no intermediate status
- **m3**: `_pendingSummaries` cleanup interval (5 min) is 6× shorter than TTL (30 min) — expired entries linger for 25 min after cleanup fires
- **m4**: `ConnectionManager`/`LorebookManager` 5s fallback timeout — if backend call takes >5s (loaded server), shows perpetual "Loading…"
- **m5**: `SummarizeFlow` `discard_summary` sent on unmount, but backend sends no response — if frontend crashes mid-discard, backend keeps stale pending entry
- **m6**: `handleOpenConnectionsDrawer` assumes first `[title="More actions"]` button belongs to a connection item
- **m7**: `handleRetry` uses stale `lastCustomPrompt` — if user edits prompt after error but before Retry, old prompt is used

---

## Tasks

### Task 1: Fix RangeSelector DOM element mismatch (B1)

**Objective:** Fix the `closest('[data-message-id]')` → `getMessageElements()` mismatch that prevents range selection from working when clicking targets resolve to the virtual row wrapper instead of the card element.

**Files:**
- Modify: `src/components/RangeSelector.tsx`

**Step 1: Update the click handler**

After line 151 (`const target = ...closest('[data-message-id]')`), add a resolution step to find the corresponding card element:

```ts
// target may be the virtual row wrapper (which also has data-message-id)
// or the card element itself. Resolve to the card element for getMessageElements().
const cardEl = target.matches('[data-component="BubbleMessage"], [data-component="MinimalMessage"]')
  ? target
  : (target.querySelector('[data-component="BubbleMessage"], [data-component="MinimalMessage"]') as HTMLElement | null)
    ?? (target.closest('[data-component="BubbleMessage"], [data-component="MinimalMessage"]') as HTMLElement | null)
const idx = cardEl ? allEls.indexOf(cardEl) : -1
```

Replace lines 158-159:
```diff
-      const allEls = getMessageElements()
-      const idx = allEls.indexOf(target)
+      const allEls = getMessageElements()
+      // Resolve to the card element: target could be the virtual row wrapper
+      // (which has data-message-id but not data-component) or the card directly.
+      const cardEl = target.matches('[data-component="BubbleMessage"], [data-component="MinimalMessage"]')
+        ? target
+        : (target.querySelector('[data-component="BubbleMessage"], [data-component="MinimalMessage"]') as HTMLElement | null)
+          ?? (target.closest('[data-component="BubbleMessage"], [data-component="MinimalMessage"]') as HTMLElement | null)
+      const idx = cardEl ? allEls.indexOf(cardEl) : -1
```

Also update the display index lookup (`target.closest('[data-virtual-index]')`) to use `cardEl` instead of `target`, since the virtual row is the parent of the card:

```diff
-      const virtualRow = target.closest('[data-virtual-index]') as HTMLElement | null
+      const virtualRow = cardEl?.closest('[data-virtual-index]') as HTMLElement | null ?? target.closest('[data-virtual-index]') as HTMLElement | null
```

**Step 2: Verify the build**

```bash
cd ~/chronicle_ext && bun run check
# Expected: 0 errors
```

**Step 3: Manual test**

1. Open Lumiverse, enter a chat with messages
2. Click Select Range button in Chronicle bar
3. Click message #3, then message #7
4. Verify messages 3-7 are selected with proper highlights
5. Click on different parts of messages (text, padding, avatar) — verify all work

**Step 4: Commit**

```bash
cd ~/chronicle_ext
git add src/components/RangeSelector.tsx
git commit -m "fix: resolve card element from virtual row for range selection

closest('[data-message-id]') could return the virtual row wrapper
instead of the card element, causing indexOf() to return -1 and
range selection to silently fail. Now resolves to the card element
via matches/querySelector/closest fallback chain."
```

---

### Task 2: Deduplicate getSelectedMessageIds() results (M1)

**Objective:** Prevent duplicate message IDs when both virtual row and card elements match `[data-message-id]` and one has the `selected` class.

**Files:**
- Modify: `src/select-mode.ts`

**Step 1: Add deduplication**

Replace the function body with a Set-based dedup:

```ts
export function getSelectedMessageIds(): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  document.querySelectorAll('[data-message-id]').forEach((el) => {
    const classStr = (el as HTMLElement).className
    if (typeof classStr === 'string' && classStr.includes('selected')) {
      const mid = el.getAttribute('data-message-id')
      if (mid && !seen.has(mid)) {
        seen.add(mid)
        ids.push(mid)
      }
    }
  })
  return ids
}
```

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
# Expected: 0 errors

git add src/select-mode.ts
git commit -m "fix: deduplicate getSelectedMessageIds() results

[data-message-id] matches both virtual row wrappers and card elements.
When Lumiverse's native selection applies .selected to both, the same
message ID appears twice. Now uses a Set for deduplication."
```

---

### Task 3: Guard against double modal open (M2)

**Objective:** Prevent opening a second Chronicle modal if one is already open.

**Files:**
- Modify: `src/main.tsx`

**Step 1: Add guard to openChronicleModal**

Add a module-level flag in the `setup()` closure to track whether a modal is open:

```ts
// In setup(), before openChronicleModal definition:
let _modalOpen = false

function openChronicleModal(count: number) {
  if (count === 0) return
  if (!spindleCtx) return
  if (_modalOpen) return  // Guard against double-open

  _modalOpen = true

  const modal = spindleCtx.ui.showModal({
    title: 'Chronicle — Summarize',
    width: 520,
    maxHeight: 600,
  })

  render(
    <ChronicleContext.Provider value={spindleCtx}>
      <ErrorBoundary name="modal">
        <ChronicleModalShell count={count} onClose={() => modal.dismiss()} />
      </ErrorBoundary>
    </ChronicleContext.Provider>,
    modal.root
  )

  modal.onDismiss(() => {
    render(null as any, modal.root)
    _modalOpen = false
  })
}
```

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
# Expected: 0 errors

git add src/main.tsx
git commit -m "fix: guard against double modal open

Clicking the Summarize button while a Chronicle modal is already open
now returns early instead of opening a second modal on top."
```

---

### Task 4: Remove dead worldBookId check in worker.ts (M3)

**Objective:** Remove the dead code path that checks `entrySettings?.worldBookId` in `saveLorebookEntry`, since `settingsToCreateInput()` explicitly strips that field.

**Files:**
- Modify: `src/worker.ts`

**Step 1: Remove dead code**

Lines 654-656 (the `entrySettings?.worldBookId` check) are unreachable. Remove them:

```diff
-  // Use settings.worldBookId if provided (user selected a specific book)
-  if (!targetBookId && entrySettings?.worldBookId) {
-    targetBookId = entrySettings.worldBookId as string
-  }
```

Also update the comment on `settingsToCreateInput` in `src/settings.ts` to make the intent clearer:

```diff
-    // NOTE: worldBookId intentionally omitted — it's a routing field
-    // for lorebook selection, not a valid CreateWorldBookEntry API field.
-    // It's passed separately via the lorebookId request field.
+    // NOTE: worldBookId intentionally omitted — it's a client-side routing
+    // field for lorebook selection UI. It is NOT a valid CreateWorldBookEntry
+    // API field. The backend receives it via the lorebookId request field,
+    // not through entrySettings.
```

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check

git add src/worker.ts src/settings.ts
git commit -m "fix: remove dead worldBookId check in saveLorebookEntry

settingsToCreateInput intentionally omits worldBookId (it's a routing
field passed via the lorebookId request field, not a Create API field).
The fallback check in worker.ts was unreachable dead code."
```

---

### Task 5: Fix title fallback operator (M5)

**Objective:** Use `??` instead of `||` for title fallback so that intentional empty strings don't get silently replaced.

**Files:**
- Modify: `src/worker.ts`

**Step 1: Fix the operator**

Line 397:
```diff
-    const effectiveTitle = req.title?.trim() || pending.title
+    const effectiveTitle = req.title?.trim() || pending.title
```

Wait, actually: `req.title?.trim()` — if `req.title` is `undefined`, the optional chain short-circuits to `undefined`. Then `undefined || pending.title` → `pending.title`. If `req.title` is `""`, `.trim()` returns `""`, and `"" || pending.title` → `pending.title`. With `??`, `"" ?? pending.title` → `""`. 

The question is: should an empty title be allowed? Looking at the UI, the title input is pre-filled with the generated title. If the user clears it, they probably want the generated title to be used. So `||` is actually the *intended* behavior — an empty string means "use default". 

This isn't a real bug after all. Let me re-evaluate.

Actually, the use case is: user edits the title to be empty. What should happen? The `saveSummary` handler reads `summaryTitle` from SummarizeFlow state. If the user deletes all text from the title input, `summaryTitle` becomes `""`. Then `handleSave` sends `title: undefined` (because `summaryTitle !== preview.title ? summaryTitle : undefined`). So if user edits title to empty: `"" !== preview.title` → true → sends `title: ""`. Then `req.title` is `""`, `.trim()` is `""`, and `||` falls to `pending.title`.

But what if the user intentionally wants to save with an empty title? With `||`, they can't. With `??`, they could override to an empty string. But an empty title for a lorebook entry is probably bad — the backend likely requires a non-empty title.

So `||` is correct. This is NOT a bug. I'll remove it from the plan.

Wait, but I listed this as M5. Let me reconsider... Actually the `??` operator would be more semantically precise: the intent is "use the provided value unless it's null or undefined", not "unless it's falsy". The `||` operator catches empty strings as falsy, which is a side effect. The `??` operator only catches null/undefined. For this specific case, since empty string should fall back to default, `||` is correct behavior. But it's worth noting that it's a design choice, not a bug.

I'll remove M5 from the plan and re-label the remaining issues.

Let me restructure: remove M5 (not a bug) and keep the rest. Let me update the plan.

Actually, I already wrote the tasks to the file. Let me just rewrite the plan file with corrected tasks.<｜end▁of▁thinking｜>Let me restructure — one item I flagged (M5 `||` vs `??`) is actually correct behavior after re-analysis. Let me rewrite the plan:

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="write_file">
<｜｜DSML｜｜parameter name="content" string="true"># Chronicle Codebase Audit — Fix Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Fix 13 bugs and issues discovered during a full codebase audit of the Chronicle Spindle extension (21 files, ~3,000 lines).

**Architecture:** The fixes span the frontend (Preact components, DOM interaction, select-mode), backend (worker.ts dead code, protocol handling), and supporting modules (selectors, persistence). All fixes are local to the Chronicle extension — no Lumiverse core changes needed.

**Tech Stack:** TypeScript, Preact, Bun build, Spindle API (Lumiverse)

---

## Audit Summary

### BLOCKER (1 issue)
- **B1**: `RangeSelector` click handler resolves `target` via `closest('[data-message-id]')` which can return the virtual row wrapper, but `getMessageElements()` returns card elements (`[data-component]`). The `indexOf()` comparison fails, making range selection silently select wrong indices or nothing.

### MAJOR (5 issues)
- **M1**: `getSelectedMessageIds()` scans `[data-message-id]` matching both virtual rows and card elements — when both carry `.selected`, the same message ID appears twice in the result array.
- **M2**: `SummarizeFlow` modal has no guard against double-open — clicking the Summarize button while a modal is open spawns a second modal on top.
- **M3**: `worker.ts:654` checks `entrySettings?.worldBookId` as a fallback, but `settingsToCreateInput()` intentionally strips that field — unreachable dead code.
- **M4**: `SummarizeButton` MutationObserver fires on `attributes + childList + subtree` over the entire chat container — every character typed triggers a full `getSelectedMessageIds()` DOM scan.
- **M5**: `SummarizeFlow.handleOpenConnectionsDrawer` uses hardcoded button `title="Connections"` and text `"More actions"` — fragile to Lumiverse UI updates.

### MINOR (7 issues)
- **m1**: `LorebookManager` dropdown has no `<option>` for `__default__` — restoring an old localStorage value of `__default__` shows a blank/empty dropdown selection.
- **m2**: No progress feedback during 2-minute LLM wait — user sees just a spinner with no intermediate status updates.
- **m3**: `_pendingSummaries` cleanup interval runs every 5 minutes but TTL is 30 minutes — expired entries linger for up to 25 minutes after becoming eligible.
- **m4**: `ConnectionManager` and `LorebookManager` have a 5-second timeout fallback — if the backend takes >5s (loaded server, slow DB), the dropdown shows "Loading…" indefinitely.
- **m5**: `SummarizeFlow` sends `discard_summary` on unmount, but the backend handler sends no response. If the frontend crashes mid-transit, the backend keeps a stale pending entry for 30 minutes.
- **m6**: `handleOpenConnectionsDrawer` assumes the first `[title="More actions"]` button in the DOM belongs to a connection item — could blink the wrong button.
- **m7**: `handleRetry` uses `lastCustomPrompt` which is stale if the user edits the prompt between the error and clicking Retry.

---

## Tasks

### Task 1: Fix RangeSelector DOM element mismatch (B1)

**Objective:** Fix the `closest('[data-message-id]')` → `getMessageElements()` mismatch that prevents range selection from working when the click target resolves to the virtual row wrapper instead of the card element.

**Files:**
- Modify: `src/components/RangeSelector.tsx`

**Step 1: Add card element resolution**

After `const allEls = getMessageElements()` (line 158), add resolution logic:

```ts
// target may be the virtual row wrapper (which also has data-message-id
// but not data-component) or the card element itself. Resolve to the
// card element so indexOf() against getMessageElements() works.
const cardEl = target.matches('[data-component="BubbleMessage"], [data-component="MinimalMessage"]')
  ? target
  : (target.querySelector('[data-component="BubbleMessage"], [data-component="MinimalMessage"]') as HTMLElement | null)
    ?? (target.closest('[data-component="BubbleMessage"], [data-component="MinimalMessage"]') as HTMLElement | null)
const idx = cardEl ? allEls.indexOf(cardEl) : -1
```

Also update the display index lookup (line 163) to use `cardEl` since the virtual row is the parent:

```ts
const virtualRow = (cardEl ?? target).closest('[data-virtual-index]') as HTMLElement | null
```

The full replacement for lines 158-165:
```ts
      const allEls = getMessageElements()
      // Resolve to the card element: target could be the virtual row wrapper
      // (which has data-message-id but not data-component) or the card directly.
      const cardEl = target.matches('[data-component="BubbleMessage"], [data-component="MinimalMessage"]')
        ? target
        : (target.querySelector('[data-component="BubbleMessage"], [data-component="MinimalMessage"]') as HTMLElement | null)
          ?? (target.closest('[data-component="BubbleMessage"], [data-component="MinimalMessage"]') as HTMLElement | null)
      const idx = cardEl ? allEls.indexOf(cardEl) : -1

      // Read the Lumiverse message index (data-message-index on VirtualRow)
      // for display — matches what Lumiverse shows on the message label (#0 = first)
      const virtualRow = (cardEl ?? target).closest('[data-virtual-index]') as HTMLElement | null
      const msgIndexAttr = virtualRow?.getAttribute('data-message-index') ?? null
      const displayIdx = msgIndexAttr !== null ? parseInt(msgIndexAttr, 10) : idx
```

**Step 2: Type-check**

```bash
cd ~/chronicle_ext && bun run check
# Expected: 0 errors
```

**Step 3: Manual test**

1. Open Lumiverse, enter a chat with messages
2. Click "Select Range" in Chronicle bar
3. Click message #2, then message #6
4. Verify messages 2-6 are properly selected with highlights
5. Try clicking on different parts of messages (text, padding, avatar edges) — all should work

**Step 4: Commit**

```bash
git add src/components/RangeSelector.tsx
git commit -m "fix: resolve card element from virtual row for range selection

closest('[data-message-id]') could return the virtual row wrapper instead
of the card element, causing indexOf() to return -1 and range selection
to silently fail. Now resolves to the card via matches/querySelector/
closest fallback chain."
```

---

### Task 2: Deduplicate getSelectedMessageIds() (M1)

**Objective:** Prevent duplicate message IDs when both the virtual row wrapper and card element match `[data-message-id]` and both carry the `.selected` class.

**Files:**
- Modify: `src/select-mode.ts`

**Step 1: Add Set-based dedup**

Replace the function body:

```ts
export function getSelectedMessageIds(): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  document.querySelectorAll('[data-message-id]').forEach((el) => {
    const classStr = (el as HTMLElement).className
    if (typeof classStr === 'string' && classStr.includes('selected')) {
      const mid = el.getAttribute('data-message-id')
      if (mid && !seen.has(mid)) {
        seen.add(mid)
        ids.push(mid)
      }
    }
  })
  return ids
}
```

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/select-mode.ts
git commit -m "fix: deduplicate getSelectedMessageIds() results

[data-message-id] matches both virtual row wrappers and card elements.
When both carry .selected, the same message ID appeared twice.
Now uses a Set for deduplication."
```

---

### Task 3: Guard against double modal open (M2)

**Objective:** Prevent opening a second Chronicle modal when one is already open.

**Files:**
- Modify: `src/main.tsx`

**Step 1: Add modal-open guard with safety timeout**

In `setup()`, add a flag before `openChronicleModal`. Set `_modalOpen` only AFTER `showModal()` succeeds, and add a 60s safety timeout in case `onDismiss` never fires:

```ts
let _modalOpen = false
let _modalSafetyTimer: ReturnType<typeof setTimeout> | null = null

function openChronicleModal(count: number) {
  if (count === 0) return
  if (!spindleCtx) return
  if (_modalOpen) return  // Guard against double-open

  const modal = spindleCtx.ui.showModal({
    title: 'Chronicle — Summarize',
    width: 520,
    maxHeight: 600,
  })

  _modalOpen = true

  render(
    <ChronicleContext.Provider value={spindleCtx}>
      <ErrorBoundary name="modal">
        <ChronicleModalShell count={count} onClose={() => modal.dismiss()} />
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

  // Safety timeout: if onDismiss never fires (abnormal teardown), release after 60s
  _modalSafetyTimer = setTimeout(() => {
    _modalOpen = false
    _modalSafetyTimer = null
  }, 60_000)
}
```

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/main.tsx
git commit -m "fix: guard against double modal open

A second Chronicle modal could be opened on top of an existing one
by clicking the Summarize button while a modal was already visible.
Now returns early if a modal is open."
```

---

### Task 4: Remove dead worldBookId check in worker.ts (M3)

**Objective:** Remove unreachable `entrySettings?.worldBookId` fallback in `saveLorebookEntry` — `settingsToCreateInput()` strips this field.

**Files:**
- Modify: `src/worker.ts`
- Modify: `src/settings.ts`

**Step 1: Remove dead code**

In `worker.ts`, delete lines 654-656:
```ts
// DELETE these three lines:
  // Use settings.worldBookId if provided (user selected a specific book)
  if (!targetBookId && entrySettings?.worldBookId) {
    targetBookId = entrySettings.worldBookId as string
  }
```

**Step 2: Clarify the comment in settings.ts**

In `settingsToCreateInput()`, update the comment (line 265-268):
```ts
    // NOTE: worldBookId intentionally omitted — it's a client-side routing
    // field for lorebook selection UI. It is NOT a valid CreateWorldBookEntry
    // API field. The backend receives the lorebook ID via the separate
    // lorebookId request field, never through entrySettings.
```

**Step 3: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/worker.ts src/settings.ts
git commit -m "fix: remove dead worldBookId fallback in saveLorebookEntry

settingsToCreateInput intentionally omits worldBookId (it's a routing
field passed via the separate lorebookId request parameter). The
fallback check in saveLorebookEntry was unreachable dead code."
```

---

### Task 5: Narrow MutationObserver scope (M4)

**Objective:** Reduce the MutationObserver's DOM scan cost by limiting observed mutations to only attribute changes on `data-message-id` and `data-select-mode`, filtering out childList mutations that don't affect selection state.

**Files:**
- Modify: `src/components/SummarizeButton.tsx`

**Step 1: Use attributeFilter and filter mutations**

Replace the observer config to only watch for relevant attribute changes:

```ts
useEffect(() => {
  let pendingUpdate = false

  const updateCount = () => {
    if (pendingUpdate) return
    pendingUpdate = true
    requestAnimationFrame(() => {
      const ids = getSelectedMessageIds()
      setSelectedCount(ids.length)
      pendingUpdate = false
    })
  }

  updateCount()

  const observer = new MutationObserver((mutations) => {
    // Only react to mutations that could affect selection state:
    // - attribute changes on elements with data-message-id (class changes for .selected)
    // - attribute changes on data-select-mode (select mode toggle)
    for (const m of mutations) {
      if (m.type === 'attributes') {
        const el = m.target as Element
        if (el.hasAttribute('data-message-id') || el.hasAttribute('data-select-mode')) {
          updateCount()
          break
        }
      }
    }
  })

  const chatContainer = document.querySelector('[data-select-mode]')
    ?? document.querySelector('[class*="chatColumnInner"]')
  if (chatContainer) {
    observer.observe(chatContainer, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class', 'data-select-mode', 'data-message-id'],
    })
    // Also observe for childList (new messages loading) — but only react
    // to actual node additions, not every character typed
    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    })
  }

  return () => observer.disconnect()
}, [])
```

**Wait** — this is getting complicated. A simpler approach: keep the current observer but filter mutations in the callback to only trigger `updateCount()` when actually needed. Let me simplify:

```ts
const observer = new MutationObserver((mutations) => {
  // Skip mutations that can't affect message selection state
  for (const m of mutations) {
    if (m.type === 'attributes') {
      if (m.attributeName === 'class' || m.attributeName === 'data-select-mode') {
        updateCount()
        break
      }
    }
    if (m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
      // Only react if nodes were added/removed (new messages, deletion)
      for (const node of m.addedNodes) {
        if (node instanceof Element && (node.hasAttribute('data-message-id') || node.querySelector('[data-message-id]'))) {
          updateCount()
          return
        }
      }
    }
  }
})
```

Actually, this is getting overengineered. The `requestAnimationFrame` debounce already prevents excessive re-scans. The real cost is running `getSelectedMessageIds()` on every mutation. Let me use a simpler approach: debounce with a longer interval.

**Revised approach — simpler debounce:**

```ts
const observer = new MutationObserver(() => {
  if (pendingUpdate) return
  pendingUpdate = true
  // Use a slightly longer debounce to batch rapid mutations
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const ids = getSelectedMessageIds()
      setSelectedCount(ids.length)
      pendingUpdate = false
    })
  })
})
```

A double `rAF` debounce (≈32ms) batches mutations within a single frame while still feeling instant to the user.

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/components/SummarizeButton.tsx
git commit -m "perf: double rAF debounce on MutationObserver

The observer fired getSelectedMessageIds() on every DOM mutation
including keystrokes. Double requestAnimationFrame debounce batches
rapid mutations within ~32ms, reducing full DOM scans significantly."
```

---

### Task 6: Scope More actions blink to connections panel (M5 + m6)

**Objective:** Scope the "More actions" button query to the Connections panel to avoid blinking the wrong button. Remove speculative fallback selectors that can't be verified against the actual Lumiverse DOM.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx`

**Step 1: Scope the More actions query**

The "More actions" button blink should only target buttons inside the connections area. Replace the un-scoped query with one scoped to the drawer panel content:

```ts
// Blink the first More actions button inside the connections panel
setTimeout(() => {
  // Scope to the drawer panel to avoid matching More actions buttons elsewhere
  const drawer = document.querySelector('[class*="viewportDrawer"], [class*="drawerContent"]')
  const moreBtns = drawer?.querySelectorAll<HTMLElement>('button[title="More actions"]')
  if (moreBtns && moreBtns.length > 0) {
    const moreBtn = moreBtns[0]
    moreBtn.classList.remove('chronicle-conn-highlight')
    void moreBtn.offsetWidth
    moreBtn.classList.add('chronicle-conn-highlight')
  }
}, 800)
```

The `button[title="Connections"]` selector is left as-is — it's a known, stable Lumiverse sidebar tab title. The `[class*="viewportDrawer"]` and `[class*="drawerContent"]` are best-effort scoping; if neither matches in a future Lumiverse version, the blink silently does nothing (no error, no wrong blink).

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/components/SummarizeFlow.tsx
git commit -m "fix: scope More actions blink to drawer panel

Previously assumed the first [title=\"More actions\"] in the DOM
belongs to a connection item. Now scoped to viewportDrawer/DrawerContent
to avoid blinking unrelated buttons. Falls back silently if scoping
selectors don't match in a future Lumiverse version."
```

---

### Task 7: Add __default__ option to LorebookManager dropdown (m1)

**Objective:** Handle the legacy `__default__` value stored in localStorage. `__default__` means "use the Chronicle book" (backend falls back to `getOrCreateChronicleBook`). We should normalize it away rather than silently converting to auto-generate.

**Files:**
- Modify: `src/components/LorebookManager.tsx`

**Step 1: Normalize __default__ on restore**

In `restoreSelection()`, treat `__default__` as a stale key and remove it, falling back to `AUTO_GENERATE_ID`:

```ts
const restoreSelection = (): string => {
  try {
    const saved = localStorage.getItem(LOREBOOK_SELECTED_KEY)
    if (saved) {
      // __default__ is a legacy value — normalize away
      if (saved === DEFAULT_LOREBOOK_ID) {
        localStorage.removeItem(LOREBOOK_SELECTED_KEY)
        return AUTO_GENERATE_ID
      }
      return saved
    }
  } catch {}
  return AUTO_GENERATE_ID
}
```

This means: if you had `__default__` (equivalent to "use Chronicle book"), it now becomes `__auto_generate__` (create Chronicle_N). This IS a behavior change from v1 → v2, because `__default__` no longer exists as a concept — we removed it in favor of explicit book selection via the dropdown. `__auto_generate__` is the closest equivalent (creates a new book per summary session).

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/components/LorebookManager.tsx
git commit -m "fix: normalize legacy __default__ lorebook value

Old localStorage values of __default__ are now migrated to
AUTO_GENERATE_ID on restore. __default__ was a v1 concept for
'use Chronicle book'; v2 uses explicit book selection via dropdown.
__auto_generate__ (create Chronicle_N) is the closest equivalent."
```

**Note:** If the user explicitly wants the shared Chronicle book (not auto-generate), they should select the Chronicle book from the user lorebooks list in the dropdown. The `__auto_generate__` default is a reasonable fallback.

---

### Task 8: Narrow MutationObserver filter + double-rAF in SummarizeButton (M4 alt — already done in Task 5)

Already handled in Task 5.

---

### Task 9: Add LLM progress stage callback (m2)

**Objective:** Give the user more feedback during the 2-minute LLM wait by sending an intermediate progress event from the backend.

**Files:**
- Modify: `src/worker.ts`

**Step 1: Add progress event after message fetch**

In `handleSummarizeV2`, after successfully fetching messages and before calling `generateSummary`, the backend already sends `stage: 'generating'`. The issue is that's the ONLY event during generation. The LLM call itself provides no intermediate progress.

Since we can't signal mid-generation (it's a single `generate.quiet()` call), the best approach is to send the progress event with an estimated time:

```ts
// In handleSummarizeV2, before step 4 (generateSummary):
spindle.sendToFrontend({
  type: 'summarize_progress',
  stage: 'generating',
  message: `Summarizing ${messages.length} messages...`,
}, userId)
```

This is already done (line 175-176 in `generateSummary`). The `summarize_progress` with `stage: 'generating'` fires inside `generateSummary`. So the frontend already knows when generation starts.

Actually, the real missing feedback is: the SummarizeFlow component doesn't display the progress stage text. The `summarize_progress` handler (line 95-100) only checks for `stage === 'saving'`. Let me add a progress text display.

**Revised: Add progress text to SummarizeFlow**

In `SummarizeFlow.tsx`, update the progress handler to show stage text:

```tsx
case 'summarize_progress': {
  if ((msg.stage as string) === 'saving') {
    setFlowState('saving')
  }
  // Show stage message if provided
  if (msg.message) {
    setErrorMessage(null)
    // Could use a separate state for progress text, but keeping simple:
    // just update flowState to reflect what's happening
  }
  break
}
```

Actually this is minor and the spinner already communicates "working." Let me drop this from the plan — it's low-impact and not really a bug.

Let me remove m2 entirely. The remaining issues are now m3-m7.

---

### Task 8 (was 9): Tighten pending summary cleanup (m3)

**Objective:** Run cleanup more frequently so expired entries are cleaned within ~5 minutes of expiry instead of up to 30 minutes later.

**Files:**
- Modify: `src/worker.ts`

**Step 1: Increase cleanup interval**

Change line 120 from 5 minutes to 1 minute, or better yet, just clean up after each TTL window:

```diff
-}, 5 * 60 * 1000)
+}, 60 * 1000) // Check every minute (was every 5 min — expired entries could linger 25 min)
```

This is a 1-line change. The performance cost is negligible (iterating a Map that typically has 0-2 entries).

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/worker.ts
git commit -m "fix: run pending summary cleanup every 60s

Previously ran every 5 minutes; expired entries could linger up to
25 minutes. Now checks every 60 seconds for more timely cleanup."
```

---

### Task 9 (was 10): Increase timeout for ConnectionManager/LorebookManager (m4)

**Objective:** Give the backend more time before showing "Loading…" forever — increase timeout from 5s to 15s with a retry indicator.

**Files:**
- Modify: `src/components/ConnectionManager.tsx`
- Modify: `src/components/LorebookManager.tsx`

**Step 1: Increase timeouts**

In both files, change the timeout from 5_000 to 15_000:

ConnectionManager.tsx line 43:
```diff
-    const timer = setTimeout(() => setFetching(false), 5_000)
+    const timer = setTimeout(() => setFetching(false), 15_000)
```

LorebookManager.tsx line 58:
```diff
-    const timer = setTimeout(() => setFetching(false), 5_000)
+    const timer = setTimeout(() => setFetching(false), 15_000)
```

The backend's own timeouts are 10s (`handleListConnections`) and 10s (`handleListLorebooks`), so 15s gives a 5s buffer.

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/components/ConnectionManager.tsx src/components/LorebookManager.tsx
git commit -m "fix: increase fetch timeout to 15s in ConnectionManager and LorebookManager

Backend handlers have 10s timeouts. The 5s frontend timeout could
fire before the backend responds, showing permanent 'Loading…'.
Now set to 15s to give the backend time plus a buffer."
```

---

### Task 10: Send discard confirmation from backend (m5)

**Objective:** Send a `discard_confirmed` response from the backend so the protocol is complete and the frontend has a confirmed event for future use. Also declare the type in `types.ts` (single source of truth).

**Files:**
- Modify: `src/types.ts`
- Modify: `src/worker.ts`
- Modify: `src/backend-relay.ts`

**Step 1: Add DiscardConfirmed type in types.ts**

Add after `DiscardSummaryRequest` and include in `BackendToFrontend`:

```ts
export interface DiscardConfirmed {
  type: 'discard_confirmed'
  requestId: string
}
```

In `BackendToFrontend` union, add `| DiscardConfirmed`.

**Step 2: Send response from handleDiscardSummary**

```ts
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
```

**Step 3: Forward in backend-relay.ts**

Add `'discard_confirmed'` to the switch statement so it reaches the components:

```ts
case 'discard_confirmed':
```

**Step 4: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/types.ts src/worker.ts src/backend-relay.ts
git commit -m "fix: add discard_confirmed protocol event

Previously the discard handler was fire-and-forget with no response.
Now sends discard_confirmed and declares it in types.ts (canonical
protocol) and forwards via backend-relay for future frontend use."
```

---

### Task 11: Fix stale lastCustomPrompt in both Retry paths (m7 + B1)

**Objective:** Use the current `activePrompt` value on retry instead of the prompt that was used when the original generate call was made. Fixes both `handleRetry` AND the inline error-state Retry button.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx`

**Step 1: Fix handleRetry**

```ts
const handleRetry = useCallback(() => {
  if (preview) {
    discardPending(preview.requestId)
  }
  setPreview(null)
  setErrorMessage(null)
  handleCreateSummary(activePrompt)  // was: lastCustomPrompt
}, [preview, discardPending, handleCreateSummary, activePrompt])
```

**Step 2: Fix error-state inline Retry button**

Line 360: `onClick={() => handleCreateSummary(lastCustomPrompt)}`:
```diff
-            onClick={() => handleCreateSummary(lastCustomPrompt)}
+            onClick={() => handleCreateSummary(activePrompt)}
```

**Step 3: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/components/SummarizeFlow.tsx
git commit -m "fix: use current prompt on retry, not stale one

Both handleRetry and the error-state Retry button used lastCustomPrompt
which captured the prompt at the time of the original generate call. If
the user edited the prompt after an error appeared, clicking Retry used
the old prompt. Now uses the current activePrompt value in both paths."
```

---

### Task 12: Prevent save-vs-discard race during saving state (M8)

**Objective:** Prevent the unmount cleanup from sending `discard_summary` while a save is in progress, which would cause `handleSaveSummary` to fail with "Preview has expired."

**Files:**
- Modify: `src/components/SummarizeFlow.tsx`

**Step 1: Gate unmount discard on flowState via ref**

The cleanup closure captures `flowState` from the last render (stale closure). Use a ref to track the live value:

```ts
const flowStateRef = useRef<FlowState>('idle')
flowStateRef.current = flowState

// Cleanup on unmount: discard any active preview (unless saving/saved)
useEffect(() => {
  return () => {
    if (flowStateRef.current === 'saving' || flowStateRef.current === 'saved') return
    const activePreview = previewRef.current
    if (activePreview) {
      try {
        ctx?.sendToBackend({ type: 'discard_summary', requestId: activePreview.requestId })
      } catch {}
    }
  }
}, [ctx])
```

**Step 2: Build + commit**

```bash
cd ~/chronicle_ext && bun run check
git add src/components/SummarizeFlow.tsx
git commit -m "fix: prevent unmount discard from racing with save

If the modal was closed during save, the unmount cleanup sent
discard_summary which could race with the backend's save handler.
Now skips discard when flowState is 'saving' or 'saved'."
```

---

## Verification

After all tasks are complete:

```bash
cd ~/chronicle_ext
bun run check                            # 0 TypeScript errors
./build.sh                               # Both bundles build and deploy

# Post-deploy verification greps:
grep -c 'cardEl' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: 1 (card resolution logic landed)

grep -c 'new Set.*data-message-id\|seen.has' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: > 0 (dedup logic landed)

grep -c '_modalOpen' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: >= 3 (guard + safety timer present)

grep -c '_modalSafetyTimer' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: > 0 (safety timeout landed)

grep -c 'worldBookId' ~/Lumiverse/data/extensions/chronicle/repo/dist/worker.js
# Expected: 2-3 (only in WorldBookCreateDTO usage + comment; was ~5 before)

grep -c 'discard_confirmed' ~/Lumiverse/data/extensions/chronicle/repo/dist/worker.js
# Expected: 1

grep -c 'DiscardConfirmed' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: 0 (type-only, stripped by bundler — fine)

grep -c 'discard_confirmed' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: 1 (forwarded in backend-relay)

grep -c 'flowStateRef' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: >= 2 (ref declaration + usage in cleanup)

grep -c 'activePrompt' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: >= 4 (appears in handleRetry, error Retry, and activePrompt computation)

grep -c 'viewportDrawer\|drawerContent' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: >= 2 (More actions scoping landed)

grep -c '__default__' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: >= 2 (DEFAULT_LOREBOOK_ID constant + migration logic)
```
