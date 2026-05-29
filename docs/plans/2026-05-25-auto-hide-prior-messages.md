# Auto-Hide Prior Messages — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add "Auto-hide prior messages" toggle and "Number of prior messages to keep visible" controls to the Chronicle summarize menu, with backend support to hide messages after summarization.

**Architecture:** Two new UI controls in SummarizeFlow (toggle + number input) persisted to localStorage. The `summarize_v2` protocol gains `autoHidePrior`/`keepVisibleCount` fields. After save, the backend uses `spindle.chat.setMessagesHidden()` (bulk API, already available in Lumiverse) to hide messages prior to the first selected one, respecting the keep-visible count.

**Tech Stack:** TypeScript, Preact, Bun, Lumiverse Spindle API (`chat_mutation` permission already granted in `spindle.json`).

---

## Prerequisites

- `chat_mutation` permission already declared in `spindle.json` and granted by user
- `spindle.chat.setMessagesHidden(chatId: string, messageIds: string[], hidden: boolean): Promise<void>` — verified in Lumiverse source (`worker-runtime.ts:1562`)
- `spindle.chat.getMessages(chatId)` returns ALL messages ordered by `index_in_chat` ASC — verified (`chats.service.ts:1268`: `ORDER BY m.index_in_chat ASC`). Returns hidden messages too (no filter applied in the Spindle wrapper at `worker-host.ts:7862`)
- **Type workaround:** `setMessagesHidden` may not be in the published `lumiverse-spindle-types`. Use `(spindle.chat as any).setMessagesHidden(chatId, idsToHide, true)` or double-cast through unknown

---

### Task 1: Add auto-hide fields to protocol types

**Objective:** Extend `SummarizeRequestV2` and `PendingSummary` to carry auto-hide settings across the frontend↔backend boundary.

**Files:**
- Modify: `src/types.ts`
- Modify: `src/worker.ts` (PendingSummary interface)

**Step 1: Add fields to SummarizeRequestV2**

In `src/types.ts`, add two optional fields to `SummarizeRequestV2`:

```ts
export interface SummarizeRequestV2 {
  type: 'summarize_v2'
  protocolVersion: number
  messageIds: string[]
  worldBookId?: string
  title?: string
  customPrompt?: string
  previewOnly: boolean
  connectionId?: string
  // NEW
  autoHidePrior?: boolean        // auto-hide messages prior to first selected
  keepVisibleCount?: number      // number of prior messages to keep visible
}
```

**Step 2: Add fields to PendingSummary (worker.ts)**

In `src/worker.ts`, add the same two fields to the `PendingSummary` interface (around line 96-106):

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
  // NEW
  autoHidePrior?: boolean
  keepVisibleCount?: number
}
```

**Step 3: Store auto-hide fields in pending summary**

In `handleSummarizeV2` (around line 349-362), when creating the pending summary, copy `autoHidePrior` and `keepVisibleCount` from the request:

```ts
_pendingSummaries.set(requestId, {
  // ... existing fields ...
  autoHidePrior: req.autoHidePrior,
  keepVisibleCount: req.keepVisibleCount,
})
```

**Verification:** `bun run check` — 0 errors.

---

### Task 2: Implement backend message-hiding logic

**Objective:** After saving a summary, hide messages prior to the first selected message.

**Files:**
- Modify: `src/worker.ts`

**Step 1: Create `hideMessagesPriorTo` helper function**

Add a new function in `src/worker.ts` (before `handleSummarizeV2`):

```ts
/**
 * Hide messages prior to the first selected message.
 * If keepVisibleCount > 0, keeps that many messages immediately before the selection visible.
 *
 * getMessages() returns all messages ordered by index_in_chat ASC (verified in chats.service.ts:1268).
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
```

**Step 2: Call hideMessagesPriorTo from handleSaveSummary**

In `handleSaveSummary`, hide messages in BOTH the success path AND the timeout catch path.
If the save times out, the save may have succeeded server-side (known Spindle pattern) — hide anyway.

Replace the entire try/catch in `handleSaveSummary`:

```ts
try {
  const effectiveTitle = req.title?.trim() || pending.title
  const targetBookId = req.lorebookId || pending.worldBookId

  const saveResult = await Promise.race([
    saveLorebookEntry(
      { title: effectiveTitle, content: pending.content, keys: pending.keys },
      pending.chatId, pending.messageIds, targetBookId, userId, req.settings
    ),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Save request timed out after 15s')), 15_000)
    ),
  ])
  const { entryId, worldBookId } = saveResult

  _pendingSummaries.delete(req.requestId)

  // Hide prior messages on successful save
  if (pending.autoHidePrior) {
    hideMessagesPriorTo(
      pending.chatId, pending.messageIds, userId, pending.keepVisibleCount ?? 0
    ).catch((err) => {
      spindle.log.warn(`${LOG} hideMessagesPriorTo failed: ${err}`)
    })
  }

  spindle.sendToFrontend({
    type: 'summarize_saved',
    entryId, title: effectiveTitle,
    preview: pending.content.slice(0, 100), worldBookId,
  }, userId)
  spindle.log.info(`${LOG} Saved preview as lorebook entry "${effectiveTitle}" (${pending.messageIds.length} messages)`)
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err)

  // If save timed out, the save may have succeeded server-side — hide anyway
  if (pending.autoHidePrior && message.includes('timed out')) {
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
```

This is fire-and-forget because:
- The save is already committed (or assumed committed on timeout)
- Hide failures shouldn't block the user seeing confirmation
- `setMessagesHidden` is idempotent — calling it twice on the same messages is harmless

**Verification:** `bun run check` — 0 errors.

---

### Task 3: Add auto-hide UI controls to SummarizeFlow

**Objective:** Add toggle and number input under the "N messages selected" banner.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx`
- Modify: `src/styles.ts`

**Step 1: Add state variables**

In `SummarizeFlow`, add two new state variables:

```ts
// Auto-hide settings (persisted to localStorage)
const [autoHidePrior, setAutoHidePrior] = useState<boolean>(() => {
  try { return localStorage.getItem('chronicle:autoHidePrior') === 'true' } catch { return false }
})
const [keepVisibleCount, setKeepVisibleCount] = useState<number>(() => {
  try {
    const v = localStorage.getItem('chronicle:keepVisibleCount')
    return v ? Math.max(0, parseInt(v, 10) || 0) : 0
  } catch { return 0 }
})
```

**Step 2: Add localStorage persistence effects**

```ts
useEffect(() => {
  try { localStorage.setItem('chronicle:autoHidePrior', String(autoHidePrior)) } catch {}
}, [autoHidePrior])

useEffect(() => {
  try { localStorage.setItem('chronicle:keepVisibleCount', String(keepVisibleCount)) } catch {}
}, [keepVisibleCount])
```

**Step 3: Pass auto-hide settings to handleCreateSummary**

Modify `handleCreateSummary` to include the new fields in the `summarize_v2` payload AND add `autoHidePrior`/`keepVisibleCount` to the dependency array:

```ts
// In sendToBackend call:
sendToBackend({
  type: 'summarize_v2',
  protocolVersion: 1,
  messageIds: ids,
  customPrompt: customPrompt,
  previewOnly: true,
  connectionId: connectionId,
  worldBookId: lorebookId,
  autoHidePrior: autoHidePrior,                     // NEW
  keepVisibleCount: autoHidePrior ? keepVisibleCount : 0,  // NEW
})

// Update dependency array (end of useCallback):
}, [selectedCount, sendToBackend, previewData, discardPending, connectionId, lorebookId, onGenerateStart, entrySettings, activePrompt, autoHidePrior, keepVisibleCount])
```

**Step 4: Add JSX controls**

Add the new UI block between the count banner and `PromptManager`. The number input is always visible but **disabled (greyed out)** when the toggle is off:

```tsx
{/* Auto-hide controls */}
<div class="chronicle-sf-autohide">
  <label class="chronicle-sf-autohide-toggle">
    <input
      type="checkbox"
      checked={autoHidePrior}
      onChange={(e) => setAutoHidePrior((e.target as HTMLInputElement).checked)}
    />
    <span>Auto-hide prior messages</span>
  </label>
  <div class="chronicle-sf-autohide-count">
    <label class="chronicle-pm-label" style={{ opacity: autoHidePrior ? 1 : 0.5 }}>
      Number of prior messages to keep visible
    </label>
    <input
      class="chronicle-pm-input"
      type="number"
      min="0"
      step="1"
      value={keepVisibleCount}
      disabled={!autoHidePrior}
      onInput={(e) => {
        const raw = (e.target as HTMLInputElement).value
        if (raw === '') {
          setKeepVisibleCount(0)
        } else {
          const v = parseInt(raw, 10)
          if (!isNaN(v) && v >= 0) setKeepVisibleCount(v)
        }
      }}
      style={{ width: '80px', opacity: autoHidePrior ? 1 : 0.5 }}
    />
  </div>
</div>
```

**Step 5: Add CSS styles**

In `src/styles.ts`, add to `getChronicleCSS()` after the summarize-flow section:

```css
/* ── Auto-hide controls ─────────────────────────────── */
.chronicle-sf-autohide {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--lumiverse-fill-subtle);
  border: 1px solid var(--lumiverse-border);
  border-radius: 8px;
}

.chronicle-sf-autohide-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: calc(12px * var(--lumiverse-font-scale, 1));
  color: var(--lumiverse-text);
}

.chronicle-sf-autohide-toggle input[type="checkbox"] {
  margin: 0;
  accent-color: var(--lumiverse-primary);
}

.chronicle-sf-autohide-count {
  margin-top: 8px;
}
```

**Verification:** `bun run check` — 0 errors. Build and deploy. Hard-refresh browser and verify:
- Toggle visible below count banner
- Number input appears/disappears with toggle
- Values persist across modal open/close (localStorage)
- Worker log shows auto-hide fields in request: `grep "autoHidePrior" ~/Lumiverse/data/extensions/chronicle/repo/dist/worker.js` should return >0 matches

---

### Task 4: Wire auto-hide through main.tsx modal lifecycle

**Objective:** Ensure auto-hide settings are preserved across modal dismiss/reopen (via generation flow).

**Files:**
- No changes needed (preview modal already re-opens with `entrySettings`/`lorebookId`/etc.)

**Rationale:** The auto-hide settings are in localStorage, so they survive modal dismiss. They're also passed fresh each time `handleCreateSummary` is called — no need to thread them through the preview modal reopen flow. This is simpler than the entry settings pattern because auto-hide is a UI preference, not a per-summary user choice.

**Verification:** 
1. Set toggle ON, keep count = 5, generate a summary
2. Wait for preview modal, dismiss without saving
3. Reopen Chronicle modal — toggle should still be ON, count should still be 5

---

### Task 5: Commit and deploy

**Objective:** Commit all changes and verify deployment.

**Step 1: Verify TypeScript**

```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

**Step 2: Build**

```bash
cd ~/chronicle_ext && ./build.sh
```
Expected: frontend.js and worker.js both build, copied to runtime.

**Step 3: Commit**

```bash
cd ~/chronicle_ext
git add src/types.ts src/worker.ts src/components/SummarizeFlow.tsx src/styles.ts
git commit -m "feat: add auto-hide prior messages toggle with keep-visible count"
```

**Step 4: Post-deploy verification**

```bash
# Verify auto-hide fields in frontend bundle
grep -c "autoHidePrior" ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js

# Verify hide logic in worker bundle
grep -c "setMessagesHidden" ~/Lumiverse/data/extensions/chronicle/repo/dist/worker.js

# Verify localStorage keys in frontend
grep -c "chronicle:autoHidePrior" ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
```

---

## Design Decisions

### Hiding happens on save, not on generation
Rationale: The user might preview the summary before deciding to save. Hiding on generation would be destructive if they discard. Hiding on save is the correct trigger — the summary entry now represents those messages.

### Fire-and-forget hide (non-blocking)
Rationale: The save confirmation is more important than the hide. If the hide API hangs (known Spindle response-hang bug), the user still sees "Entry saved ✓". The hide is wrapped in a 10s timeout + catch.

### localStorage persistence for UI preferences
Rationale: These are user preferences (like prompt presets), not per-operation choices. localStorage is the established pattern (used by LorebookManager, PromptManager presets).

### Bulk hide via `setMessagesHidden`
Rationale: `spindle.chat.setMessagesHidden(chatId, messageIds, hidden)` exists in the Lumiverse runtime. Bulk call is O(1) vs N individual calls that could trigger the Spindle response-hang bug on each one.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| `keepVisibleCount` ≥ first selected index | No messages hidden (all prior messages kept) |
| `keepVisibleCount = 0` + toggle ON | All messages before first selected are hidden |
| Non-contiguous selection (e.g., #10, #50, #90) | Only messages before the **first** selected message (#0-#9) are hidden. Messages between selected messages (#11-#49, #51-#89) remain visible |
| Toggle is OFF | No auto-hide fields sent; existing behavior unchanged |
| Hide API fails (timeout/permission) | Non-fatal — logged, save still succeeds |
| Hide API hangs (Spindle response-hang) | 10s Promise.race timeout catches it |
| Save times out (Spindle response-hang) | Hide still fires (assumes save succeeded server-side) |
| Messages already hidden | `setMessagesHidden(id, true)` is idempotent |
| First selected message is message #0 | Nothing to hide (no messages before it) |
| Messages not loaded in chat viewport | `setMessagesHidden` operates at DB layer — works regardless of DOM state |

## Known Limitations

1. **No undo mechanism:** Hidden messages must be manually unhidden in Lumiverse (currently no UI for this). A future enhancement could add an "unhide" button or a restore-point system.
2. **No guard against re-hiding:** If the user summarizes the same message range multiple times, `hideMessagesPriorTo` will be called each time — harmless (idempotent) but wastes a Spindle API call.
3. **Save-timeout heuristic:** When save times out, we assume it succeeded and hide anyway. If the save genuinely failed (network error, not timeout), messages won't be hidden — this is the safer direction (under-hide is better than over-hide).

## E2E Verification (Manual)

After deployment and hard-refresh:

1. **Basic flow:** Enable toggle, set keep count = 3, select messages #10-#20, generate + save. Verify messages #0-#6 are hidden, #7-#9 remain visible.
2. **Toggle OFF:** Disable toggle, summarize. Verify no messages are hidden.
3. **Keep count = 0:** Enable toggle, keep count = 0, summarize messages #5-#10. Verify all messages #0-#4 are hidden.
4. **Persistence:** Set toggle ON, count = 5, close modal. Reopen. Verify values persist.
5. **No crash on empty:** Enable toggle, select message #0 as first. Save. Verify no error (nothing to hide).

---

## Risks

1. **`setMessagesHidden` response-hang (Low risk):** Mitigated by 10s Promise.race timeout.
2. **`setMessagesHidden` not in published types (Low risk):** Mitigated by `(spindle.chat as any)` cast.
3. **`getMessages` ordering assumption (Verified):** Confirmed `ORDER BY m.index_in_chat ASC` in `chats.service.ts:1268`. Returns all messages including hidden ones (no filter at Spindle layer, `worker-host.ts:7862`). Array index reliably matches chronological position.
4. **Performance with large chats (Low risk):** `getMessages` for a chat with thousands of messages may be slow. If this becomes a problem, we can optimize by passing the first message ID directly from the frontend. Not needed for initial implementation.
5. **Double-hide on retry (Low risk):** If user saves, gets error, retries, and saves again — hide fires twice. Idempotent (harmless) but wastes one API call.
