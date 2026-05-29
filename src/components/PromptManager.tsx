/**
 * PromptManager — Prompt preset selector with custom editor, save/export/import.
 * Uses usePresetManager for shared preset CRUD/autosave/export/import logic.
 */
import { useState, useEffect, useCallback, useMemo } from 'preact/hooks'
import type { FunctionComponent } from 'preact'
import { usePresetManager } from '../usePresetManager'
import { getAllPresets, getPreset, savePreset, updatePreset, findPresetByName, deletePreset, exportPresets, importPresets, getOldFormatPresets, DEFAULT_PARAMS, type PromptPreset } from '../presets'
import type { GenerationParams } from '../types'

interface Props {
  onActivePromptChange?: (prompt: string | undefined) => void
  onParamsChange?: (params: GenerationParams | undefined) => void
  loading?: boolean
}

export const PromptManager: FunctionComponent<Props> = ({
  onActivePromptChange,
  onParamsChange,
  loading = false,
}) => {
  const pm = usePresetManager<PromptPreset>({
    selectedKey: 'chronicle_selected_prompt_preset',
    loadAll: getAllPresets,
    save: (name) => savePreset(name, '', params),
    update: (id, updates) => updatePreset(id, updates as { systemPrompt?: string; params?: GenerationParams }),
    findByName: findPresetByName,
    deletePreset: deletePreset,
    exportAll: exportPresets,
    importAll: importPresets,
  })

  // PromptManager-specific state
  const [params, setParams] = useState<GenerationParams>({ ...DEFAULT_PARAMS })
  const [customPrompt, setCustomPrompt] = useState('')
  const [expanded, setExpanded] = useState(false)

  // Compute the effective active prompt and report it to parent
  const activePrompt = useMemo((): string | undefined => {
    if (pm.useCustom && customPrompt.trim()) return customPrompt.trim()
    if (!pm.useCustom) {
      const preset = getPreset(pm.selectedPresetId)
      return preset?.systemPrompt
    }
    return undefined
  }, [pm.useCustom, customPrompt, pm.selectedPresetId])

  useEffect(() => {
    onActivePromptChange?.(activePrompt)
  }, [activePrompt, onActivePromptChange])

  // Sync params when preset changes via non-handler path
  useEffect(() => {
    if (!pm.useCustom && pm.selectedPresetId) {
      const preset = getPreset(pm.selectedPresetId)
      if (preset?.params) {
        setParams({ ...preset.params })
      } else {
        setParams({ ...DEFAULT_PARAMS })
      }
    }
  }, [pm.selectedPresetId, pm.useCustom])

  useEffect(() => {
    onParamsChange?.(params)
  }, [params, onParamsChange])

  // ── PromptManager-specific overrides ─────────────────────────────

  // Override handlePresetChange to seed customPrompt and load params
  const handlePresetChange = useCallback((e: Event) => {
    const id = (e.target as HTMLSelectElement).value
    if (id === pm.selectedPresetId && !pm.useCustom) return

    if (id === '__custom__') {
      if (!pm.useCustom) {
        const current = getPreset(pm.selectedPresetId)
        if (current) setCustomPrompt(current.systemPrompt || '')
      }
      pm.setUseCustom(true)
    } else {
      pm.doAutosaveRef.current?.()
      pm.stopAutosaveInterval()
      pm.setSelectedPresetId(id)
      pm.setUseCustom(false)
      pm.setIsEditing(false)
      setCustomPrompt('')
      const preset = getPreset(id)
      if (preset?.params) {
        setParams({ ...preset.params })
      } else {
        setParams({ ...DEFAULT_PARAMS })
      }
    }
  }, [pm.selectedPresetId, pm.useCustom, pm.stopAutosaveInterval])

  // Override ensureAutosavePreset to seed customPrompt and load params
  const ensureAutosavePreset = useCallback((promptOverride?: string) => {
    const currentPreset = pm.presets.find(p => p.id === pm.selectedPresetId)
    if (currentPreset && !currentPreset.builtIn) {
      if (!pm.isEditing) pm.setIsEditing(true)
      return
    }
    if (promptOverride === undefined && !customPrompt.trim() && currentPreset?.systemPrompt) {
      setCustomPrompt(currentPreset.systemPrompt)
    }
    const localAutosave = findPresetByName('Autosave')
    if (localAutosave) {
      pm.setSelectedPresetId(localAutosave.id)
      if (localAutosave.params) setParams({ ...localAutosave.params })
    } else {
      const saved = savePreset('Autosave', promptOverride ?? (customPrompt || currentPreset?.systemPrompt || ''), params)
      pm.refreshPresets()
      pm.setSelectedPresetId(saved.id)
    }
    if (!pm.isEditing) pm.setIsEditing(true)
  }, [pm.presets, pm.selectedPresetId, customPrompt, params, pm.refreshPresets, pm.isEditing])

  // Override doAutosave to save customPrompt + params
  const doAutosave = useCallback(() => {
    if (!pm.isEditing) return

    const currentPreset = pm.presets.find(p => p.id === pm.selectedPresetId)
    if (currentPreset && !currentPreset.builtIn) {
      const update: { params: GenerationParams; systemPrompt?: string } = { params }
      if (customPrompt.trim()) update.systemPrompt = customPrompt
      updatePreset(pm.selectedPresetId, update)
      pm.refreshPresets()
      return
    }

    if (!customPrompt.trim()) return

    const existing = findPresetByName('Autosave')
    let saved: PromptPreset
    if (existing) {
      const updated = updatePreset(existing.id, { systemPrompt: customPrompt, params })
      if (!updated) return
      saved = updated
    } else {
      saved = savePreset('Autosave', customPrompt, params)
    }
    pm.refreshPresets()
    pm.setSelectedPresetId(saved.id)
    pm.setIsEditing(false)
  }, [pm.isEditing, customPrompt, params, pm.refreshPresets, pm.presets, pm.selectedPresetId])

  // Wire the overrides into the hook's refs
  pm.doAutosaveRef.current = doAutosave

  // Override the editing-started effect to check customPrompt
  useEffect(() => {
    if (pm.isEditing && customPrompt.trim()) {
      pm.doAutosaveRef.current?.()
      pm.startAutosaveInterval()
    } else {
      pm.stopAutosaveInterval()
    }
  }, [pm.isEditing, customPrompt])

  // Override handleConfirmDelete to also clear customPrompt
  const handleConfirmDelete = useCallback(() => {
    if (!pm.selectedPreset) return
    deletePreset(pm.selectedPreset.id)
    pm.refreshPresets()
    if (pm.selectedPresetId === pm.selectedPreset.id) {
      pm.setSelectedPresetId('default')
      pm.setIsEditing(false)
      setCustomPrompt('')
    }
    pm.setShowDeleteConfirm(false)
  }, [pm.selectedPreset, pm.selectedPresetId, pm.refreshPresets])

  // Save-as-preset handler
  const handleSavePreset = useCallback(() => {
    if (!pm.saveName.trim()) return
    if (!activePrompt) return
    pm.stopAutosaveInterval()
    pm.setIsEditing(false)
    const saved = savePreset(pm.saveName.trim(), activePrompt, params)
    pm.refreshPresets()
    pm.setSelectedPresetId(saved.id)
    pm.setUseCustom(false)
    pm.setSaveName('')
    pm.setShowSaveDialog(false)
  }, [pm.saveName, activePrompt, params, pm.refreshPresets, pm.stopAutosaveInterval])

  return (
    <div data-chronicle="prompt-manager">
      {getOldFormatPresets().length > 0 && (
        <div class="chronicle-pm-warning">
          ⚠ Some custom presets use the old TITLE:/CONTENT: format and won't produce trigger keys.
          Edit or recreate them to use the new JSON output format.
        </div>
      )}
      <div class="chronicle-pm-row">
        <label class="chronicle-pm-label">Prompt Preset</label>
        <select
          class="chronicle-pm-select"
          value={pm.useCustom ? '__custom__' : pm.selectedPresetId}
          onChange={handlePresetChange}
          disabled={loading}
        >
          {pm.presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.builtIn ? '' : ' (custom)'}
            </option>
          ))}
          <option value="__custom__">Custom prompt…</option>
        </select>
      </div>

      {pm.selectedPreset && (
        <div class="chronicle-pm-preview-section">
          <div class="chronicle-pm-preview-bar">
            <span
              class="chronicle-pm-summary"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? '▼' : '▶'} View prompt
            </span>
            <div class="chronicle-pm-toolbar">
              {pm.selectedPreset && !pm.selectedPreset.builtIn && (
                <button
                  class="chronicle-pm-delete-btn"
                  onClick={pm.handleDeleteClick}
                  disabled={loading}
                  title="Delete this preset"
                >
                  Delete Preset
                </button>
              )}
              <button
                class="chronicle-pm-tool-btn"
                onClick={() => pm.setShowSaveDialog(true)}
                disabled={loading || (!pm.useCustom && !pm.selectedPreset)}
                title="Save current custom prompt as a named preset"
              >
                Save
              </button>
              <button
                class="chronicle-pm-tool-btn"
                onClick={pm.handleExport}
                disabled={pm.presets.filter((p) => !p.builtIn).length === 0}
                title="Export custom presets"
              >
                Export
              </button>
              <button
                class="chronicle-pm-tool-btn"
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
            <>
            <textarea
              class="chronicle-pm-textarea"
              value={pm.useCustom || pm.isEditing ? customPrompt : (pm.selectedPreset?.systemPrompt || '')}
              onInput={(e) => {
                const val = (e.target as HTMLTextAreaElement).value
                setCustomPrompt(val)
                ensureAutosavePreset(val)
              }}
              placeholder="Enter your custom summarization prompt…"
              rows={16}
              disabled={loading}
            />

            <div class="chronicle-pm-params">
              <div class="chronicle-pm-params-row">
                <label class="chronicle-pm-label">
                  Temperature <span class="chronicle-pm-params-val">{params.temperature.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  class="chronicle-pm-range"
                  min="0" max="2" step="0.1"
                  value={params.temperature}
                  onInput={(e) => { setParams(p => ({ ...p, temperature: parseFloat((e.target as HTMLInputElement).value) })) }}
                  disabled={loading}
                />
              </div>
              <div class="chronicle-pm-params-row">
                <label class="chronicle-pm-label">
                  Top P <span class="chronicle-pm-params-val">{params.top_p.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  class="chronicle-pm-range"
                  min="0" max="1" step="0.05"
                  value={params.top_p}
                  onInput={(e) => { setParams(p => ({ ...p, top_p: parseFloat((e.target as HTMLInputElement).value) })) }}
                  disabled={loading}
                />
              </div>
              <div class="chronicle-pm-params-row">
                <label class="chronicle-pm-label">
                  Top K <span class="chronicle-pm-params-val">{params.top_k}</span>
                </label>
                <input
                  type="range"
                  class="chronicle-pm-range"
                  min="0" max="500" step="1"
                  value={params.top_k}
                  onInput={(e) => { setParams(p => ({ ...p, top_k: parseInt((e.target as HTMLInputElement).value) || 0 })) }}
                  disabled={loading}
                />
              </div>
              <div class="chronicle-pm-params-row">
                <label class="chronicle-pm-label">Max Tokens</label>
                <input
                  type="number"
                  class="chronicle-pm-input"
                  min="1" max="100000"
                  value={params.max_tokens}
                  onInput={(e) => { setParams(p => ({ ...p, max_tokens: parseInt((e.target as HTMLInputElement).value) || 1 })) }}
                  disabled={loading}
                  style="width: 100px"
                />
              </div>
            </div>
            </>
          )}
        </div>
      )}

      {pm.importError && (
        <div class="chronicle-pm-error">{pm.importError}</div>
      )}

      {pm.showSaveDialog && (
        <div class="chronicle-pm-overlay" onClick={() => pm.setShowSaveDialog(false)}>
          <div class="chronicle-pm-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Save as Preset</h4>
            <input
              class="chronicle-pm-input"
              value={pm.saveName}
              onInput={(e) => pm.setSaveName((e.target as HTMLInputElement).value)}
              placeholder="Preset name…"
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              autoFocus
            />
            <div class="chronicle-pm-dialog-actions">
              <button class="chronicle-pm-dialog-btn" onClick={() => pm.setShowSaveDialog(false)}>Cancel</button>
              <button class="chronicle-pm-dialog-btn chronicle-pm-dialog-primary" onClick={handleSavePreset} disabled={!pm.saveName.trim()}>
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
