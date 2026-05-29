# Delete Confirmation Popup — Implementation Plan

> **For Hermes:** Implement this directly — small, self-contained feature.

**Goal:** Add small confirmation popups when delete buttons are pressed in PromptManager and SettingsManager, preventing accidental preset deletion.

**Architecture:** Inline confirmation state in each component, plus shared CSS classes in `styles.ts`. The popup is a compact centered dialog (like the existing save dialog but smaller), styled with error-tone colors matching the delete buttons.

**Tech Stack:** Preact (useState), CSS with `--lumiverse-*` and `--chronicle-*` variables.

---

## Design Decisions

- **Popup style:** Compact centered overlay dialog (like save dialog), not inline tooltip. Consistent with existing dialog patterns.
- **Sizing:** `max-width: 280px`, `padding: 16px` — smaller than the 300-400px/20px save dialogs.
- **Colors:** Error-tone header using existing `--chronicle-error-text`, delete confirm button uses error bg + border (matching `.chronicle-pm-delete-btn`).
- **Shared CSS prefix:** `chronicle-dc-*` (delete confirm) — no per-component duplication.

---

### Task 1: Add delete confirmation CSS to styles.ts

**Objective:** Add shared CSS classes for the compact delete confirmation dialog.

**Files:**
- Modify: `src/styles.ts` (append before closing backtick)

**Step 1: Add CSS block**

Insert after the Settings Manager styles (~line 748, before the `/* ── Summarize Flow — Keys row` comment):

```css
    /* ── Delete Confirmation Popup ───────────────────── */
    .chronicle-dc-overlay {
      position: fixed; inset: 0;
      background: var(--chronicle-overlay-bg);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .chronicle-dc-dialog {
      background: var(--lumiverse-bg);
      border: 1px solid var(--lumiverse-border);
      border-radius: 10px;
      padding: 16px;
      max-width: 280px;
      width: 90%;
    }
    .chronicle-dc-dialog h4 {
      margin: 0 0 8px 0;
      font-size: calc(13px * var(--lumiverse-font-scale, 1));
      color: var(--chronicle-error-text);
      font-weight: 600;
    }
    .chronicle-dc-message {
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text);
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    .chronicle-dc-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .chronicle-dc-btn {
      padding: 5px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-dc-btn:hover {
      background: var(--lumiverse-fill-hover);
    }
    .chronicle-dc-btn-delete {
      background: var(--chronicle-error-bg);
      border-color: var(--chronicle-error-border);
      color: var(--chronicle-error-text);
    }
    .chronicle-dc-btn-delete:hover {
      filter: brightness(1.3);
    }
```

**Verification:** `cd ~/chronicle_ext && grep -c 'chronicle-dc-overlay' src/styles.ts` → 1

---

### Task 2: Add delete confirmation to PromptManager

**Objective:** Show confirmation popup before deleting a prompt preset.

**Files:**
- Modify: `src/components/PromptManager.tsx`

**Step 1: Add state**

Insert after line 39 (`const [importError, ...]`):
```tsx
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
```

**Step 2: Replace `handleDeletePreset`**

Replace lines 182-188:
```tsx
  const handleDeletePreset = useCallback((id: string) => {
    deletePreset(id)
    refreshPresets()
    if (selectedPresetId === id) {
      setSelectedPresetId('default')
    }
  }, [refreshPresets, selectedPresetId])
```

With:
```tsx
  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!selectedPreset) return
    deletePreset(selectedPreset.id)
    refreshPresets()
    if (selectedPresetId === selectedPreset.id) {
      setSelectedPresetId('default')
    }
    setShowDeleteConfirm(false)
  }, [selectedPreset, refreshPresets, selectedPresetId])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])
```

**Step 3: Wire delete button to show confirmation**

Change line 265 from:
```tsx
                  onClick={() => handleDeletePreset(selectedPreset.id)}
```
To:
```tsx
                  onClick={handleDeleteClick}
```

**Step 4: Add confirmation popup JSX**

Insert after the `{showSaveDialog && ...}` block (after line 403, before `</div>` closing the root):
```tsx
      {showDeleteConfirm && selectedPreset && (
        <div class="chronicle-dc-overlay" onClick={handleCancelDelete}>
          <div class="chronicle-dc-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Delete Preset</h4>
            <p class="chronicle-dc-message">
              Are you sure you want to delete <strong>{selectedPreset.name}</strong>? This cannot be undone.
            </p>
            <div class="chronicle-dc-actions">
              <button class="chronicle-dc-btn" onClick={handleCancelDelete}>Cancel</button>
              <button class="chronicle-dc-btn chronicle-dc-btn-delete" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
```

---

### Task 3: Add delete confirmation to SettingsManager

**Objective:** Show confirmation popup before deleting a settings preset.

**Files:**
- Modify: `src/components/SettingsManager.tsx`

**Step 1: Add state**

Insert after line 56 (`const [importError, ...]`):
```tsx
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
```

**Step 2: Replace `handleDeletePreset`**

Replace lines 180-188:
```tsx
  const handleDeletePreset = useCallback((id: string) => {
    deleteSettingsPreset(id)
    refreshPresets()
    if (selectedPresetId === id) {
      setSelectedPresetId('default')
      const defaultPreset = getSettingsPreset('default')
      if (defaultPreset) onSettingsChange({ ...defaultPreset.settings })
    }
  }, [refreshPresets, selectedPresetId, onSettingsChange])
```

With:
```tsx
  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!selectedPreset) return
    deleteSettingsPreset(selectedPreset.id)
    refreshPresets()
    if (selectedPresetId === selectedPreset.id) {
      setSelectedPresetId('default')
      const defaultPreset = getSettingsPreset('default')
      if (defaultPreset) onSettingsChange({ ...defaultPreset.settings })
    }
    setShowDeleteConfirm(false)
  }, [selectedPreset, refreshPresets, selectedPresetId, onSettingsChange])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])
```

**Step 3: Wire delete button to show confirmation**

Change line 270 from:
```tsx
              onClick={() => handleDeletePreset(selectedPreset.id)}
```
To:
```tsx
              onClick={handleDeleteClick}
```

**Step 4: Add confirmation popup JSX**

Insert after the `{showSaveDialog && ...}` block (after line 688, before `</div>` closing the root):
```tsx
      {showDeleteConfirm && selectedPreset && (
        <div class="chronicle-dc-overlay" onClick={handleCancelDelete}>
          <div class="chronicle-dc-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Delete Preset</h4>
            <p class="chronicle-dc-message">
              Are you sure you want to delete <strong>{selectedPreset.name}</strong>? This cannot be undone.
            </p>
            <div class="chronicle-dc-actions">
              <button class="chronicle-dc-btn" onClick={handleCancelDelete}>Cancel</button>
              <button class="chronicle-dc-btn chronicle-dc-btn-delete" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
```

---

### Task 4: Build, deploy, verify

**Step 1: Build**
```bash
cd ~/chronicle_ext && ./build.sh
```
Expected: tsc --noEmit passes, both bundles built, deploy succeeds.

**Step 2: Verify CSS landed**
```bash
grep -c 'chronicle-dc-overlay' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
```
Expected: ≥ 1

**Step 3: Verify delete confirm callbacks landed in PromptManager**
```bash
grep -c 'showDeleteConfirm' ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
```
Expected: ≥ 4 (two components × (state declaration + conditional render))

**Step 4: Commit**
```bash
cd ~/chronicle_ext
git add -A
git commit -m "feat: add delete confirmation popups for prompt and settings presets"
```

---

### Task 5: Update DEVLOG.md

Add entry under Recent Changes for today's date.
