# Chronicle Extension — Diagnostic Round (2026-05-27)

> Focus: Recent commits from past 2 days (May 26–27), very careful and critical bug-finding.

**Scope:** All source files audited. 32 files read, 19 commits examined, TypeScript 0 errors, 32/32 tests passing.

---

## B1 (MEDIUM) — `_generationParams` silently lost in main.tsx → retry uses DEFAULT_PARAMS

**Severity:** MEDIUM — functional bug on retry path.

**Root cause:** `main.tsx`'s `handleGenerateStart` in both `openChronicleModal` and `openPreviewModal` does NOT capture the `generationParams` field from the `onGenerateStart` payload.

The `onGenerateStart` prop type in `SummarizeFlow.tsx` (line 51) includes `generationParams?: GenerationParams`, and the call at line 290 passes it. But both `handleGenerateStart` handlers in `main.tsx` (lines 154 and 212) destructure only `customPrompt, connectionId, lorebookId, entrySettings, activePrompt` — `generationParams` is absent.

Result:
- `let _generationParams: GenerationParams | undefined` (line 64) is declared but **never assigned to** — only two references exist (declaration + usage on line 244).
- `openPreviewModal` passes `initialGenerationParams={_generationParams}` which is always `undefined`.
- `SummarizeFlow` on preview reopen falls back to `{ ...DEFAULT_PARAMS }` (temperature=0.3).
- On retry, the generation uses `DEFAULT_PARAMS`, not the user's configured params.

**Affects:** First-generation retry path. Initial generation works correctly (params flow directly from SummarizeFlow → backend). The bug only surfaces when retrying from the preview.

**Location:** `src/main.tsx` lines 154–169, 212–227

**Fix:** Add `params.generationParams` capture to both `handleGenerateStart` functions:

```ts
// In openChronicleModal handleGenerateStart (line ~150)
const handleGenerateStart = (params: {
  customPrompt: string | undefined
  connectionId: string | undefined
  lorebookId: string | undefined
  entrySettings: EntrySettings
  activePrompt: string | undefined
  generationParams?: GenerationParams      // ADD
}) => {
  startGenerating()
  _generationSelectedCount = count
  _generationEntrySettings = params.entrySettings
  _generationLorebookId = params.lorebookId
  _generationActivePrompt = params.activePrompt
  _generationConnectionId = params.connectionId
  _generationParams = params.generationParams  // ADD
  showSummaryToast('generating', 'Generating summary\u2026')
  modal.dismiss()
}
```

Same fix for `openPreviewModal`'s `handleGenerateStart` (line ~212).

---

## B2 (LOW) — `JSON_OUTPUT_INSTRUCTION` is dead code

**Severity:** LOW — no runtime impact, but misleading.

**Root cause:** The recent preset cleanup commit `329c17a` removed all built-in presets except Default. The removed presets were the only consumers of `JSON_OUTPUT_INSTRUCTION`. The `presets.ts` import was updated (line 6: removed `JSON_OUTPUT_INSTRUCTION` from the import), but the constant still exists in `prompts.ts` (line 21) and is exported. It's now completely unused.

The recent `4cf2c4a` commit (Harden prompt) modified `JSON_OUTPUT_INSTRUCTION` to say `"YOU MUST generate 2-5 trigger keys"` — but this change has zero runtime effect since nothing imports it. The effective prompt (`SUMMARIZE_SYSTEM_PROMPT`) says "15-30" keywords, while the dead constant says "2-5".

**Location:** `src/prompts.ts` lines 14–31 (`JSON_OUTPUT_INSTRUCTION`)

**Options:**
1. Remove `JSON_OUTPUT_INSTRUCTION` and its export (cleanest)
2. Replace with a comment marker that it's deprecated/available for custom presets

---

## B3 (LOW) — `sanitizeJsonForParse` terminates after trailing backslash

**Severity:** LOW — only triggers on malformed JSON with trailing `\`.

**Root cause:** Line 100–108 of `prompts.ts`: when `ch === '\\'`, the code unconditionally increments `i` twice (once for the backslash, once for the next char) without checking bounds for the second increment properly. If the input ends with `\`, the code outputs the backslash, increments `i`, checks `i < text.length` (false), so doesn't read the next char, and increments `i` again. On the next loop iteration, `i < text.length` is false, so the loop exits. The trailing `\` is preserved in the output, which is harmless but could indicate a boundary issue in edge cases.

```ts
if (ch === '\\') {
  result += ch    // outputs backslash
  i++             // i points beyond last char
  if (i < text.length) {  // false — text ended with backslash
    result += text[i]
  }
  i++             // i now = text.length + 1 (harmless, loop exits)
  continue
}
```

**Location:** `src/prompts.ts` lines 100–108

**Fix:** Change to maintain the convention of only incrementing once per iteration:

```ts
if (ch === '\\') {
  result += ch
  i++
  if (i < text.length) {
    result += text[i]
    i++  // only increment if we consumed a second char
  }
  continue
}
```

---

## Bug-finding patterns checked and clean

| Pattern | Result |
|---------|--------|
| Stale closures in useEffect/useCallback deps | ✅ `onRequestCloseRef` pattern correct. `handleSave` deps include `summaryKeys`. `handleCreateSummary` deps exhaustive. |
| Protocol type union completeness | ✅ All message types in `BackendToFrontend` and `FrontendToBackend` unions. |
| Protocol version mismatch | ✅ SummarizeFlow uses `PROTOCOL_VERSION` from `types.ts` (fixed in e5b1252). |
| MutationObserver leaks | ✅ All observers have cleanup on unmount. 35s safety timeout on Duplicate blink observer. |
| DOM element card vs virtual row resolution | ✅ RangeSelector has matches/querySelector/closest fallback chain. |
| userId passed to all Spindle API calls | ✅ All world_books, generate, and chat calls pass userId where needed. |
| AbortSignal.timeout on generate.quiet | ✅ 2-minute timeout present (line 184). |
| Promise.race timeouts on spindle API calls | ✅ All calls have 10s-15s timeouts. |
| `_dispatchingRange` safety timeout | ✅ 5s auto-clear present (line 203). |
| `_modalOpen` safety timeout | ✅ 60s auto-clear present. |
| `_summarizingUsers` deadlock protection | ✅ 5-min auto-clear + `_summarizationCompleted` guard. |
| Concurrency guard reset on error | ✅ finally block always clears userId from Set. |
| JSON parse sanitization applied consistently | ✅ `tryParseSummaryJson` wraps all parse strategies. |
| Brace-depth scan string-state awareness | ✅ Forward scan tracks inString for Strategy 3. |
| TypeScript build | ✅ 0 errors (`bun run check`). |
| Parser tests | ✅ 32/32 passed. |

---

## Test coverage gaps

The test file (`src/__tests__/prompts.test.ts`) has good coverage of the parser but misses:

1. **Worker.ts fallback functions** — `generateSummary`'s brace-depth extraction fallback and content field extraction are NOT tested. These are ~80 lines of fallback logic that runs when `parseSummaryJson` returns null — exactly the worst-case scenario where bugs hide.
2. **Keys with special characters** — e.g., keys containing commas, quotes, or braces.
3. **Multiple consecutive trailing commas** — e.g., `{"a": 1,,}`.
4. **`\r\n` pair handling** in `sanitizeJsonForParse`.
5. **Worker integration** — no tests for `handleSummarizeV2`, `handleSaveSummary`, `resolveNextChronicleNumber`.

---

## Summary

| ID | Severity | Issue | File | Fix | Status |
|----|----------|-------|------|-----|--------|
| B1 | **MEDIUM** | `_generationParams` not captured in main.tsx → retry loses user's generation params | `main.tsx:154-169` | Add `params.generationParams` capture | ✅ Fixed |
| B2 | LOW | `JSON_OUTPUT_INSTRUCTION` is dead code after preset removal | `prompts.ts:14-31` | Remove or deprecate | ✅ Already resolved |
| B3 | LOW | `sanitizeJsonForParse` double-increment pattern on trailing backslash | `prompts.ts:100-108` | Branch increment in backslash handler | ✅ Fixed |

**Verdict:** 1 moderate functional bug, 2 cosmetic/low issues. The recent cleanup commits (preset pruning, JSON parser rewrite, UI polish) are overall sound. The `_generationParams` bug is the only thing that affects runtime behavior.

**Resolved:** 2026-05-27. Commit `d2e582e`. B1 + B3 fixed in source; B2 was already resolved (constant removed prior to audit).
