/**
 * SettingsManager — View settings preset selector and editor.
 * Mirrors the layout of Lumiverse's WorldBookEntryEditor.
 * Includes preset dropdown, toolbar, and full settings form.
 * Uses usePresetManager for shared preset CRUD/autosave/export/import logic.
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import type { FunctionComponent } from 'preact'
import { usePresetManager } from '../usePresetManager'
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

export const SettingsManager: FunctionComponent<Props> = ({
  settings,
  onSettingsChange,
  loading = false,
}) => {
  const pm = usePresetManager<SettingsPreset>({
    selectedKey: 'chronicle_selected_settings_preset',
    loadAll: getAllSettingsPresets,
    save: (name) => saveSettingsPreset(name, settings),
    update: (id, updates) => updateSettingsPreset(id, updates as { settings?: EntrySettings }),
    findByName: findSettingsPresetByName,
    deletePreset: deleteSettingsPreset,
    exportAll: exportSettingsPresets,
    importAll: importSettingsPresets,
  })

  // SettingsManager-specific state
  const [expanded, setExpanded] = useState(false)
  const [timingOpen, setTimingOpen] = useState(false)
  const [recursionOpen, setRecursionOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const [metadataOpen, setMetadataOpen] = useState(false)

  // Apply a preset's settings
  const applyPreset = useCallback((id: string) => {
    if (id === '__custom__') {
      pm.setUseCustom(true)
      return
    }
    pm.stopAutosaveInterval()
    const preset = getSettingsPreset(id)
    if (preset) {
      onSettingsChange({ ...preset.settings })
      pm.setSelectedPresetId(id)
      pm.setUseCustom(false)
      pm.setIsEditing(false)
    }
  }, [onSettingsChange, pm.stopAutosaveInterval])

  // Override handlePresetChange to load settings
  const handlePresetChange = useCallback((e: Event) => {
    const id = (e.target as HTMLSelectElement).value
    if (id === pm.selectedPresetId && !pm.useCustom) return
    if (id === '__custom__') {
      pm.setUseCustom(true)
    } else {
      applyPreset(id)
    }
  }, [pm.selectedPresetId, pm.useCustom, applyPreset])

  // Override ensureAutosavePreset to accept overrideSettings
  const ensureAutosavePreset = useCallback((overrideSettings?: EntrySettings) => {
    const currentPreset = pm.presets.find(p => p.id === pm.selectedPresetId)
    if (currentPreset && !currentPreset.builtIn) {
      if (!pm.isEditing) pm.setIsEditing(true)
      return
    }
    const autosave = pm.presets.find(p => p.name === 'Autosave' && !p.builtIn)
    if (autosave) {
      pm.setSelectedPresetId(autosave.id)
    } else {
      const saved = saveSettingsPreset('Autosave', overrideSettings ?? settings)
      pm.refreshPresets()
      pm.setSelectedPresetId(saved.id)
    }
    if (!pm.isEditing) pm.setIsEditing(true)
  }, [pm.presets, pm.selectedPresetId, settings, pm.refreshPresets, pm.isEditing])

  // Override doAutosave to save settings
  const doAutosave = useCallback(() => {
    if (!pm.isEditing) return

    const currentPreset = pm.presets.find(p => p.id === pm.selectedPresetId)
    if (currentPreset && !currentPreset.builtIn) {
      updateSettingsPreset(pm.selectedPresetId, { settings })
      pm.refreshPresets()
      return
    }

    const existing = findSettingsPresetByName('Autosave')
    let saved: SettingsPreset
    if (existing) {
      const updated = updateSettingsPreset(existing.id, { settings })
      if (!updated) return
      saved = updated
    } else {
      saved = saveSettingsPreset('Autosave', settings)
    }
    pm.refreshPresets()
    pm.setSelectedPresetId(saved.id)
    pm.setIsEditing(false)
  }, [pm.isEditing, settings, pm.refreshPresets, pm.presets, pm.selectedPresetId])

  // Wire the overrides into the hook's refs
  pm.doAutosaveRef.current = doAutosave

  // Override handleConfirmDelete to restore default settings
  const handleConfirmDelete = useCallback(() => {
    if (!pm.selectedPreset) return
    deleteSettingsPreset(pm.selectedPreset.id)
    pm.refreshPresets()
    if (pm.selectedPresetId === pm.selectedPreset.id) {
      pm.setSelectedPresetId('default')
      pm.setIsEditing(false)
      const defaultPreset = getSettingsPreset('default')
      if (defaultPreset) onSettingsChange({ ...defaultPreset.settings })
    }
    pm.setShowDeleteConfirm(false)
  }, [pm.selectedPreset, pm.selectedPresetId, pm.refreshPresets, onSettingsChange])

  // Save-as-preset handler
  const handleSavePreset = useCallback(() => {
    if (!pm.saveName.trim()) return
    pm.stopAutosaveInterval()
    pm.setIsEditing(false)
    const saved = saveSettingsPreset(pm.saveName.trim(), settings)
    pm.refreshPresets()
    pm.setSelectedPresetId(saved.id)
    pm.setUseCustom(false)
    pm.setSaveName('')
    pm.setShowSaveDialog(false)
  }, [pm.saveName, settings, pm.refreshPresets, pm.stopAutosaveInterval])

  // Generic field updater
  const update = useCallback(<K extends keyof EntrySettings>(key: K, value: EntrySettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    if (pm.useCustom || (pm.selectedPreset && !pm.selectedPreset.builtIn)) {
      ensureAutosavePreset(newSettings)
    }
  }, [settings, onSettingsChange, ensureAutosavePreset, pm.useCustom, pm.selectedPreset])

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
          value={pm.useCustom ? '__custom__' : pm.selectedPresetId}
          onChange={handlePresetChange}
          disabled={loading}
        >
          {pm.presets.map((p) => (
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
          {pm.selectedPreset && !pm.selectedPreset.builtIn && (
            <button
              class="chronicle-sm-delete-btn"
              onClick={pm.handleDeleteClick}
              disabled={loading}
              title="Delete this preset"
            >
              Delete Preset
            </button>
          )}
          <button
            class="chronicle-sm-tool-btn"
            onClick={() => pm.setShowSaveDialog(true)}
            disabled={loading || !pm.useCustom}
            title="Save as preset"
          >
            Save
          </button>
          <button
            class="chronicle-sm-tool-btn"
            onClick={pm.handleExport}
            disabled={pm.presets.filter((p) => !p.builtIn).length === 0}
            title="Export custom presets"
          >
            Export
          </button>
          <button
            class="chronicle-sm-tool-btn"
            onClick={pm.handleTriggerImport}
            disabled={loading}
            title="Import presets from file"
          >
            Import
          </button>
          <input
            ref={pm.fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={pm.handleImportFile}
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
                <input type="checkbox" checked={settings.selective} onChange={() => toggle('selective')} disabled={loading} />
                <span>Selective</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input type="checkbox" checked={settings.constant} onChange={() => toggle('constant')} disabled={loading} />
                <span>Constant</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input type="checkbox" checked={settings.disabled} onChange={() => toggle('disabled')} disabled={loading} />
                <span>Disabled</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input type="checkbox" checked={settings.caseSensitive} onChange={() => toggle('caseSensitive')} disabled={loading} />
                <span>Case Sensitive</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input type="checkbox" checked={settings.matchWholeWords} onChange={() => toggle('matchWholeWords')} disabled={loading} />
                <span>Match Whole Words</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input type="checkbox" checked={settings.useRegex} onChange={() => toggle('useRegex')} disabled={loading} />
                <span>Use Regex</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input type="checkbox" checked={settings.useProbability} onChange={() => toggle('useProbability')} disabled={loading} />
                <span>Use Probability</span>
              </label>
              <label class="chronicle-sm-toggle">
                <input type="checkbox" checked={settings.vectorized} onChange={() => toggle('vectorized')} disabled={loading} />
                <span>Vectorized</span>
              </label>
            </div>
            <div class="chronicle-sm-field-row">
              <div class="chronicle-sm-field chronicle-sm-field-small">
                <label class="chronicle-sm-field-label">Probability</label>
                <input type="number" class="chronicle-sm-input" value={settings.probability} min={0} max={100}
                  onInput={(e) => update('probability', parseInt((e.target as HTMLInputElement).value) || 0)} />
              </div>
              <div class="chronicle-sm-field chronicle-sm-field-small">
                <label class="chronicle-sm-field-label">Scan Depth</label>
                <input type="number" class="chronicle-sm-input" value={settings.scanDepth ?? ''} min={0} placeholder="Default"
                  onInput={(e) => { const val = (e.target as HTMLInputElement).value; update('scanDepth', val === '' ? null : parseInt(val) || 0) }} />
              </div>
              {settings.selective && (
                <div class="chronicle-sm-field">
                  <label class="chronicle-sm-field-label">Selective Logic</label>
                  <select class="chronicle-sm-select" value={settings.selectiveLogic}
                    onChange={(e) => update('selectiveLogic', Number((e.target as HTMLSelectElement).value) as 0|1|2|3)}>
                    {SELECTIVE_LOGIC_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Timing (collapsible) */}
          <button type="button" class="chronicle-sm-group-toggle" onClick={() => setTimingOpen((o) => !o)}>
            <span class={`chronicle-sm-chevron ${timingOpen ? 'chronicle-sm-chevron-open' : ''}`}>&#x25B6;</span>
            Timing
          </button>
          {timingOpen && (
            <div class="chronicle-sm-field-group">
              <div class="chronicle-sm-field-row">
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Priority</label>
                  <input type="number" class="chronicle-sm-input" value={settings.priority}
                    onInput={(e) => update('priority', parseInt((e.target as HTMLInputElement).value) || 0)} />
                </div>
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Sticky</label>
                  <input type="number" class="chronicle-sm-input" value={settings.sticky} min={0}
                    onInput={(e) => update('sticky', parseInt((e.target as HTMLInputElement).value) || 0)} />
                </div>
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Cooldown</label>
                  <input type="number" class="chronicle-sm-input" value={settings.cooldown} min={0}
                    onInput={(e) => update('cooldown', parseInt((e.target as HTMLInputElement).value) || 0)} />
                </div>
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Delay</label>
                  <input type="number" class="chronicle-sm-input" value={settings.delay} min={0}
                    onInput={(e) => update('delay', parseInt((e.target as HTMLInputElement).value) || 0)} />
                </div>
              </div>
            </div>
          )}

          {/* Recursion (collapsible) */}
          <button type="button" class="chronicle-sm-group-toggle" onClick={() => setRecursionOpen((o) => !o)}>
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
                  <input type="checkbox" checked={settings.preventRecursion} onChange={() => toggle('preventRecursion')} disabled={loading || settings.vectorized} />
                  <span>Prevent Recursion</span>
                </label>
                <label class="chronicle-sm-toggle">
                  <input type="checkbox" checked={settings.excludeRecursion} onChange={() => toggle('excludeRecursion')} disabled={loading || settings.vectorized} />
                  <span>Exclude Recursion</span>
                </label>
                <label class="chronicle-sm-toggle">
                  <input type="checkbox" checked={settings.delayUntilRecursion} onChange={() => toggle('delayUntilRecursion')} disabled={loading || settings.vectorized} />
                  <span>Delay Until Recursion</span>
                </label>
              </div>
            </div>
          )}

          {/* Group (collapsible) */}
          <button type="button" class="chronicle-sm-group-toggle" onClick={() => setGroupOpen((o) => !o)}>
            <span class={`chronicle-sm-chevron ${groupOpen ? 'chronicle-sm-chevron-open' : ''}`}>&#x25B6;</span>
            Group
          </button>
          {groupOpen && (
            <div class="chronicle-sm-field-group">
              <div class="chronicle-sm-field-row">
                <div class="chronicle-sm-field">
                  <label class="chronicle-sm-field-label">Group Name</label>
                  <input type="text" class="chronicle-sm-input" value={settings.groupName}
                    onInput={(e) => update('groupName', (e.target as HTMLInputElement).value)} />
                </div>
                <div class="chronicle-sm-field chronicle-sm-field-small">
                  <label class="chronicle-sm-field-label">Weight</label>
                  <input type="number" class="chronicle-sm-input" value={settings.groupWeight}
                    onInput={(e) => update('groupWeight', parseInt((e.target as HTMLInputElement).value) || 0)} />
                </div>
              </div>
              <label class="chronicle-sm-toggle">
                <input type="checkbox" checked={settings.groupOverride} onChange={() => toggle('groupOverride')} disabled={loading} />
                <span>Group Override</span>
              </label>
            </div>
          )}

          {/* Metadata (collapsible) */}
          <button type="button" class="chronicle-sm-group-toggle" onClick={() => setMetadataOpen((o) => !o)}>
            <span class={`chronicle-sm-chevron ${metadataOpen ? 'chronicle-sm-chevron-open' : ''}`}>&#x25B6;</span>
            Metadata
          </button>
          {metadataOpen && (
            <div class="chronicle-sm-field-group">
              <div class="chronicle-sm-field">
                <label class="chronicle-sm-field-label">Automation ID</label>
                <input type="text" class="chronicle-sm-input" value={settings.automationId}
                  onInput={(e) => update('automationId', (e.target as HTMLInputElement).value)} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import error */}
      {pm.importError && (
        <div class="chronicle-sm-error">{pm.importError}</div>
      )}

      {/* Save dialog */}
      {pm.showSaveDialog && (
        <div class="chronicle-sm-overlay" onClick={() => pm.setShowSaveDialog(false)}>
          <div class="chronicle-sm-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Save Settings as Preset</h4>
            <input
              class="chronicle-sm-input"
              value={pm.saveName}
              onInput={(e) => pm.setSaveName((e.target as HTMLInputElement).value)}
              placeholder="Preset name…"
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              autoFocus
            />
            <div class="chronicle-sm-dialog-actions">
              <button class="chronicle-sm-dialog-btn" onClick={() => pm.setShowSaveDialog(false)}>Cancel</button>
              <button class="chronicle-sm-dialog-btn chronicle-sm-dialog-primary" onClick={handleSavePreset} disabled={!pm.saveName.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {pm.showDeleteConfirm && pm.selectedPreset && (
        <div class="chronicle-dc-overlay" onClick={pm.handleCancelDelete}>
          <div class="chronicle-dc-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Delete Preset</h4>
            <p class="chronicle-dc-message">
              Are you sure you want to delete <strong>{pm.selectedPreset.name}</strong>? This cannot be undone.
            </p>
            <div class="chronicle-dc-actions">
              <button class="chronicle-dc-btn chronicle-dc-btn-delete" onClick={handleConfirmDelete}>
                Delete Preset
              </button>
              <button class="chronicle-dc-btn" onClick={pm.handleCancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
