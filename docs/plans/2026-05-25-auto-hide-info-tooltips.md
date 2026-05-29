# Auto-Hide Info Tooltips — Implementation Plan

> **For Hermes:** Execute directly. 2 files, CSS-only tooltips, no new deps.

**Goal:** Add greyed-out ℹ icons next to "Auto-hide prior messages" and "Number of prior messages to keep visible" labels. Hovering the icon shows a tooltip describing the option.

**Architecture:** Pure CSS tooltip via `::after` pseudo-element on a `<span class="chronicle-info-icon">`. The icon is a 16px circle with an "i" letter, greyed out (opacity 0.4), brightening on hover (0.8). The tooltip appears BELOW the icon (avoids `overflow: hidden` clipping from the Lumiverse modal container). No JavaScript — zero runtime cost.

---

## Environment Context (verified)

**Lumiverse modal DOM structure** (from `~/Lumiverse/frontend/src/lib/spindle/loader.ts:377-410`):

```
backdrop (position: fixed, fullscreen)
  container (overflow: hidden, display: flex column, border-radius: 12px)
    header (title bar)
    body (overflow-y: auto, flex: 1, padding: 16px)
      root  ← SummarizeFlow renders here
```

**Key constraint**: The container has `overflow: hidden` (line 384). Tooltips positioned UPWARD from their anchor would extend into the container's clipping boundary. Solution: position tooltips DOWNWARD (`top: calc(100% + 6px)`) so they stay within the scrollable body. If the icon is near the bottom, the tooltip may be partially hidden but the user can scroll (body has `overflow-y: auto`).

**Modal width**: 520px. Usable body width after padding: 488px. Tooltip max-width 280px — fits comfortably.

---

## Changes

| # | File | What |
|---|------|------|
| 1 | `src/styles.ts` | Add `.chronicle-info-icon` + tooltip CSS (~55 lines, insert after autohide section) |
| 2 | `src/components/SummarizeFlow.tsx` | Add two `<span class="chronicle-info-icon" data-tooltip="...">i</span>` elements |

---

### Task 1: Add info icon and tooltip CSS

**File:** `src/styles.ts` — insert after the `.chronicle-sf-autohide-input:disabled` block (after ~line 354, before the `.chronicle-sf-generate-row` block at ~line 356)

**Complete CSS to add:**

```css
    /* ── Info tooltip ──────────────────────────────────── */
    .chronicle-info-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid var(--lumiverse-text-dim);
      color: var(--lumiverse-text-dim);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      font-weight: 700;
      font-style: normal;
      font-family: var(--lumiverse-font-sans, sans-serif);
      cursor: help;
      opacity: 0.4;
      flex-shrink: 0;
      position: relative;
      user-select: none;
      line-height: 1;
    }

    .chronicle-info-icon:hover {
      opacity: 0.8;
    }

    .chronicle-info-icon::after {
      content: attr(data-tooltip);
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--lumiverse-bg-deep);
      color: var(--lumiverse-text);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      font-weight: 400;
      font-family: var(--lumiverse-font-sans, sans-serif);
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--lumiverse-border);
      white-space: normal;
      width: max-content;
      max-width: 280px;
      line-height: 1.4;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      text-align: left;
    }

    .chronicle-info-icon:hover::after {
      opacity: 1;
    }
```

**Design decisions:**
- `top: calc(100% + 8px)` — tooltip appears below icon (avoids container `overflow: hidden` clipping)
- `left: 50%; transform: translateX(-50%)` — centered on icon
- `max-width: 280px` — fits within 488px body width with room to spare
- `opacity: 0.4` / `0.8` on hover — greyed out, subtle brightening
- `cursor: help` — standard "more info" cursor
- `pointer-events: none` on `::after` — prevents tooltip from capturing hover events
- No arrow/triangle — keeps CSS simple, avoids clipping edge cases

---

### Task 2: Add info icon to "Auto-hide prior messages"

**File:** `src/components/SummarizeFlow.tsx`

**Location:** Inside `<label class="chronicle-sf-autohide-toggle">`, immediately after `</span>` containing "Auto-hide prior messages" (currently line 401)

The label already has `display: flex; align-items: center; gap: 8px` so the icon flows naturally in the row.

**Current (lines 395-402):**
```tsx
<label class="chronicle-sf-autohide-toggle">
  <input
    type="checkbox"
    checked={autoHidePrior}
    onChange={(e) => setAutoHidePrior((e.target as HTMLInputElement).checked)}
  />
  <span>Auto-hide prior messages</span>
</label>
```

**Replace with:**
```tsx
<label class="chronicle-sf-autohide-toggle">
  <input
    type="checkbox"
    checked={autoHidePrior}
    onChange={(e) => setAutoHidePrior((e.target as HTMLInputElement).checked)}
  />
  <span>Auto-hide prior messages</span>
  <span class="chronicle-info-icon" data-tooltip="After summarizing, automatically use the 'hide' function on all previous messages, removing them from the context window.">i</span>
</label>
```

**Tooltip text:** "After summarizing, automatically use the 'hide' function on all previous messages, removing them from the context window."

---

### Task 3: Add info icon to "Number of prior messages to keep visible"

**File:** `src/components/SummarizeFlow.tsx`

**Location:** Inside `<div class="chronicle-sf-autohide-count">`, immediately after the closing `</label>` containing "Number of prior messages to keep visible" (around line 422-424)

The container already has `display: flex; align-items: center; gap: 8px` so the icon flows naturally. Current row order: input → label. After change: input → label → info-icon.

**Current (lines 403-424):**
```tsx
<div class="chronicle-sf-autohide-count" style={{ opacity: autoHidePrior ? 1 : 0.5 }}>
  <input ... />
  <label class="chronicle-pm-label">
    Number of prior messages to keep visible
  </label>
</div>
```

**Replace with:**
```tsx
<div class="chronicle-sf-autohide-count" style={{ opacity: autoHidePrior ? 1 : 0.5 }}>
  <input ... />
  <label class="chronicle-pm-label">
    Number of prior messages to keep visible
  </label>
  <span class="chronicle-info-icon" data-tooltip="Protects a number of recent messages from the auto-hide function. This helps keep LLM responses coherent and consistent after summarization. (Recommended: 5-10 messages)">i</span>
</div>
```

**Tooltip text:** "Protects a number of recent messages from the auto-hide function. This helps keep LLM responses coherent and consistent after summarization. (Recommended: 5-10 messages)"

---

### Task 4: Build, verify, commit

**Step 1:** TypeScript check
```bash
cd ~/chronicle_ext && npx tsc --noEmit
```
Expected: 0 errors

**Step 2:** Build and deploy
```bash
cd ~/chronicle_ext && ./build.sh
```
Expected: bundles built, deployed to `~/Lumiverse/data/extensions/chronicle/repo/dist/`

**Step 3:** Verify deployed bundle
```bash
# Both tooltip strings present
grep -c 'After summarizing' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: 1

grep -c 'Protects a number of recent messages' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: 1

# Info icon CSS + usage present
grep -c 'chronicle-info-icon' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
# Expected: ≥8
```

**Step 4:** Commit
```bash
cd ~/chronicle_ext && git add -A && git commit -m "feat: add info tooltips to auto-hide controls"
```

**Manual verification (after hard-refresh Ctrl+F5):**
1. Open Chronicle modal, scroll to auto-hide section
2. Hover ℹ next to "Auto-hide prior messages" → tooltip appears below icon, text matches spec
3. Hover ℹ next to "Number of prior messages to keep visible" → tooltip appears below icon, text matches spec
4. ℹ icon is dim (opacity 0.4), brightens on hover (0.8)
5. Tooltip is not clipped by modal edges (verify on both labels)
6. Tooltip disappears when cursor leaves the icon

---

## Risk Notes

| Risk | Mitigation |
|------|------------|
| **Container overflow: hidden** — Lumiverse modal container clips overflow. Tooltip positioned above would be cut off. | Tooltip positioned BELOW icon (`top: calc(100% + 8px)`), staying within scrollable body. |
| **Bottom-edge clipping** — If auto-hide section is near bottom of modal, downward tooltip may be partially hidden. | Body has `overflow-y: auto` — user can scroll to see the rest. Acceptable. |
| **Touch devices** — No hover on touch. | Acceptable. Desktop-focused feature. Spindle extensions primarily used on desktop. |
| **Long tooltip text** — Second tooltip is ~180 chars. At 11px font with 280px max-width, this wraps to ~4 lines. | Verified: ~45 chars/line at 11px in 280px, so ~4 lines. Acceptable. |
| **Unicode "i" rendering** — The letter "i" as icon content may render with varying serifs across fonts. | Using `font-family: var(--lumiverse-font-sans)` for consistency. |
