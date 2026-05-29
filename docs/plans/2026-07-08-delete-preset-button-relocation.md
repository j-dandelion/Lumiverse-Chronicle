# Delete Preset Button Relocation — Implementation Plan

> **For Hermes:** Implement directly — single-component UI relocation, no critic needed.

**Goal:** Move the "Delete Preset" button from its standalone `chronicle-pm-actions` div into the same toolbar row as Save/Export/Import, positioned to the left of Save.

**Architecture:** Two-file change — PromptManager.tsx (JSX structure) and styles.ts (CSS). The button keeps its destructive color scheme but matches toolbar button sizing and gains a dimmer border.

---

### Current State

- **Delete Preset** lives in its own `<div class="chronicle-pm-actions">` ABOVE the preview bar (lines 233-243)
- **Save / Export / Import** live in `<div class="chronicle-pm-toolbar">` inside the preview bar (lines 254-286)
- Delete has its own sizing (`padding: 2px 8px`, no border) distinct from toolbar buttons (`padding: 4px 8px`, `border: 1px solid var(--lumiverse-border)`)

### Target State

- Delete Preset appears INSIDE `chronicle-pm-toolbar`, before Save
- Uses toolbar button sizing (`padding: 4px 8px`, `font-size: calc(10px * ...)`, `border-radius: 4px`)
- Keeps its own colors (background + text) but gains a border that's a dimmer version of its text color
- Condition unchanged: only visible when `selectedPreset && !selectedPreset.builtIn`

---

### Task 1: Add `--chronicle-error-border` CSS variable

**Files:** `src/styles.ts`

**Step 1: Add the variable**

In the `:root` block, below `--chronicle-error-text`:

```css
--chronicle-error-border: rgba(252, 165, 165, 0.25);
```

This is `--chronicle-error-text` at 25% opacity — a dimmer version suitable for borders.

---

### Task 2: Update `.chronicle-pm-delete-btn` styles

**Files:** `src/styles.ts`

**Step 1: Replace the existing `.chronicle-pm-delete-btn` rule**

Current (line 276):
```css
.chronicle-pm-delete-btn { background: var(--chronicle-error-bg); color: var(--chronicle-error-text); }
```

Replace with:
```css
.chronicle-pm-delete-btn {
  background: var(--chronicle-error-bg);
  color: var(--chronicle-error-text);
  border: 1px solid var(--chronicle-error-border);
  font-size: calc(10px * var(--lumiverse-font-scale, 1));
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background var(--lumiverse-transition-fast);
}
.chronicle-pm-delete-btn:hover:not(:disabled) {
  background: var(--chronicle-error-bg);
  filter: brightness(1.3);
}
.chronicle-pm-delete-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

### Task 3: Move Delete button into toolbar

**Files:** `src/components/PromptManager.tsx`

**Step 1: Remove the old `chronicle-pm-actions` div** (lines 233-243)

Remove:
```tsx
{selectedPreset && !selectedPreset.builtIn && (
  <div class="chronicle-pm-actions">
    <button
      class="chronicle-pm-action-btn chronicle-pm-delete-btn"
      onClick={() => handleDeletePreset(selectedPreset.id)}
      disabled={loading}
    >
      Delete Preset
    </button>
  </div>
)}
```

**Step 2: Add Delete button inside the toolbar, before Save**

Inside the `<div class="chronicle-pm-toolbar">` (line 254), insert before the Save button:

```tsx
{selectedPreset && !selectedPreset.builtIn && (
  <button
    class="chronicle-pm-delete-btn"
    onClick={() => handleDeletePreset(selectedPreset.id)}
    disabled={loading}
    title="Delete this preset"
  >
    Delete Preset
  </button>
)}
```

Note: Remove the `chronicle-pm-action-btn` class — the button now uses only `chronicle-pm-delete-btn` with its full standalone styling.

---

### Task 4: Remove unused CSS

**Files:** `src/styles.ts`

**Step 1: Remove `.chronicle-pm-actions`** (line 268)

Remove:
```css
.chronicle-pm-actions { margin-top: -4px; }
```

**Step 2: Remove `.chronicle-pm-action-btn`** (lines 269-275)

Remove:
```css
.chronicle-pm-action-btn {
  font-size: calc(10px * var(--lumiverse-font-scale, 1));
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}
```

These are no longer used anywhere.

---

### Task 5: Build, deploy, verify

**Step 1: TypeScript check**
```bash
cd ~/chronicle_ext && bun run check
```
Expected: 0 errors.

**Step 2: Build + deploy (via commit)**
```bash
cd ~/chronicle_ext && git add -A && git commit -m "feat: relocate Delete Preset button to toolbar left of Save"
```
The post-commit hook runs `build.sh` automatically.

**Step 3: Verify in deployed frontend.js**
```bash
grep -c "Delete Preset" ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
```
Expected: 1 (single occurrence — the button text).

**Step 4: Verify old classes removed**
```bash
grep -c "chronicle-pm-action-btn\|chronicle-pm-actions" ~/Lumiverse/data/extensions/chronicle/repo/dist/frontend.js
```
Expected: 0 (both removed).

**Step 5: Hard-refresh browser and verify visually:**
- Select a custom preset from the dropdown
- Confirm "Delete Preset" appears in the toolbar row, to the left of Save
- Confirm it has the same size as Save/Export/Import
- Confirm it has a dim red border matching the text color
- Confirm clicking it deletes the preset and switches to Default
- Confirm it does NOT appear for built-in presets (e.g., "Default")
