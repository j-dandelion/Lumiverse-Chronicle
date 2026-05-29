# Chronicle: Title Format Display, Content Background, and Spacing Fixes

> **For Hermes:** Implement directly — three small, independent fixes.

**Goal:** Fix three UX issues in the Chronicle SummarizeFlow preview/save flow.

**Architecture:** Three independent fixes touching `worker.ts`, `styles.ts`, and `SummarizeFlow.tsx`. No new files, no protocol changes.

**Tech Stack:** TypeScript, Preact, Bun build

---

## Root Cause Analysis

### Issue 1: `fmt:{date} — {title} | display:...` shown as entry name

In `worker.ts:811-812`, the `comment` field (which Lumiverse displays as the entry name) is set to:
```
fmt:{titleFormat} | display:{displayName} | Chronicle summary | Source: ...
```
The structured metadata prefix (`fmt:... | display:`) was intended for machine parsing but is shown verbatim to the user. The `displayName` is already correctly computed (e.g., "5/26/2026 — The Vaul") — it just needs to be the first thing in the comment.

**Fix:** Use `displayName` directly as the leading part of comment, dropping the raw `fmt:|display:` prefixes.

### Issue 2: Summary preview content background doesn't match prompt textarea

`.chronicle-sf-content` (preview content div) uses `var(--lumiverse-bg-deep)`.
`.chronicle-pm-textarea` (prompt textarea) uses `var(--lumiverse-fill-hover)`.
The user wants them to match.

**Fix:** Change `.chronicle-sf-content` background to `var(--lumiverse-fill-hover)`.

### Issue 3: Redundant inline margins doubling container gap

The `[data-chronicle="summarize-flow"]` container has `gap: 12px`. But two children have inline styles:
- Title Format row: `style="margin-top: 8px"` → 12px (gap) + 8px = 20px between Title and Title Format
- Keys row: `style="margin-top: 12px"` → 12px (gap) + 12px = 24px between content and keys

These inline margins were likely written before the container `gap: 12px` was set, or were intended as the sole spacing. Either way, they double up with the gap.

**Fix:** Remove the inline `style` attributes; rely on the container's uniform `gap: 12px`.

---

## Task 1: Fix comment field to show displayName instead of raw metadata

**File:** `src/worker.ts:810-812`

**Before:**
```ts
  // Structured format: "fmt:{template} | display:{rendered} | Chronicle summary | Source: ..."
  const formatPart = titleFormat ? `fmt:${titleFormat} | display:${displayName} | ` : ''
  entryInput.comment = `${formatPart}Chronicle summary | Source: chat ${chatId}, ${messageIds.length} messages | ${new Date().toISOString()}`
```

**After:**
```ts
  // Use displayName (formatted title) as the leading part of the comment.
  // displayName is either the titleFormat-rendered string or the raw summary.title.
  entryInput.comment = `${displayName} | Chronicle summary | Source: chat ${chatId}, ${messageIds.length} messages | ${new Date().toISOString()}`
```

**Verification:** After deploy, save a summary with title format `{date} — {title}`. The lorebook entry should show `5/26/2026 — The Vaul | Chronicle summary | Source: ...` — NOT `fmt:...`.

---

## Task 2: Match summary preview content background to prompt textarea

**File:** `src/styles.ts:454-465`

**Change line 455:**
```css
background: var(--lumiverse-bg-deep);
```
to:
```css
background: var(--lumiverse-fill-hover);
```

**Full selector after fix:**
```css
    .chronicle-sf-content {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      border-radius: 8px;
      padding: 12px;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 300px;
      overflow-y: auto;
    }
```

**Verification:** Open preview — the summary content area should have the same fill-hover background as the prompt textarea (not the deeper dark background).

---

## Task 3: Remove redundant inline margins from preview section

**File:** `src/components/SummarizeFlow.tsx`

**Change 1 — Title Format row (line ~505):**
```diff
-          <div class="chronicle-sf-title-row" style="margin-top: 8px;">
+          <div class="chronicle-sf-title-row">
```

**Change 2 — Keys row (line ~544):**
```diff
-          <div class="chronicle-sf-keys-row" style="margin-top: 12px;">
+          <div class="chronicle-sf-keys-row">
```

**Verification:** Preview spacing should look uniform (12px between all sections). The Title and Title Format fields should still be distinguishably separated.

---

## Build & Deploy

```bash
cd ~/chronicle_ext
bun run check              # 0 errors expected
git add -A
git commit -m "fix: title format display, content bg match, preview spacing"
# Auto-build + deploy via post-commit hook
```

Hard refresh Lumiverse (Ctrl+F5) after deploy.
