/**
 * SettingsManager — View settings preset selector and editor.
 * Mirrors the layout of Lumiverse's WorldBookEntryEditor.
 * Includes preset dropdown, toolbar, and full settings form.
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import type { FunctionComponent } from 'preact'
import {
  getAllSettingsPresets,
  getSettingsPreset,
  saveSettingsPreset,
  updateSettingsPreset,
  findSettingsPresetByName,
  deleteSettingsPreset,
  exportSettingsPresets,
  importSettingsPresets,
  DEFAULT_SETTINGS,
  POSITION_OPTIONS,
  ROLE_OPTIONS,
  SELECTIVE_LOGIC_OPTIONS,
  type EntrySettings,
  type SettingsPreset,
} from '../settings'

interface Props {
  settings: EntrySettings
  onSettingsChange: (settings: EntrySettings) => void
  loading?: boolean
}

const SETTINGS_SELECTED_KEY = 'chronicle_selected_settings_preset'

export const SettingsManager: FunctionComponent<Props> = ({
  settings,
  onSettingsChange,
  loading = false,
}) => {
  const [presets, setPresets] = useState<SettingsPreset[]>([])

  // Restore last-selected preset from localStorage
  const restoreSelectedPreset = (): string => {
    try {
      const saved = localStorage.getItem(SETTINGS_SELECTED_KEY)
      if (saved && getAllSettingsPresets().some((p) => p.id === saved)) return saved
    } catch { /* ignore */ }
    return 'default'
  }

  const [selectedPresetId, setSelectedPresetId] = useState<string>(restoreSelectedPreset)
  const [useCustom, setUseCustom] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autosaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doAutosaveRef = useRef<(() => void) | null>(null)  // set after doAutosave is defined
  const AUTOSAVE_NAME = 'Autosave'

  // Collapsible section states
  const [timingOpen, setTimingOpen] = useState(false)
  const [recursionOpen, setRecursionOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const [metadataOpen, setMetadataOpen] = useState(false)

  useEffect(() => {
    setPresets(getAllSettingsPresets())
  }, [])

  const refreshPresets = useCallback(() => {
    setPresets(getAllSettingsPresets())
  }, [])

  // Apply a preset's settings
  const applyPreset = useCallback((id: string) => {
    if (id === '__custom__') {
      setUseCustom(true)
      return
    }
    // Save current edits before switching away
    doAutosaveRef.current?.()
    if (autosaveIntervalRef.current !== null) {
      clearInterval(autosaveIntervalRef.current)
      autosaveIntervalRef.current = null
    }
    const preset = getSettingsPreset(id)
    if (preset) {
      onSettingsChange({ ...preset.settings })
      setSelectedPresetId(id)
      setUseCustom(false)
      setIsEditing(false)
      try { localStorage.setItem(SETTINGS_SELECTED_KEY, id) } catch { /* ignore */ }
    }
  }, [onSettingsChange])

  const handlePresetChange = useCallback((e: Event) => {
    const id = (e.target as HTMLSelectElement).value
    // Guard: selecting the already-active preset is a no-op
    if (id === selectedPresetId && !useCustom) return
    if (id === '__custom__') {
      // Switching to custom mode — preserve current settings as-is
      setUseCustom(true)
    } else {
      applyPreset(id)
    }
  }, [useCustom, applyPreset])

  // ── Autosave helpers ──────────────────────────────────────────────

  // Ensure the Autosave preset exists and switch to it — single render, no flicker.
  // Only switches to Autosave for built-in presets; custom presets stay on their own preset.
  const ensureAutosavePreset = useCallback((overrideSettings?: EntrySettings) => {
    const currentPreset = presets.find(p => p.id === selectedPresetId)
    if (currentPreset && !currentPreset.builtIn) {
      // Editing a custom preset — stay on it, just mark as editing
      if (!isEditing) setIsEditing(true)
      return
    }
    const autosave = presets.find(p => p.name === AUTOSAVE_NAME && !p.builtIn)
    if (autosave) {
      setSelectedPresetId(autosave.id)
      try { localStorage.setItem(SETTINGS_SELECTED_KEY, autosave.id) } catch { /* ignore */ }
    } else {
      const saved = saveSettingsPreset(AUTOSAVE_NAME, overrideSettings ?? settings)
      refreshPresets()
      setSelectedPresetId(saved.id)
      try { localStorage.setItem(SETTINGS_SELECTED_KEY, saved.id) } catch { /* ignore */ }
    }
    if (!isEditing) setIsEditing(true)
  }, [presets, selectedPresetId, settings, refreshPresets, isEditing])

  const doAutosave = useCallback(() => {
    if (!isEditing) return

    const currentPreset = presets.find(p => p.id === selectedPresetId)
    if (currentPreset && !currentPreset.builtIn) {
      updateSettingsPreset(selectedPresetId, { settings })
      refreshPresets()
      return
    }

    const existing = findSettingsPresetByName(AUTOSAVE_NAME)
    let saved: SettingsPreset
    if (existing) {
      const updated = updateSettingsPreset(existing.id, { settings })
      if (!updated) return
      saved = updated
    } else {
      saved = saveSettingsPreset(AUTOSAVE_NAME, settings)
    }
    refreshPresets()
    setSelectedPresetId(saved.id)
    setIsEditing(false)
    try { localStorage.setItem(SETTINGS_SELECTED_KEY, saved.id) } catch { /* ignore */ }
  }, [isEditing, settings, refreshPresets, presets, selectedPresetId])

  // Wire up the early ref
  doAutosaveRef.current = doAutosave

  const stopAutosaveInterval = useCallback(() => {
    if (autosaveIntervalRef.current !== null) {
      clearInterval(autosaveIntervalRef.current)
      autosaveIntervalRef.current = null
    }
  }, [])

  const startAutosaveInterval = useCallback(() => {
    stopAutosaveInterval()
    autosaveIntervalRef.current = setInterval(() => doAutosaveRef.current?.(), 3000)
  }, [stopAutosaveInterval])

  // Final save on unmount only (modal close)
  useEffect(() => {
    return () => {
      doAutosaveRef.current?.()
      stopAutosaveInterval()
    }
  }, [])

  // Start/stop interval when editing state changes
  useEffect(() => {
    if (isEditing) {
      doAutosaveRef.current?.()
      startAutosaveInterval()
    } else {
      stopAutosaveInterval()
    }
  }, [isEditing])

  const handleSavePreset = useCallback(() => {
    if (!saveName.trim()) return
    stopAutosaveInterval()
    setIsEditing(false)
    const saved = saveSettingsPreset(saveName.trim(), settings)
    refreshPresets()
    setSelectedPresetId(saved.id)
    setUseCustom(false)
    try { localStorage.setItem(SETTINGS_SELECTED_KEY, saved.id) } catch { /* ignore */ }
    setSaveName('')
    setShowSaveDialog(false)
  }, [saveName, settings, refreshPresets, stopAutosaveInterval])

  const selectedPreset = presets.find((p) => p.id === selectedPresetId)

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!selectedPreset) return
    deleteSettingsPreset(selectedPreset.id)
    refreshPresets()
    if (selectedPresetId === selectedPreset.id) {
      setSelectedPresetId('default')
      setIsEditing(false)
      try { localStorage.setItem(SETTINGS_SELECTED_KEY, 'default') } catch { /* ignore */ }
      const defaultPreset = getSettingsPreset('default')
      if (defaultPreset) onSettingsChange({ ...defaultPreset.settings })
    }
    setShowDeleteConfirm(false)
  }, [selectedPreset, selectedPresetId, refreshPresets, onSettingsChange])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  // Close delete confirmation if selectedPresetId changes externally
  useEffect(() => {
    if (showDeleteConfirm) setShowDeleteConfirm(false)
  }, [selectedPresetId])

  const handleExport = useCallback(() => {
    const json = exportSettingsPresets()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chronicle-settings-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleImportFile = useCallback((e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const result = importSettingsPresets(text)
      if (result.success) {
        refreshPresets()
        setImportError(null)
      } else {
        setImportError(result.error || 'Import failed')
      }
    }
    reader.readAsText(file)
    input.value = ''
  }, [refreshPresets])

  const handleTriggerImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Generic field updater
  const update = useCallback(<K extends keyof EntrySettings>(key: K, value: EntrySettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    ensureAutosavePreset(newSettings)
  }, [settings, onSettingsChange, ensureAutosavePreset])

  // Toggle helper
  const toggle = useCallback(<K extends keyof EntrySettings>(key: K) => {
    update(key, !settings[key] as EntrySettings[K])
  }, [update, settings])

  return (
    <div data-chronicle="settings-manager">
      {/* Preset dropdown row */}
      <div class="chronicle-sm-row">
        <label class="chronicle-sm-label">Lorebook Settings Preset</label>
        <select
          class="chronicle-sm-select"
          value={useCustom ? '__custom__' : selectedPresetId}
          onChange={handlePresetChange}
          disabled={loading}
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.builtIn ? '' : ' (custom)'}
            </option>
          ))}
          <option value="__custom__">Custom settings…</option>
        </select>
      </div>

      {/* Preview bar — expand toggle + toolbar */}
      <div class="chronicle-sm-preview-bar">
        <span
          class="chronicle-sm-summary"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? '\u25bc' : '\u25b6'} View settings
        </span>
        <div class="chronicle-sm-toolbar">
          {selectedPreset && !selectedPreset.builtIn && (
            <button
              class="chronicle-sm-delete-btn"
              onClick={handleDeleteClick}
              disabled={loading}
              title="Delete this preset"
            >
              Delete Preset
            </button>
          )}
          <button
            class="chronicle-sm-tool-btn"
            onClick={() => setShowSaveDialog(true)}
            disabled={loading || !useCustom}
            title="Save as preset"
          >
            Save
          </button>
          <button
            class="chronicle-sm-tool-btn"
            onClick={handleExport}
            disabled={presets.filter((p) => !p.builtIn).length === 0}
            title="Export custom presets"
          >
            Export
          </button>
          <button
            class="chronicle-sm-tool-btn"
            onClick={handleTriggerImport}
            disabled={loading}
            title="Import presets from file"
          >
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </div>

      {expanded && (
        <div class="chronicle-sm-form">
          {/* Injection */}
          <span class="chronicle-sm-section-heading">Injection</span>
          <div class="chronicle-sm-field-group">
            <div class="chronicle-sm-field-row">
              <div class="chronicle-sm-field">
                <label class="chronicle-sm-field-label">Position</label>
                <select
                  class="chronicle-sm-select"
                  value={settings.position}
                  onChange={(e) => update('position', Number((e.target as HTMLSelectElement).value) as 0|1|2|3|4)}
                >
                  {POSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {settings.position === 4 && (
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Depth</label>
                  <input
                    type="number"
                    class="chronicle-sm-input"
                    value={settings.depth}
                    min={0}
                    onInput={(e) => update('depth', parseInt((e.target as HTMLInputElement).value) || 0)}
                  />
                </div>
              )}
              <div class="chronicle-sm-field">
                <label class="chronicle-sm-field-label">Role</label>
                <select
                  class="chronicle-sm-select"
                  value={settings.role}
                  onChange={(e) => update('role', (e.target as HTMLSelectElement).value as 'system'|'user'|'assistant')}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div class="chronicle-sm-field chronicle-sm-field-small">
                <label class="chronicle-sm-field-label">Order</label>
                <input
                  type="number"
                  class="chronicle-sm-input"
                  value={settings.order}
                  onInput={(e) => update('order', parseInt((e.target as HTMLInputElement).value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Activation */}
          <span class="chronicle-sm-section-heading">Activation</span>
          <div class="chronicle-sm-field-group">
            <div class="chronicle-sm-toggle-row">
              <label class="chronicle-sm-toggle">
                <input
                  type="checkbox"
                  checked={settings.selective}
                  onChange={() => toggle('selective')}
                  disabled={loading}
                />
                <span>Selective</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input
                  type="checkbox"
                  checked={settings.constant}
                  onChange={() => toggle('constant')}
                  disabled={loading}
                />
                <span>Constant</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input
                  type="checkbox"
                  checked={settings.disabled}
                  onChange={() => toggle('disabled')}
                  disabled={loading}
                />
                <span>Disabled</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input
                  type="checkbox"
                  checked={settings.caseSensitive}
                  onChange={() => toggle('caseSensitive')}
                  disabled={loading}
                />
                <span>Case Sensitive</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input
                  type="checkbox"
                  checked={settings.matchWholeWords}
                  onChange={() => toggle('matchWholeWords')}
                  disabled={loading}
                />
                <span>Match Whole Words</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input
                  type="checkbox"
                  checked={settings.useRegex}
                  onChange={() => toggle('useRegex')}
                  disabled={loading}
                />
                <span>Use Regex</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input
                  type="checkbox"
                  checked={settings.useProbability}
                  onChange={() => toggle('useProbability')}
                  disabled={loading}
                />
                <span>Use Probability</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input
                  type="checkbox"
                  checked={settings.vectorized}
                  onChange={() => toggle('vectorized')}
                  disabled={loading}
                />
                <span>Vectorized</span>
              </label>
            </div>
            <div class="chronicle-sm-field-row">
              <div class="chronicle-sm-field chronicle-sm-field-small">
                <label class="chronicle-sm-field-label">Probability</label>
                <input
                  type="number"
                  class="chronicle-sm-input"
                  value={settings.probability}
                  min={0}
                  max={100}
                  onInput={(e) => update('probability', parseInt((e.target as HTMLInputElement).value) || 0)}
                />
              </div>
              <div class="chronicle-sm-field chronicle-sm-field-small">
                <label class="chronicle-sm-field-label">Scan Depth</label>
                <input
                  type="number"
                  class="chronicle-sm-input"
                  value={settings.scanDepth ?? ''}
                  min={0}
                  placeholder="Default"
                  onInput={(e) => {
                    const val = (e.target as HTMLInputElement).value
                    update('scanDepth', val === '' ? null : parseInt(val) || 0)
                  }}
                />
              </div>
              {settings.selective && (
                <div class="chronicle-sm-field">
                  <label class="chronicle-sm-field-label">Selective Logic</label>
                  <select
                    class="chronicle-sm-select"
                    value={settings.selectiveLogic}
                    onChange={(e) => update('selectiveLogic', Number((e.target as HTMLSelectElement).value) as 0|1|2|3)}
                  >
                    {SELECTIVE_LOGIC_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Timing (collapsible) */}
          <button
            type="button"
            class="chronicle-sm-group-toggle"
            onClick={() => setTimingOpen((o) => !o)}
          >
            <span class={`chronicle-sm-chevron ${timingOpen ? 'chronicle-sm-chevron-open' : ''}`}>&#x25B6;</span>
            Timing
          </button>
          {timingOpen && (
            <div class="chronicle-sm-field-group">
              <div class="chronicle-sm-field-row">
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Priority</label>
                  <input
                    type="number"
                    class="chronicle-sm-input"
                    value={settings.priority}
                    onInput={(e) => update('priority', parseInt((e.target as HTMLInputElement).value) || 0)}
                  />
                </div>
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Sticky</label>
                  <input
                    type="number"
                    class="chronicle-sm-input"
                    value={settings.sticky}
                    min={0}
                    onInput={(e) => update('sticky', parseInt((e.target as HTMLInputElement).value) || 0)}
                  />
                </div>
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Cooldown</label>
                  <input
                    type="number"
                    class="chronicle-sm-input"
                    value={settings.cooldown}
                    min={0}
                    onInput={(e) => update('cooldown', parseInt((e.target as HTMLInputElement).value) || 0)}
                  />
                </div>
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Delay</label>
                  <input
                    type="number"
                    class="chronicle-sm-input"
                    value={settings.delay}
                    min={0}
                    onInput={(e) => update('delay', parseInt((e.target as HTMLInputElement).value) || 0)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recursion (collapsible) */}
          <button
            type="button"
            class="chronicle-sm-group-toggle"
            onClick={() => setRecursionOpen((o) => !o)}
          >
            <span class={`chronicle-sm-chevron ${recursionOpen ? 'chronicle-sm-chevron-open' : ''}`}>&#x25B6;</span>
            Recursion{settings.vectorized ? ' (inactive for vector)' : ''}
          </button>
          {recursionOpen && (
            <div class="chronicle-sm-field-group">
              {settings.vectorized && (
                <div class="chronicle-sm-inactive-note">
                  Vectorized entries do not participate in recursive keyword chaining. Semantic retrieval uses indexed content directly.
                </div>
              )}
              <div class="chronicle-sm-toggle-row">
                <label class="chronicle-sm-toggle">
                  <input
                    type="checkbox"
                    checked={settings.preventRecursion}
                    onChange={() => toggle('preventRecursion')}
                    disabled={loading || settings.vectorized}
                  />
                  <span>Prevent Recursion</span>
                </label>
                <label class="chronicle-sm-toggle">
                  <input
                    type="checkbox"
                    checked={settings.excludeRecursion}
                    onChange={() => toggle('excludeRecursion')}
                    disabled={loading || settings.vectorized}
                  />
                  <span>Exclude Recursion</span>
                </label>
                <label class="chronicle-sm-toggle">
                  <input
                    type="checkbox"
                    checked={settings.delayUntilRecursion}
                    onChange={() => toggle('delayUntilRecursion')}
                    disabled={loading || settings.vectorized}
                  />
                  <span>Delay Until Recursion</span>
                </label>
              </div>
            </div>
          )}

          {/* Group (collapsible) */}
          <button
            type="button"
            class="chronicle-sm-group-toggle"
            onClick={() => setGroupOpen((o) => !o)}
          >
            <span class={`chronicle-sm-chevron ${groupOpen ? 'chronicle-sm-chevron-open' : ''}`}>&#x25B6;</span>
            Group
          </button>
          {groupOpen && (
            <div class="chronicle-sm-field-group">
              <div class="chronicle-sm-field-row">
                <div class="chronicle-sm-field">
                  <label class="chronicle-sm-field-label">Group Name</label>
                  <input
                    type="text"
                    class="chronicle-sm-input"
                    value={settings.groupName}
                    onInput={(e) => update('groupName', (e.target as HTMLInputElement).value)}
                  />
                </div>
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Weight</label>
                  <input
                    type="number"
                    class="chronicle-sm-input"
                    value={settings.groupWeight}
                    onInput={(e) => update('groupWeight', parseInt((e.target as HTMLInputElement).value) || 0)}
                  />
                </div>
              </div>
              <label class="chronicle-sm-toggle">
                <input
                  type="checkbox"
                  checked={settings.groupOverride}
                  onChange={() => toggle('groupOverride')}
                  disabled={loading}
                />
                <span>Group Override</span>
              </label>
            </div>
          )}

          {/* Metadata (collapsible) */}
          <button
            type="button"
            class="chronicle-sm-group-toggle"
            onClick={() => setMetadataOpen((o) => !o)}
          >
            <span class={`chronicle-sm-chevron ${metadataOpen ? 'chronicle-sm-chevron-open' : ''}`}>&#x25B6;</span>
            Metadata
          </button>
          {metadataOpen && (
            <div class="chronicle-sm-field-group">
              <div class="chronicle-sm-field">
                <label class="chronicle-sm-field-label">Automation ID</label>
                <input
                  type="text"
                  class="chronicle-sm-input"
                  value={settings.automationId}
                  onInput={(e) => update('automationId', (e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import error */}
      {importError && (
        <div class="chronicle-sm-error">{importError}</div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <div class="chronicle-sm-overlay" onClick={() => setShowSaveDialog(false)}>
          <div class="chronicle-sm-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Save Settings as Preset</h4>
            <input
              class="chronicle-sm-input"
              value={saveName}
              onInput={(e) => setSaveName((e.target as HTMLInputElement).value)}
              placeholder="Preset name…"
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              autoFocus
            />
            <div class="chronicle-sm-dialog-actions">
              <button class="chronicle-sm-dialog-btn" onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button class="chronicle-sm-dialog-btn chronicle-sm-dialog-primary" onClick={handleSavePreset} disabled={!saveName.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedPreset && (
        <div class="chronicle-dc-overlay" onClick={handleCancelDelete}>
          <div class="chronicle-dc-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Delete Preset</h4>
            <p class="chronicle-dc-message">
              Are you sure you want to delete <strong>{selectedPreset.name}</strong>? This cannot be undone.
            </p>
            <div class="chronicle-dc-actions">
              <button class="chronicle-dc-btn chronicle-dc-btn-delete" onClick={handleConfirmDelete}>
                Delete Preset
              </button>
              <button class="chronicle-dc-btn" onClick={handleCancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
