# Chronicle: Saved Toast + Toast Theme + Default Preset

> **For Hermes:** Implement directly. Three changes across four files.

**Goal:** Make "Summary saved" a non-intrusive toast, fix toast theming, default to `{number} - {title}`.

---

## Task 1: Extend SummaryToast to support success state

**File:** `src/components/SummaryToast.tsx`

- Change `ToastState` type: `'generating' | 'error'` → `'generating' | 'error' | 'success'`
- Add success behavior: auto-dismiss after 3s (fade + onDone call)
- Render: show ✓ checkmark for success (no spinner)

## Task 2: Show saved confirmation as toast, not in-modal message

**File:** `src/main.tsx`

- Add `summarize_saved` case to module-level listener (line 303+): `showSummaryToast('success', '✓ Summary saved to lorebook')`
- This shows the toast when any save completes, regardless of modal state

**File:** `src/components/SummarizeFlow.tsx`

- When `summarize_saved` arrives (line 186): call `onRequestClose?.()` to dismiss modal instead of showing in-modal message
- Remove `'saved'` flow state handling and the `<div class="chronicle-sf-saved">` render block (lines 597-601)
- Remove `'saved'` from FlowState type

## Task 3: Fix toast CSS to use proper --lumiverse variables

**File:** `src/styles.ts` (`.chronicle-toast`)

- Background: `var(--lumiverse-bg)` instead of `var(--lumiverse-surface, #1e1e2e)`
- Shadow: `0 4px 16px rgba(0,0,0,0.15)` instead of `rgba(0,0,0,0.4)` (lighter, works on both themes)
- Add `.chronicle-toast-success` with success-colored border using `--chronicle-success-text`

## Task 4: Default title format preset to `{number} - {title}`

**File:** `src/components/SummarizeFlow.tsx:106`

- `DEFAULT_TITLE_FORMAT = '{title}'` → `DEFAULT_TITLE_FORMAT = '{number} - {title}'`
- Only affects first-time users (no localStorage value)
- Existing users keep their chosen format via localStorage

## Build & deploy

```bash
cd ~/chronicle_ext && bun run check && git add -A && git commit -m "feat: saved toast, toast theming, default number preset"
```
