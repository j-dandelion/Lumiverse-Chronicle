# Title Format Presets + Keys Preview + Content Fix — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace the oversized free-text title format input with a preset dropdown, show LLM-generated keys in the preview with editing, and ensure the preview displays only summary content (not full JSON).

**Architecture:** Four changes across frontend (SummarizeFlow.tsx, styles.ts, types.ts) and backend (worker.ts):
1. Title format: free-text input → preset `<select>` with custom option
2. Keys: new state + editable input in preview, new `keys` field on `SaveSummaryRequest`, worker uses request keys over pending keys
3. Content leak: backend `generateSummary` fallback strips JSON-like text from raw output
4. CSS: new styles for keys section and title format dropdown

**Tech Stack:** TypeScript, Preact (Bun), Lumiverse Spindle API

**Files to modify:**
- `src/components/SummarizeFlow.tsx` — title format presets, keys display + editing
- `src/styles.ts` — keys section CSS, title format dropdown styles
- `src/types.ts` — `keys` field on `SaveSummaryRequest`
- `src/worker.ts` — use request keys, fallback content extraction

---

### Task 1: Add `keys` to `SaveSummaryRequest` protocol type

**Objective:** Allow the frontend to send user-edited keys with the save request, so the backend uses them instead of the original LLM-generated keys from the pending store.

**Files:**
- Modify: `src/types.ts` (add `keys?: string[]` to `SaveSummaryRequest`)

**Step 1: Add keys field to the interface**

```ts
export interface SaveSummaryRequest {
  type: 'save_summary'
  requestId: string
  title?: string
  titleFormat?: string
  keys?: string[]             // user-edited trigger keys (overrides LLM-generated)
  settings?: Record<string, unknown>
  lorebookId?: string
}
```

The validator (`isValidSaveSummaryRequest`) does not validate individual fields beyond `type` and `requestId` — no change needed there.

**Step 2: Verify types compile**

Run: `bun run check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add keys field to SaveSummaryRequest for user-edited trigger keys"
```

---

### Task 2: Backend uses request keys over pending keys in `handleSaveSummary`

**Objective:** When the frontend sends `keys` in the `save_summary` request, use those instead of the original `pending.keys`. Allow explicit empty array to clear keys (user wants title-derived fallback only).

**Files:**
- Modify: `src/worker.ts` (lines 461-463)

**Step 1: Merge request keys with pending — allow explicit empty array**

Replace:
```ts
const saveResult = await Promise.race([
  saveLorebookEntry(
    { title: effectiveTitle, content: pending.content, keys: pending.keys },
    ...
```

With:
```ts
// Use request keys if provided (including empty array = user cleared all keys).
// Undefined means "no keys specified — use the LLM-generated keys from pending store."
const effectiveKeys = req.keys !== undefined ? req.keys : pending.keys

const saveResult = await Promise.race([
  saveLorebookEntry(
    { title: effectiveTitle, content: pending.content, keys: effectiveKeys },
    ...
```

When `effectiveKeys` is `[]`, `saveLorebookEntry`'s existing key-fallback logic (line 754: `summary.keys.length > 0 ? summary.keys : [title-derived...]`) produces a title-derived key. This allows the user to intentionally clear all keys and get an auto-generated one.

**Step 2: Verify**

Run: `bun run check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/worker.ts
git commit -m "feat: handleSaveSummary uses request keys (including empty) over pending keys"

---

### Task 3: Backend fallback — extract content from JSON-like text when parser fails

**Objective:** When `parseSummaryJson` fails (all 3 strategies), the fallback at `generateSummary` line 206–211 currently uses the raw LLM output as content. If that output is JSON-like, the preview shows the full JSON instead of just summary text. Fix: in the fallback, try a brace-depth JSON extraction (same technique as `parseSummaryJson` Strategy 3), parse the extracted object, and use its `content` field. If that also fails, use raw text.

**Files:**
- Modify: `src/worker.ts`

**Step 1: Replace the fallback with brace-depth extraction**

Replace the fallback block (lines 206-211):
```ts
    // Fallback: JSON parsing failed — use raw text as content
    return {
      title: title || `Summary ${new Date().toLocaleDateString()}`,
      content: text.trim(),
      keys: [],
    }
```

With:
```ts
    // Fallback: JSON parsing failed — try to extract just the "content" field
    // from any JSON-like object in the raw text. Uses brace-depth tracking
    // (same technique as parseSummaryJson Strategy 3) to handle nested braces
    // and multi-line content. Handles both quoted and unquoted keys.
    const rawText = text.trim()
    const jsonStart = rawText.search(/\{\s*"?content"?\s*:/)
    if (jsonStart !== -1) {
      let depth = 0
      let jsonEnd = -1
      for (let i = jsonStart; i < rawText.length; i++) {
        if (rawText[i] === '{') depth++
        else if (rawText[i] === '}') {
          depth--
          if (depth === 0) { jsonEnd = i + 1; break }
        }
      }
      if (jsonEnd > jsonStart) {
        try {
          const obj = JSON.parse(rawText.slice(jsonStart, jsonEnd))
          if (obj && typeof obj === 'object' && typeof (obj as any).content === 'string') {
            return {
              title: typeof (obj as any).title === 'string' ? (obj as any).title : (title || `Summary ${new Date().toLocaleDateString()}`),
              content: (obj as any).content,
              keys: Array.isArray((obj as any).keys) ? (obj as any).keys : [],
            }
          }
        } catch { /* fall through to raw text */ }
      }
    }
    return {
      title: title || `Summary ${new Date().toLocaleDateString()}`,
      content: rawText,
      keys: [],
    }
```

**Why this approach instead of a regex:**
- Brace-depth tracking correctly handles nested `{` and `}` in the content string
- `JSON.parse` handles all JSON escape sequences (`\n`, `\"`, `\\`, unicode) correctly — no manual unescaping needed
- Searching for `"?content"?` handles both quoted keys (`"content"`) and unquoted keys (`content:`), a common LLM malformation
- Multi-line content is handled naturally since `JSON.parse` accepts newlines in strings

**Step 2: Verify**

Run: `bun run check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/worker.ts
git commit -m "fix: use brace-depth JSON extraction in generateSummary fallback to prevent full JSON leak"
```

---

### Task 4: Add CSS for keys section and title format dropdown

**Objective:** Add styles for the new keys editing input and the title format preset dropdown, following existing Chronicle design patterns.

**Files:**
- Modify: `src/styles.ts`

**Step 1: Add keys section styles**

Below the existing `.chronicle-sf-keys-row` at line 709, replace the placeholder with full styles:

```css
    /* ── Summarize Flow — Keys row ─────────────────── */
    .chronicle-sf-keys-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-sf-keys-input {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
    }
    .chronicle-sf-keys-input:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
    }
    .chronicle-sf-keys-hint {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-subtle);
    }
```

**Step 2: Add title format row style**

After `.chronicle-sf-title-row`, add a wrapper for the dropdown:

```css
    .chronicle-sf-format-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-sf-format-custom-input {
      margin-top: 4px;
    }
```

**Step 3: Verify**

Run: `bun run check` (TS only — CSS is in a template literal, no TS impact, but verification greps in build output will confirm).

**Step 4: Commit**

```bash
git add src/styles.ts
git commit -m "style: add keys section and title format dropdown CSS"
```

---

### Task 5: Replace title format text input with preset dropdown

**Objective:** Replace the free-text `{title}`, `{date}`, `{time}` input with a `<select>` dropdown offering presets, plus a "Custom…" option that reveals a text input. This fixes the oversized field (200px inline style) and provides discoverable format options.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx`

**Step 1: Define format presets (outside component)**

Add this constant ABOVE the `export const SummarizeFlow` line (outside the component function — avoids recreation on every render):

```ts
const TITLE_FORMAT_PRESETS = [
  { label: '{title}', value: '{title}' },
  { label: 'Chronicle: {title}', value: 'Chronicle: {title}' },
  { label: '{date} — {title}', value: '{date} — {title}' },
  { label: 'Chronicle: {title} ({date})', value: 'Chronicle: {title} ({date})' },
  { label: '{date} {time} — {title}', value: '{date} {time} — {title}' },
  { label: 'Custom…', value: '__custom__' },
]
```

**Step 2: Add `useCustomFormat` state (reads localStorage boolean)**

Replace the existing `titleFormat` state (line 96-98) with:
```ts
  // Title format template (persisted)
  const DEFAULT_TITLE_FORMAT = '{title}'
  const [titleFormat, setTitleFormat] = useState(() => {
    try { return localStorage.getItem('chronicle:titleFormat') || DEFAULT_TITLE_FORMAT } catch { return DEFAULT_TITLE_FORMAT }
  })
  // Whether the user is in custom format mode (persisted boolean — NOT derived from value matching)
  const [useCustomFormat, setUseCustomFormat] = useState(() => {
    try { return localStorage.getItem('chronicle:useCustomTitleFormat') === 'true' } catch { return false }
  })
```

The init reads a dedicated `chronicle:useCustomTitleFormat` boolean key (NOT derived from matching preset values). This avoids the subtle bug where a custom format that happens to match a preset value would silently lose its custom state on reload.

**Step 3: Determine selected preset value**

```ts
  const selectedFormatValue = useCustomFormat ? '__custom__' : titleFormat
```

**Step 4: Replace the existing title format input**

Replace lines 482-496:
```tsx
          <div class="chronicle-sf-title-row" style="margin-top: 8px;">
            <label class="chronicle-pm-label">Title Format</label>
            <input
              class="chronicle-pm-input"
              value={titleFormat}
              onInput={(e) => {
                const val = (e.target as HTMLInputElement).value
                setTitleFormat(val)
                try { localStorage.setItem('chronicle:titleFormat', val) } catch {}
              }}
              placeholder={DEFAULT_TITLE_FORMAT}
              style="flex: 0 0 200px; margin-left: 8px;"
            />
            <span class="chronicle-sf-title-format-hint">{'{title}'}, {'{date}'}, {'{time}'}</span>
          </div>
```

With:
```tsx
          <div class="chronicle-sf-title-row" style="margin-top: 8px;">
            <label class="chronicle-pm-label">Title Format</label>
            <div class="chronicle-sf-format-row">
              <select
                class="chronicle-pm-select"
                value={selectedFormatValue}
                onChange={(e) => {
                  const val = (e.target as HTMLSelectElement).value
                  if (val === '__custom__') {
                    setUseCustomFormat(true)
                  } else {
                    setUseCustomFormat(false)
                    setTitleFormat(val)
                    try { localStorage.setItem('chronicle:titleFormat', val) } catch {}
                  }
                }}
              >
                {TITLE_FORMAT_PRESETS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {useCustomFormat && (
                <input
                  class="chronicle-pm-input chronicle-sf-format-custom-input"
                  value={titleFormat}
                  onInput={(e) => {
                    const val = (e.target as HTMLInputElement).value
                    setTitleFormat(val)
                    try { localStorage.setItem('chronicle:titleFormat', val) } catch {}
                  }}
                  placeholder={DEFAULT_TITLE_FORMAT}
                />
              )}
              <span class="chronicle-sf-title-format-hint">{'{title}'}, {'{date}'}, {'{time}'}</span>
            </div>
          </div>
```

**Step 5: Persist custom format state**

Add an effect for `useCustomFormat` persistence:
```ts
  useEffect(() => {
    try { localStorage.setItem('chronicle:useCustomTitleFormat', String(useCustomFormat)) } catch {}
  }, [useCustomFormat])
```

**Step 6: Verify**

Run: `bun run check`
Expected: 0 errors.

**Step 7: Commit**

```bash
git add src/components/SummarizeFlow.tsx
git commit -m "feat: replace title format text input with preset dropdown + custom option"
```

---

### Task 6: Show keys in preview and make them editable

**Objective:** Display LLM-generated trigger keys in the preview section (below content), in an editable input. Send edited keys with the save request.

**Files:**
- Modify: `src/components/SummarizeFlow.tsx`

**Step 1: Add `summaryKeys` state**

After the existing `summaryTitle` state (line 74):
```ts
  const [summaryKeys, setSummaryKeys] = useState<string[]>(previewProp?.keys ?? [])
```

**Step 2: Update keys from preview event AND previewProp changes**

Add `setSummaryKeys` in the existing `summarize_preview` event handler (lines 154-161):
```ts
        case 'summarize_preview': {
          const data = msg as unknown as PreviewData & { type: string }
          setPreviewData(data)
          setFlowState('preview')
          setSummaryTitle(data.title)
          setSummaryKeys(data.keys ?? [])  // ← ADD THIS
          setErrorMessage(null)
          break
        }
```

Also update the existing `previewProp` sync effect (lines 118-122) to include keys:
```ts
  useEffect(() => {
    if (previewProp) {
      setSummaryTitle(previewProp.title)
      setSummaryKeys(previewProp.keys ?? [])  // ← ADD THIS
    }
  }, [previewProp])
```

This covers both paths: event-based (generating toast → modal reopen) and prop-based (direct prop injection).

**Step 3: Send keys with save request (always send, even empty)**

In `handleSave` (lines 265-279), add `keys` to the payload AND add `summaryKeys` to the dependency array:
```ts
  const handleSave = useCallback(() => {
    if (!previewData) return
    const settingsInput = settingsToCreateInput(entrySettings)
    sendToBackend({
      type: 'save_summary',
      requestId: previewData.requestId,
      title: summaryTitle !== previewData.title ? summaryTitle : undefined,
      titleFormat: titleFormat,
      keys: summaryKeys,  // ← ADD THIS (always send, even if empty)
      settings: settingsInput,
      lorebookId: lorebookId,
    })
  }, [previewData, sendToBackend, summaryTitle, entrySettings, lorebookId, titleFormat, summaryKeys])  // ← ADD summaryKeys
```

Critical: `summaryKeys` MUST be in the dependency array. Without it, `useCallback` captures a stale closure with the initial `[]` value — the backend always receives `keys: undefined` (from `summaryKeys.length > 0 ? summaryKeys : undefined`) and falls back to pending keys. The entire feature is non-functional.

Always send `summaryKeys` as-is (never `undefined`). When the user clears all keys, the backend sees `[]` and falls through to the title-derived key fallback in `saveLorebookEntry`.

**Step 4: Render keys in preview section**

In the `flowState === 'preview'` block (after the content div at line 498), add keys editing:

```tsx
          <div class="chronicle-sf-keys-row" style="margin-top: 12px;">
            <label class="chronicle-pm-label">Trigger Keys</label>
            <input
              class="chronicle-sf-keys-input"
              value={summaryKeys.join(', ')}
              onInput={(e) => {
                const raw = (e.target as HTMLInputElement).value
                const keys = raw.split(',').map(k => k.trim()).filter(k => k.length > 0)
                setSummaryKeys(keys)
              }}
              placeholder="key1, key2, key3"
            />
            <span class="chronicle-sf-keys-hint">Comma-separated trigger keys for this lorebook entry</span>
          </div>
```

**Step 5: Verify**

Run: `bun run check`
Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/components/SummarizeFlow.tsx
git commit -m "feat: show and edit trigger keys in preview, send with save request"
```

---

### Task 7: Build, deploy, and verify

**Objective:** Build the extension, deploy to Lumiverse runtime, and verify all changes.

**Step 1: Build**

```bash
cd ~/chronicle_ext && ./build.sh
```
Expected: TypeScript 0 errors, both bundles built and copied.

**Step 2: Verify critical patterns**

Prefer `tsc --noEmit` and the test suite over fragile grep of minified bundles (variable names get mangled by the bundler). Use source-level verification:

```bash
# TypeScript check — authoritative
cd ~/chronicle_ext && bun run check
# Expected: 0 errors

# Parser tests still pass
bun src/__tests__/prompts.test.ts
# Expected: 23 assertions, no failures

# Source-level grep (unminified .ts files):
# Title format presets defined
grep -c "Custom…" src/components/SummarizeFlow.tsx
# Expected: 1

# Keys field on SaveSummaryRequest
grep "keys?" src/types.ts | grep -c "SaveSummaryRequest"
# Expected: >= 1

# Brace-depth fallback in worker
grep -c "brace-depth\|jsonStart\|jsonEnd" src/worker.ts
# Expected: >= 3

# summaryKeys in handleSave deps
grep "summaryKeys" src/components/SummarizeFlow.tsx | grep -c "useCallback"
# Expected: >= 1
```

**Step 3: Commit the plan** (do this NOW, before implementing tasks 1-7)

```bash
git add docs/plans/2026-07-06-title-format-keys-preview-fixes.md
git commit -m "docs: add implementation plan for title format presets, keys preview, and content fix"
```

**Step 4: Hard refresh Lumiverse** (after build completes in Task 7)

Tell the user to hard-refresh Lumiverse (Ctrl+F5) and test:
1. Title format shows a dropdown with 5 presets + Custom…
2. Selecting "Custom…" reveals a text input
3. After generating a summary, trigger keys show below the content
4. Keys are editable as comma-separated text
5. Saving with edited keys creates the entry with those keys
6. Preview shows only summary text, not JSON structure
```

---

### Verification Checklist (End-to-End)

After implementation, verify:
- [ ] Title format dropdown matches PromptManager dropdown style (`.chronicle-pm-select`)
- [ ] Presets: `{title}`, `Chronicle: {title}`, `{date} — {title}`, `Chronicle: {title} ({date})`, `{date} {time} — {title}`, `Custom…`
- [ ] "Custom…" shows text input, other presets hide it
- [ ] Custom format persists to localStorage across page refreshes
- [ ] Keys show below content in preview with comma-separated editing
- [ ] Keys sent with save request and used by backend
- [ ] Preview content is plain text, not JSON
- [ ] TypeScript: 0 errors
- [ ] All 23 existing parser tests still pass: `bun src/__tests__/prompts.test.ts`

---

## Critic Review (2026-07-06)

The plan was reviewed by a critic subagent. 13 findings identified, all addressed:

| ID | Severity | Area | Finding | Fix |
|----|----------|------|---------|-----|
| B1 | Blocker | Task 3 | Regex backslash doubling — `\\\\\\\\"` would never match | Replaced with brace-depth JSON extraction (same as parseSummaryJson Strategy 3) |
| B2 | Blocker | Task 6 | `handleSave` stale closure — `summaryKeys` missing from useCallback deps | Added `summaryKeys` to dep array |
| B3 | Blocker | Task 3 | Regex no DOTALL flag — fails on multi-line content | Brace-depth extraction handles multi-line natively |
| M1 | Major | Task 3 | Unquoted keys not handled | Brace-depth search: `"?content"?` matches both quoted and unquoted |
| M2 | Major | Task 6 | `previewProp` useEffect doesn't sync keys | Added `setSummaryKeys` to existing effect |
| M3 | Major | Task 5 | Custom format matching a preset value loses state on reload | Use `localStorage.getItem('chronicle:useCustomTitleFormat')` boolean, not derived matching |
| M4 | Major | Task 7 | `bun run` on test file path (wrong command); grep patterns fragile in minified bundles | Fixed to `bun` (no `run`); switched to source-level `tsc --noEmit` + unminified grep |
| M5 | Major | Tasks 2+6 | Empty keys array mapped to `undefined` — can't clear keys | Always send `keys` as-is; backend uses `!== undefined` check |
| m1 | Minor | Task 4 | CSS verification step says `bun run check` | Removed — CSS is in template literal, no TS impact |
| m2 | Minor | Task 6 | Controlled input cursor jump risk with `summaryKeys.join(', ')` | Known Preact pattern; cursor-jump only on trailing-space trimming (acceptable UX) |
| m3 | Minor | Task 5 | `TITLE_FORMAT_PRESETS` recreated every render | Moved outside component function |
| m4 | Minor | Task 5 | `useCustomFormat` persistence writes key but init doesn't read it | Fixed: init now reads `chronicle:useCustomTitleFormat` boolean |
| m5 | Minor | Task 3 | Content extraction inline — not unit-testable | Accepted trade-off (tightly coupled to generateSummary's error path) |
| m6 | Minor | All | Plan committed AFTER implementation | Fixed: commit plan before Task 1 |
