# Chronicle Extension: Custom Prompt Autosave + Modal Height Plan

## Task 1: Switch Prompt Preset Dropdown to Saved Preset After Save

**Problem**: After saving a custom prompt via the Save dialog, the preset dropdown stays on "Custom prompt…" instead of switching to the newly saved preset.

**Root Cause**: `handleSavePreset` in `PromptManager.tsx` saves the preset but doesn't update `selectedPresetId` or exit custom mode.

**Fix**: In `handleSavePreset`, after `savePreset()` returns the saved preset, call `setSelectedPresetId(saved.id)` and `setUseCustom(false)`.

**File**: `src/components/PromptManager.tsx`

---

## Task 2: Autosave Custom Prompts Every ~3 Seconds

**Problem**: Users editing a custom prompt risk losing changes if they close the modal without explicitly saving.

**Approach**: Add a debounced autosave interval in PromptManager. Once per interval, save/update an "Autosave" preset. The first autosave creates it; subsequent ones update it in-place.

### Changes to `src/presets.ts`
- Add `updateAutosavePreset(name, systemPrompt, params?)` — finds an existing preset by name (non-built-in) and updates `systemPrompt` + `params` in-place; returns the preset or null if not found.

### Changes to `src/components/PromptManager.tsx`
- Add `autosaveIntervalRef` (useRef) and `autosaveActive` (useState) for tracking the autosave lifecycle.
- Add `AUTOSAVE_NAME = 'Autosave'` constant.
- Add `startAutosaveInterval()`: starts a 3-second interval that saves to the "Autosave" preset, switches to it, and sets `autosaveActive = true`.
- Add `stopAutosaveInterval()`: clears the interval.
- Modify `handleCustomPromptChange` (or the `customPrompt` onChange): start/restart the autosave interval. Only starts if `useCustom && customPrompt.trim()`.
- On `showSaveDialog` close (cancel): stop the autosave interval.
- On component unmount: stop autosave interval.

### Autosave Logic Detail
The interval callback:
1. Find existing "Autosave" preset via `loadUserPresets().find(p => !p.builtIn && p.name === 'Autosave')`.
2. If found: call `updateAutosavePreset('Autosave', customPrompt, params)`.
3. If not found: call `savePreset('Autosave', customPrompt, params)`.
4. Call `setSelectedPresetId(saved.id)` and `setUseCustom(false)` to switch dropdown to the autosave preset.
5. Call `refreshPresets()`.

---

## Task 3: Autosave on Modal Close

**Problem**: If the modal closes before the 3-second autosave interval fires, unsaved changes are lost.

**Approach**: Add an `onBeforeClose` prop to PromptManager. When the modal is about to close, PromptManager fires `onBeforeClose()` which triggers an immediate save of the current custom prompt, then the modal actually closes.

### Changes to `src/components/PromptManager.tsx`
- Add `onBeforeClose?: () => void` to `Props` interface.
- Add `autosaveOnClose` helper: if `useCustom && customPrompt.trim()`, do the same save/update as the interval (create or update "Autosave" preset, refresh, switch dropdown).
- In `handleSavePreset` (explicit save): stop the autosave interval — explicit saves replace the autosave preset.
- Add a `useEffect` on mount: call `stopAutosaveInterval` on unmount.
- Expose `triggerAutosaveOnClose()` for the parent to call before closing.

### Changes to `src/main.tsx` (ChronicleModalShell + openChronicleModal + openPreviewModal)
- Add `handleBeforeClose` in the modal: when the modal is dismissed (via Escape, X button, or `modal.dismiss()`), call `onBeforeClose()` before `modal.dismiss()`.

**Challenge**: The `onClose` callback in `ChronicleModalShell` already calls `onClose()` (which is `modal.dismiss()`). We can't easily inject pre-close logic before `modal.dismiss()` without modifying how the shell works.

**Solution**: Instead of using `onClose`, use the modal's `onDismiss` event (exposed by `modal.onDismiss` in the Lumiverse API). The `dismissAndRelease` function already handles post-close cleanup. We can call the autosave *before* `modal.dismiss()` by wrapping the close trigger.

**Simplest implementation**: Add `onBeforeClose` prop to `ChronicleModalShell`, and call it when the close button/Escape is triggered. The close trigger is the `onClose` callback from `spindleCtx.ui.showModal()`. We pass our own handler that calls autosave then the real close.

```typescript
const handleClose = () => {
  onBeforeClose?.()
  onClose()
}
```

---

## Task 4: Increase Modal Minimum Height (Create Summary + Lorebook Entry Preview)

**Problem**: The `maxHeight: 720` limits how tall the modal can grow. With small viewports the modal can be pushed too close to screen edges.

**Fix**: Set `maxHeight` dynamically based on `window.innerHeight - 200` (100px top + 100px bottom margin), capped at 720 for very tall viewports.

**File**: `src/main.tsx` — in both `openChronicleModal` and `openPreviewModal`:

```typescript
const maxH = Math.min(720, window.innerHeight - 200)
const modal = spindleCtx.ui.showModal({
  title: 'Create Summary / Memory',
  width: 600,
  maxHeight: maxH,
})
```

Same for `openPreviewModal` with its title.

---

## Implementation Order

1. **`src/presets.ts`**: Add `updateAutosavePreset()`
2. **`src/components/PromptManager.tsx`**: Autosave interval, `onBeforeClose` prop, preset dropdown switch after save
3. **`src/main.tsx`**: Dynamic `maxHeight` in both modal openers + `onBeforeClose` wiring in `ChronicleModalShell`
4. Build, deploy, test

---

## Testing Checklist

- [ ] Open modal with custom prompt selected, make changes, wait 3+ seconds — "Autosave" preset appears in dropdown, is selected
- [ ] Wait another 3 seconds — "Autosave" preset is updated (same preset, not duplicated)
- [ ] Close modal with unsaved custom changes — autosave fires on close, "Autosave" preset is created/updated
- [ ] Explicitly save a custom preset with a name — dropdown switches to that preset immediately after save
- [ ] Open Create Summary modal — verify it has more height (taller) than before
- [ ] Open Lorebook Entry Preview modal — same
- [ ] Small viewport (e.g., 700px tall) — modals maintain 100px margin from top and bottom of screen