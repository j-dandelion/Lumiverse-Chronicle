# Chronicle: Title Format Variables, Keys Hint Alignment, {number} Support

> **For Hermes:** Implement directly. Five independent changes across three files.

**Goal:** Improve title format UX — add Variables prefix, grey out hint, align keys hint, add {number} auto-increment variable, add {number} preset.

**Architecture:** 
- Frontend changes: `SummarizeFlow.tsx` (presets, hint text) and `styles.ts` (hint alignment, color)
- Backend change: `worker.ts` (new `resolveNumberPlaceholder()` — lists target book entries, parses comments for existing numbers, computes n+1)
- No protocol changes needed — `titleFormat` already flows frontend→backend via `save_summary`

**Tech Stack:** TypeScript, Preact, Bun build

---

## Current State

**Title format hint (line 538):**
```tsx
<span class="chronicle-sf-title-format-hint">{'{title}'}, {'{date}'}, {'{time}'}</span>
```
Color: `var(--lumiverse-text-subtle)` — already dimmed but not explicitly greyed.

**Keys hint (line 556):**
```tsx
<span class="chronicle-sf-keys-hint">Comma-separated trigger keys for this lorebook entry</span>
```
No left padding — aligns with the flex column edge (same as label), not indented like input text.

**Title format presets (lines 50-57):**
```
{title}, Chronicle: {title}, {date} — {title}, Chronicle: {title} ({date}), {date} {time} — {title}, Custom…
```

**{number} resolution path (worker.ts lines 800-812):**
```ts
let displayName = summary.title
if (titleFormat) {
  const now = new Date()
  displayName = titleFormat
    .replace(/\{title\}/g, summary.title)
    .replace(/\{date\}/g, now.toLocaleDateString())
    .replace(/\{time\}/g, now.toLocaleTimeString())
}
entryInput.comment = `${displayName} | Chronicle summary | ...`
```
No `{number}` handling yet.

---

## Tasks

### Task 1: Add "Variables: " prefix and grey out the title format hint

**File:** `src/components/SummarizeFlow.tsx:538`

Change the hint span from:
```tsx
<span class="chronicle-sf-title-format-hint">{'{title}'}, {'{date}'}, {'{time}'}</span>
```
to:
```tsx
<span class="chronicle-sf-title-format-hint">Variables: {'{title}'}, {'{date}'}, {'{time}'}, {'{number}'}</span>
```

**File:** `src/styles.ts:440-444`

Change the hint color to a more explicitly greyed-out value:
```css
.chronicle-sf-title-format-hint {
  font-size: calc(10px * var(--lumiverse-font-scale, 1));
  color: var(--lumiverse-text-dim);
  margin-left: 4px;
  white-space: nowrap;
  opacity: 0.6;
}
```

(`--lumiverse-text-dim` + `opacity: 0.6` = clearly greyed/subdued. The `opacity` approach works on any theme since it dims whatever the dim text color already is.)

**Verification:** Hint shows "Variables: {title}, {date}, {time}, {number}" in a clearly greyed-out style.

---

### Task 2: Add `{number} - {title}` preset

**File:** `src/components/SummarizeFlow.tsx:50-57`

Insert before the Custom… entry:
```tsx
const TITLE_FORMAT_PRESETS = [
  { label: '{title}', value: '{title}' },
  { label: 'Chronicle: {title}', value: 'Chronicle: {title}' },
  { label: '{date} — {title}', value: '{date} — {title}' },
  { label: 'Chronicle: {title} ({date})', value: 'Chronicle: {title} ({date})' },
  { label: '{date} {time} — {title}', value: '{date} {time} — {title}' },
  { label: '{number} - {title}', value: '{number} - {title}' },
  { label: 'Custom…', value: '__custom__' },
]
```

**Verification:** Dropdown shows `{number} - {title}` as the 6th option before Custom….

---

### Task 3: Indent keys hint to align with input text

**Files:** `src/styles.ts:737-740`, `src/components/SummarizeFlow.tsx:556`

The `.chronicle-sf-keys-input` has `padding: 6px 8px` — its text starts 8px from the left edge. The hint should match that indentation.

**CSS change in `src/styles.ts`:**
```css
.chronicle-sf-keys-hint {
  font-size: calc(10px * var(--lumiverse-font-scale, 1));
  color: var(--lumiverse-text-subtle);
  padding-left: 8px;
}
```

**Verification:** The hint text "Comma-separated trigger keys…" left edge aligns with the text inside the keys input box (8px indent), not the "Trigger Keys" label above it.

---

### Task 4: Implement `{number}` auto-increment variable in backend

**File:** `src/worker.ts`

#### 4a: Add `resolveNumberPlaceholder()` function

Add a new function before `saveLorebookEntry()` that:
1. Lists all entries in the target world book
2. Parses each entry's `comment` field for a leading number
3. Returns the next number (max + 1, zero-padded to 2 digits)

```ts
/**
 * Find the next chronicle entry number for a world book by parsing
 * existing entry comments for leading 2-digit numbers (e.g. "01 - Title | ...").
 * Returns "01" if no numbered entries found.
 */
async function resolveNextChronicleNumber(
  worldBookId: string,
  userId: string
): Promise<string> {
  try {
    const result = await spindle.world_books.entries.list(worldBookId, {
      limit: 500,
      userId,
    }) as { data: Array<{ comment?: string }>; total: number }

    let maxNum = 0
    for (const entry of result.data) {
      if (!entry.comment) continue
      // Match a 2-digit number at the start of the comment,
      // optionally followed by " - " (the `{number} - {title}` format separator)
      const match = entry.comment.match(/^(\d{2})(?:\s*-)?/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }
    return String(maxNum + 1).padStart(2, '0')
  } catch (err) {
    // If listing fails, fall back to "01"
    spindle.log.warn(`${LOG} resolveNextChronicleNumber failed: ${err}`)
    return '01'
  }
}
```

**Location:** Insert after `saveLorebookEntry`'s opening (after line 768 or in the helper section near line 759).

#### 4b: Integrate into `saveLorebookEntry()`

In `saveLorebookEntry()`, after resolving `targetBookId` but before computing `displayName`, resolve `{number}` if the format requires it:

```ts
// In saveLorebookEntry, right after targetBookId resolution (line ~780)
// and before the displayName computation (line ~802):

let displayName = summary.title
if (titleFormat) {
  // Resolve {number} if the format uses it
  let resolvedFormat = titleFormat
  if (titleFormat.includes('{number}')) {
    const nextNum = await resolveNextChronicleNumber(targetBookId, userId)
    resolvedFormat = titleFormat.replace(/\{number\}/g, nextNum)
  }
  const now = new Date()
  displayName = resolvedFormat
    .replace(/\{title\}/g, summary.title)
    .replace(/\{date\}/g, now.toLocaleDateString())
    .replace(/\{time\}/g, now.toLocaleTimeString())
}
```

**Verification:**
- First save with `{number} - {title}` → "01 - Meeting Notes | Chronicle summary | ..."
- Second save → "02 - Project Update | Chronicle summary | ..."
- Third save → "03 - ..."
- Save with `{date} — {title}` (no number) → unchanged behavior, no entries.list call

---

### Task 5: Build & deploy

```bash
cd ~/chronicle_ext
bun run check              # 0 errors expected
git add -A
git commit -m "feat: title format variables hint, keys hint alignment, {number} auto-increment"
# Auto-build + deploy via post-commit hook
```

Hard refresh Lumiverse (Ctrl+F5).

---

## Edge Cases & Notes

- **{number} with existing unnumbered entries:** If some entries don't start with a number, they're ignored. Only entries matching `^(\d{2})` contribute to the max.
- **Deleted entries:** If entry "02" is deleted, the next save would still produce "03" (max found is 01). This matches the user's "finds x so it can properly solve for x+1" — it reads actual existing names, not a counter.
- **Empty world book:** Returns "01".
- **Non-Chronicle entries:** If a world book has manually-created entries with leading numbers in their comments, they'd affect the count. This is acceptable — the user wants Chronicle to find "the last entry name."
- **Concurrent saves:** Two rapid saves could race and both get the same number. The entries.list + create window is small but not atomic. Mitigation: the entries.list call happens during `saveLorebookEntry` which is gated by the per-user `_summarizingUsers` concurrency guard — so only one save per user at a time. Cross-user races possible but unlikely; acceptable for this feature.
- **Preview mode:** `{number}` shows literally in the preview since it's only resolved at save time. The preview title shows the LLM-generated title anyway, not the formatted one.
