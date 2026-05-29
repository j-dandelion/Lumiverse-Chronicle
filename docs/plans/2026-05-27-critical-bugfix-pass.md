# Chronicle — Critical Bugfix Pass

**Date:** 2026-05-27
**Scope:** All Chronicle source files
**Result:** 1 bug fixed · 17 areas verified clean

---

## Bug Fixed

### `handleErrorRetry` bypassed `retryable` flag on save errors

**File:** `src/components/SummarizeFlow.tsx`

When the backend sent `summarize_failed { stage: 'saving', retryable: false }` (permanent validation failure), clicking Retry would unconditionally call `handleSave()` again — looping forever with no escape. The `retryable` field was received by the handler but never stored.

**Fix:**
- Added `errorRetryable` state (defaults `true` for safety)
- `summarize_failed` handler now stores `retryable` from the message
- `handleErrorRetry` gates `handleSave()` behind `errorRetryable === true` in the save-error path
- Generation errors always allow retry (no change needed there)

---

## Verified Clean

| Area | File | Findings |
|------|------|----------|
| `saving` progress event routing | worker.ts:569, SummarizeFlow.tsx:223 | Correctly sent and handled |
| `__auto_generate__` routing | worker.ts:500, saveLorebookEntry:944 | Intentional; correct |
| `fetchRecentSummaries` number regex | worker.ts:909 | Works for all Chronicle book formats |
| `hideMessagesPriorTo` off-by-one | worker.ts:400 | Math is correct |
| `discard_summary` on unmount | SummarizeFlow.tsx:178 | Guarded by `flowState === 'saving'` — correct |
| `sanitizeJsonForParse` infinite loop | prompts.ts:104 | All paths advance index; no loop possible |
| Dual `summarize_saved` handlers | main.tsx, SummarizeFlow.tsx | Both fire; order is correct (modal then toast) |
| `generateSummary` error return | worker.ts:517 | Always returns null with frontend notification |
| Scene number in comment | worker.ts:974 | Number embedded in `displayName` — searchable |
| Pending summary TTL cleanup | worker.ts:115 | Server rejects expired save — surfaces correctly |
| `summarize_progress 'saving'` guard | SummarizeFlow.tsx:242 | 15s frontend safety timer coverage |
| Module-level preview handler | main.tsx:310 | Guarded by `_generating` — sufficient |
| `titleFormat` localStorage | SummarizeFlow.tsx | Multiple writes, same key — low risk |
| `handleSave` payload size | SummarizeFlow.tsx:325 | API accepts partial input server-side — acceptable |
| `errorStage` values | worker.ts | No functional impact from inconsistencies |
| `PendingSummary.sceneNumber` | worker.ts:536 | Always resolved when needed |

---

## Verification

- `bun run check` — 0 errors
- `bun src/__tests__/prompts.test.ts` — 44/44 passed
- `./build.sh` — clean build, deployed
