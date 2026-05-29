# Generating Summary Toast — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** When the user clicks "Generate and Preview", hide the Chronicle modal immediately and show a small non-intrusive "Generating summary…" toast at top-center of the screen. When generation completes: if success, open the preview modal; if failure, show the error in the toast with a 4-second auto-fade.

**Architecture:** The key insight is that `SummarizeFlow` is currently rendered inside a Spindle modal. When we dismiss that modal during generation, the Preact component unmounts — taking its `chronicle:backend-message` event listener with it. To bridge this gap, `main.tsx` must handle the `summarize_preview` and `summarize_failed` events at a level that survives modal dismissal. A shared summary-state object in the `setup()` closure tracks generation context across modal open/close. The toast is a small Preact component injected directly into `document.body` (not using Spindle's modal API), positioned `fixed` at top-center.

**Tech Stack:** Preact, TypeScript, Spindle frontend API, Bun build

**Status:** ✅ Implemented (commits `1768dbd`, `95f1771`, `23458c1`, `5e4dd46`)

---

## Implementation Notes (post-review)

The following fixes were applied after the initial implementation, addressing issues discovered during a tear-it-apart review:

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **BLOCKER** | `openPreviewModal` didn't pass `onGenerateStart` — retry from preview showed blank screen | Added `onGenerateStart` callback to preview modal (same pattern as setup modal) |
| 2 | **Major** | Retry from preview lost custom prompt — fresh SummarizeFlow mount initialized `activePrompt` to `undefined` | Added `initialActivePrompt` prop, seeded from `_generationActivePrompt` |
| 3 | **Minor** | Retry lost connection override — `connectionId` initialized to `undefined` | Added `initialConnectionId` prop, seeded from `_generationConnectionId` |
| 4 | **Minor** | `_generating` flag could deadlock permanently if backend never responds | Added 5-min safety timeout via `startGenerating()`/`stopGenerating()` |
| 5 | **Minor** | Stale `_modalSafetyTimer` from first modal could kill second modal's timer | `openPreviewModal` clears existing timer before setting new one |

---

## Design Decisions

1. **Toast is DOM-injected, not a Spindle modal.** Spindle modals block background interaction. The whole point is to let the user interact with chat/drawer during generation — so the popup uses direct DOM injection with `position: fixed`.

2. **`main.tsx` owns the generation lifecycle.** The `SummarizeFlow` component fires-and-forgets: it calls `onGenerateStart(params)` then exits. `main.tsx` takes over — dismissing the modal, showing the toast, listening for the result, and reopening a modal for the preview.

3. **`SummarizeFlow` keeps its own listener for in-modal events.** Events that only occur while the modal IS open (`summarize_saved`, `summarize_progress`) stay in the component. Only `summarize_preview` and `summarize_failed` need the module-level handler.

4. **A `_generating` guard prevents double-trigger.** Similar to `_modalOpen`, a `_generating` flag prevents the user from clicking the Summarize button while a generation is in flight.

5. **Preview state is passed as a prop when reopening.** When `main.tsx` reopens the modal for preview, it passes `preview={data}` as a prop. `SummarizeFlow` detects this and starts in preview mode directly.

---

## Task List

### Task 1: Add toast CSS styles to `styles.ts`

**Objective:** Add CSS for the fixed-position toast popup and its fade animation.

**Files:**
- Modify: `src/styles.ts`

**Step 1: Add toast styles after the existing CSS**

Add these styles inside the `getChronicleCSS()` template literal, after the existing keyframe animations:

```css
/* ── Summary Generation Toast ─────────────────────── */
.chronicle-toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: var(--lumiverse-surface, #1e1e2e);
  border: 1px solid var(--lumiverse-border, #313244);
  border-radius: 10px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  font-size: calc(13px * var(--lumiverse-font-scale, 1));
  color: var(--lumiverse-text);
  max-width: 420px;
  white-space: nowrap;
  transition: opacity 0.4s ease;
}
.chronicle-toast-fading {
  opacity: 0;
}
.chronicle-toast-error {
  border-color: var(--chronicle-error-border);
}
```

**Step 2: Verify**

```bash
cd ~/chronicle_ext && bun run check
# Expected: 0 errors
```

---

### Task 2: Create `SummaryToast` Preact component

**Objective:** A small component that renders the toast with three states: generating, error, and fading-out.

**Files:**
- Create: `src/components/SummaryToast.tsx`

**Step 1: Write the component**

```tsx
import type { FunctionComponent } from 'preact'
import { useEffect, useState, useRef } from 'preact/hooks'

export type ToastState = 'generating' | 'error' | 'success'

interface Props {
  state: ToastState
  message: string
  onDone?: () => void          // called after fade completes (for error/success)
}

export const SummaryToast: FunctionComponent<Props> = ({ state, message, onDone }) => {
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // For error state, start fade after 4 seconds
    if (state === 'error') {
      timerRef.current = setTimeout(() => {
        setFading(true)
        // After CSS transition completes (400ms), call onDone
        setTimeout(() => onDone?.(), 450)
      }, 4000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state, onDone])

  const isError = state === 'error'

  return (
    <div class={`chronicle-toast${isError ? ' chronicle-toast-error' : ''}${fading ? ' chronicle-toast-fading' : ''}`}>
      {state === 'generating' && <span class="chronicle-summarize-spinner" />}
      <span>{message}</span>
    </div>
  )
}
```

**Step 2: Verify**

```bash
cd ~/chronicle_ext && bun run check
# Expected: 0 errors
```

---

### Task 3: Add toast management + generation state to `main.tsx`

**Objective:** Add module-level state tracking generation, plus functions to inject/dismiss the toast. Also add a module-level listener for `summarize_preview` and `summarize_failed` that fires regardless of modal state.

**Files:**
- Modify: `src/main.tsx`

**Step 1: Add imports**

Add to existing imports:
```ts
import { SummaryToast, type ToastState } from './components/SummaryToast'
```

**Step 2: Add summary state + toast management inside `setup()` closure**

Add these variables inside `setup()`, after the `const _renders` line (line ~49):

```ts
// ── Summary generation state (survives modal dismiss) ──
let _generating = false
let _generationSelectedCount = 0
let _generationEntrySettings: EntrySettings = { ...DEFAULT_SETTINGS }
let _generationLorebookId: string | undefined
let _generationActivePrompt: string | undefined
let _generationConnectionId: string | undefined
let _toastCleanup: (() => void) | null = null

function showSummaryToast(state: ToastState, message: string) {
  // Dismiss any existing toast first
  dismissSummaryToast()

  const mount = document.createElement('div')
  mount.setAttribute('data-chronicle', 'toast')
  document.body.appendChild(mount)

  const cleanup = () => {
    render(null as any, mount)
    mount.remove()
    if (_toastCleanup === cleanup) _toastCleanup = null
  }

  render(
    <SummaryToast
      state={state}
      message={message}
      onDone={state !== 'generating' ? cleanup : undefined}
    />,
    mount
  )

  _toastCleanup = cleanup
}

function dismissSummaryToast() {
  _toastCleanup?.()
  _toastCleanup = null
}
```

**Step 3: Add the module-level backend listener**

After the `setupBackendListener` call (line ~141), add a SECOND listener that handles events when the modal is not open:

```ts
// Module-level listener for summarize_preview / summarize_failed
// — runs regardless of modal state, handles toast ↔ modal transition
spindleCtx.onBackendMessage((payload: unknown) => {
  const msg = payload as Record<string, unknown> | null
  if (!msg || typeof msg.type !== 'string') return

  if (msg.type === 'summarize_preview' && _generating) {
    const data = msg as unknown as SummarizePreview
    _generating = false
    dismissSummaryToast()
    // Open modal with preview data
    openPreviewModal(data, _generationSelectedCount)
    return
  }

  if (msg.type === 'summarize_failed' && _generating) {
    _generating = false
    const errorMsg = (msg.error as string) || 'Unknown error occurred.'
    showSummaryToast('error', `Summary failed: ${errorMsg}`)
    return
  }
})
```

> **Note:** This listener fires in addition to `backend-relay.ts`'s existing listener, but `backend-relay.ts` dispatches `chronicle:backend-message` CustomEvents — which the (now unmounted) `SummarizeFlow` won't receive. This new listener catches the events directly from `onBackendMessage`. There's no conflict because:
> - `setupBackendListener` → CustomEvents → picked up by `SummarizeFlow` when modal is open
> - This new listener → direct handling → picks up when `_generating` is true and modal is closed

**Step 4: Add `openPreviewModal` function**

After `openChronicleModal` (after line ~106), add:

```ts
function openPreviewModal(preview: SummarizePreview, count: number) {
  if (!spindleCtx) return
  if (_modalOpen) return

  const modal = spindleCtx.ui.showModal({
    title: 'Chronicle — Preview',
    width: 520,
    maxHeight: 600,
  })

  _modalOpen = true

  render(
    <ChronicleContext.Provider value={spindleCtx}>
      <ErrorBoundary name="preview-modal">
        <SummarizeFlow
          selectedCount={count}
          preview={preview}
          entrySettings={_generationEntrySettings}
          lorebookId={_generationLorebookId}
          onRequestClose={() => modal.dismiss()}
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

**Step 5: Add `onGenerateStart` to `openChronicleModal`**

Modify `ChronicleModalShell` to accept an `onGenerateStart` callback:

```ts
function ChronicleModalShell({ count, onClose, onGenerateStart }: {
  count: number
  onClose: () => void
  onGenerateStart: (params: {
    customPrompt: string | undefined
    connectionId: string | undefined
    lorebookId: string | undefined
    entrySettings: EntrySettings
    activePrompt: string | undefined
  }) => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <SummarizeFlow
      selectedCount={count}
      onRequestClose={onClose}
      onGenerateStart={onGenerateStart}
    />
  )
}
```

And in `openChronicleModal`, pass `onGenerateStart`:

```ts
function openChronicleModal(count: number) {
  if (count === 0) return
  if (!spindleCtx) return
  if (_modalOpen || _generating) return  // Guard: no double-open while generating

  // ... existing modal creation code ...

  const handleGenerateStart = (params: {
    customPrompt: string | undefined
    connectionId: string | undefined
    lorebookId: string | undefined
    entrySettings: EntrySettings
    activePrompt: string | undefined
  }) => {
    // Store context for later use
    _generating = true
    _generationSelectedCount = count
    _generationEntrySettings = params.entrySettings
    _generationLorebookId = params.lorebookId
    _generationActivePrompt = params.activePrompt
    _generationConnectionId = params.connectionId

    showSummaryToast('generating', 'Generating summary…')
    modal.dismiss()  // This triggers dismissAndRelease + sets _modalOpen = false
  }

  render(
    <ChronicleContext.Provider value={spindleCtx}>
      <ErrorBoundary name="modal">
        <ChronicleModalShell
          count={count}
          onClose={() => modal.dismiss()}
          onGenerateStart={handleGenerateStart}
        />
      </ErrorBoundary>
    </ChronicleContext.Provider>,
    modal.root
  )
  // ... rest unchanged ...
}
```

**Step 6: Add missing import for SummarizePreview type**

Add at the top:
```ts
import type { SummarizePreview } from './types'
```

**Step 7: Verify**

```bash
cd ~/chronicle_ext && bun run check
# Expected: 0 errors
```

---

### Task 4: Update `SummarizeFlow` to accept preview prop + onGenerateStart callback

**Objective:** Modify the component so it can open in preview mode (when `preview` prop is provided) and calls `onGenerateStart` instead of showing the generating spinner in-modal.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx`

**Step 1: Extend Props interface**

```ts
interface Props {
  selectedCount: number
  onRequestClose?: () => void
  preview?: PreviewData | null            // NEW: pre-loaded preview (for reopen)
  entrySettings?: EntrySettings            // NEW: initial settings (for reopen)
  lorebookId?: string                      // NEW: initial lorebook (for reopen)
  onGenerateStart?: (params: {             // NEW: called when generate begins
    customPrompt: string | undefined
    connectionId: string | undefined
    lorebookId: string | undefined
    entrySettings: EntrySettings
    activePrompt: string | undefined
  }) => void
}
```

**Step 2: Initialize state from props**

Modify the initial `useState` calls:

```ts
const [flowState, setFlowState] = useState<FlowState>(
  preview ? 'preview' : 'idle'
)
const [previewData, setPreviewData] = useState<PreviewData | null>(
  preview ?? null
)
```

Use `previewData` internally (rename from `preview` to avoid shadowing the prop):

```ts
// Rename: useState's 'preview' → 'previewData'
// Rename: previewRef → previewDataRef
const [previewData, setPreviewData] = useState<PreviewData | null>(preview ?? null)
const previewDataRef = useRef<PreviewData | null>(preview ?? null)
```

**Step 3: Initialize other state from props**

```ts
const [entrySettings, setEntrySettings] = useState<EntrySettings>(
  entrySettingsProp ?? { ...DEFAULT_SETTINGS }
)
// where entrySettingsProp comes from props
```

Destructure prop at top:
```ts
const {
  selectedCount,
  onRequestClose,
  preview: previewProp,
  entrySettings: entrySettingsProp,
  lorebookId: lorebookIdProp,
  onGenerateStart,
} = props
```

**Step 4: Update references**

Update all references to the state variable:
- `preview` (state) → `previewData`
- `previewRef` → `previewDataRef`
- `setPreview` → `setPreviewData`

Update cleanup effect:
```ts
const activePreview = previewDataRef.current
```

Update `resetFlow`:
```ts
const resetFlow = useCallback(() => {
  setFlowState('idle')
  setPreviewData(null)
  setErrorMessage(null)
  setSummaryTitle('')
}, [])
```

Update `handleCreateSummary`:
```ts
const handleCreateSummary = useCallback((customPrompt?: string) => {
  if (selectedCount === 0) return

  if (previewData) {
    discardPending(previewData.requestId)
  }

  const ids = getSelectedMessageIds()
  if (ids.length === 0) {
    setFlowState('error')
    setErrorMessage('No messages currently selected.')
    return
  }

  try {
    sendToBackend({
      type: 'summarize_v2',
      protocolVersion: 1,
      messageIds: ids,
      customPrompt: customPrompt,
      previewOnly: true,
      connectionId: connectionId,
      worldBookId: lorebookId,
    })
  } catch (err) {
    setFlowState('error')
    setErrorMessage(`Failed to send request: ${err instanceof Error ? err.message : String(err)}`)
    return
  }

  // NEW: notify parent that generation has started
  onGenerateStart?.({
    customPrompt,
    connectionId,
    lorebookId,
    entrySettings,
    activePrompt: customPrompt ?? activePrompt,
  })

  // Don't set flowState to 'summarizing' — the modal will be dismissed
}, [selectedCount, sendToBackend, previewData, discardPending, connectionId, lorebookId, onGenerateStart, entrySettings, activePrompt])
```

**Step 5: When preview prop is provided, auto-set summary title**

Add an effect:
```ts
useEffect(() => {
  if (previewProp) {
    setSummaryTitle(previewProp.title)
  }
}, [previewProp])
```

**Step 6: Update `handleRetry`**

```ts
const handleRetry = useCallback(() => {
  if (previewData) {
    discardPending(previewData.requestId)
  }
  setPreviewData(null)
  setErrorMessage(null)
  handleCreateSummary(activePrompt)
}, [previewData, discardPending, handleCreateSummary, activePrompt])
```

**Step 7: Update `handleSave`**

```ts
const handleSave = useCallback(() => {
  if (!previewData) return
  const settingsInput = settingsToCreateInput(entrySettings)
  sendToBackend({
    type: 'save_summary',
    requestId: previewData.requestId,
    title: summaryTitle !== previewData.title ? summaryTitle : undefined,
    settings: settingsInput,
    lorebookId: lorebookId,
  })
}, [previewData, sendToBackend, summaryTitle, entrySettings, lorebookId])
```

**Step 8: Update `handleDiscard`**

```ts
const handleDiscard = useCallback(() => {
  if (!previewData) return
  discardPending(previewData.requestId)
  resetFlow()
}, [previewData, discardPending, resetFlow])
```

**Step 9: Update all references in JSX**

Replace `preview` with `previewData` in:
- `handleCreateSummary` (discard check)
- `handleRetry`
- `handleDiscard`
- `handleSave`
- Render conditions: `{flowState === 'preview' && previewData && (`
- Preview content: `{previewData.messageCount}`, `{previewData.content}`, `{previewData.title}`

**Step 10: Remove the "generating" in-modal display**

Remove this block (lines ~342-346):
```tsx
{flowState === 'summarizing' && selectedCount > 0 && (
  <div class="chronicle-sf-count">
    <span class="chronicle-summarize-spinner" /> Generating summary…
  </div>
)}
```

**Step 11: Verify**

```bash
cd ~/chronicle_ext && bun run check
# Expected: 0 errors
```

---

### Task 5: Clean up `backend-relay.ts` (no changes needed)

**Objective:** Verify the existing relay still works correctly with the new dual-listener pattern. No code changes — `backend-relay.ts` continues to dispatch `chronicle:backend-message` CustomEvents for `SummarizeFlow`'s in-modal listener. The new direct `onBackendMessage` handler in `main.tsx` is additive.

**Verification:** This task is documentation-only. Confirmed: the two listeners target different states and don't conflict.

---

### Task 6: End-to-end verification

**Objective:** Verify the complete flow by building and checking.

**Step 1: Build and deploy**

```bash
cd ~/chronicle_ext && ./build.sh
```

**Step 2: Grep for critical patterns**

```bash
# Toast component exists in frontend bundle
grep -c "chronicle-toast" ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: > 0

# onGenerateStart wired in
grep -c "onGenerateStart" ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: > 0

# preview prop handled
grep -c "previewProp" ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: > 0

# _generating guard present
grep -c "_generating" ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: > 0
```

**Step 3: Manual testing (requires Lumiverse)**

1. Open Lumiverse, select messages, click "Chronicle: Summarize"
2. Click "Generate and Preview"
3. Verify modal closes and toast appears at top-center: "Generating summary…"
4. While generating, verify chat scroll + drawer/sidebar are interactive
5. When preview arrives, verify preview modal opens automatically
6. On error, verify toast shows error message and fades after 4 seconds

**Step 4: Commit**

```bash
cd ~/chronicle_ext
git add -A
git commit -m "feat: dismiss modal during generation, show toast popup"
```

---

## Summary of Changes

| File | Action | Lines Changed |
|------|--------|---------------|
| `src/components/SummaryToast.tsx` | **New** | ~40 |
| `src/styles.ts` | Modify — add toast CSS | +30 |
| `src/main.tsx` | Modify — toast mgmt, preview modal, generate guard, dual listener | +80 |
| `src/components/SummarizeFlow.tsx` | Modify — preview prop, onGenerateStart, rename preview→previewData | ~30 changed |

**Total:** ~180 lines added/changed across 4 files. No protocol changes. No backend changes.
