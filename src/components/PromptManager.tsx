/**
 * PromptManager — Prompt preset selector with custom editor, save/export/import.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'preact/hooks'
import type { FunctionComponent } from 'preact'
import { usePersistedState } from '../hooks'
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
  const [presets, setPresets] = useState<PromptPreset[]>([])
  const [params, setParams] = useState<GenerationParams>({ ...DEFAULT_PARAMS })

  const [selectedPresetId, setSelectedPresetId] = usePersistedState<string>(
    'chronicle_selected_prompt_preset', 'default'
  )
  const [useCustom, setUseCustom] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autosaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const AUTOSAVE_NAME = 'Autosave'

  useEffect(() => {
    setPresets(getAllPresets())
  }, [])

  const refreshPresets = useCallback(() => {
    setPresets(getAllPresets())
  }, [])

  // Compute the effective active prompt and report it to parent
  const activePrompt = useMemo((): string | undefined => {
    if (useCustom && customPrompt.trim()) return customPrompt.trim()
    if (!useCustom) {
      const preset = getPreset(selectedPresetId)
      return preset?.systemPrompt
    }
    return undefined
  }, [useCustom, customPrompt, selectedPresetId])

  useEffect(() => {
    onActivePromptChange?.(activePrompt)
  }, [activePrompt, onActivePromptChange])

  // Fallback: sync params when preset changes via non-handler path (e.g. undo/redo)
  useEffect(() => {
    if (!useCustom && selectedPresetId) {
      const preset = getPreset(selectedPresetId)
      if (preset?.params) {
        setParams({ ...preset.params })
      } else {
        setParams({ ...DEFAULT_PARAMS })
      }
    }
  }, [selectedPresetId, useCustom])

  useEffect(() => {
    onParamsChange?.(params)
  }, [params, onParamsChange])

  // ── Autosave helpers ──────────────────────────────────────────────

  // Ensure the Autosave preset exists and switch to it — single render, no flicker.
  // Only switches to Autosave for built-in presets; custom presets stay on their own preset.
  // When switching to an existing Autosave, immediately loads its stored params
  // to prevent the stale-closure effect race (doAutosave firing with DEFAULT_PARAMS
  // before the params-loading effect runs).
  const ensureAutosavePreset = useCallback((promptOverride?: string) => {
    const currentPreset = presets.find(p => p.id === selectedPresetId)
    if (currentPreset && !currentPreset.builtIn) {
      if (!isEditing) setIsEditing(true)
      return
    }
    // Built-in preset: seed customPrompt if called without prompt text (e.g. param change)
    if (promptOverride === undefined && !customPrompt.trim() && currentPreset?.systemPrompt) {
      setCustomPrompt(currentPreset.systemPrompt)
    }

    // Check localStorage directly to guard against stale presets state (race condition
    // from rapid slider events creating duplicate Autosave presets)
    const localAutosave = findPresetByName(AUTOSAVE_NAME)
    if (localAutosave) {
      setSelectedPresetId(localAutosave.id)
      // Immediately load stored params so doAutosave (fired by isEditing effect) doesn't
      // overwrite with the stale closure's DEFAULT_PARAMS before this effect runs.
      if (localAutosave.params) setParams({ ...localAutosave.params })
    } else {
      const saved = savePreset(AUTOSAVE_NAME, promptOverride ?? (customPrompt || currentPreset?.systemPrompt || ''), params)
      refreshPresets()
      setSelectedPresetId(saved.id)
    }
    if (!isEditing) setIsEditing(true)
  }, [presets, selectedPresetId, customPrompt, params, refreshPresets, isEditing])

  const doAutosave = useCallback(() => {
    if (!isEditing) return

    const currentPreset = presets.find(p => p.id === selectedPresetId)
    if (currentPreset && !currentPreset.builtIn) {
      // Custom preset: save params always, prompt only if non-empty
      const update: { params: GenerationParams; systemPrompt?: string } = { params }
      if (customPrompt.trim()) update.systemPrompt = customPrompt
      updatePreset(selectedPresetId, update)
      refreshPresets()
      return
    }

    if (!customPrompt.trim()) return

    const existing = findPresetByName(AUTOSAVE_NAME)
    let saved: PromptPreset
    if (existing) {
      const updated = updatePreset(existing.id, { systemPrompt: customPrompt, params })
      if (!updated) return
      saved = updated
    } else {
      saved = savePreset(AUTOSAVE_NAME, customPrompt, params)
    }
    refreshPresets()
    setSelectedPresetId(saved.id)
    setIsEditing(false)
  }, [isEditing, customPrompt, params, refreshPresets, presets, selectedPresetId])

  // Ref to latest doAutosave so interval callbacks never go stale
  const doAutosaveRef = useRef(doAutosave)
  doAutosaveRef.current = doAutosave

  const stopAutosaveInterval = useCallback(() => {
    if (autosaveIntervalRef.current !== null) {
      clearInterval(autosaveIntervalRef.current)
      autosaveIntervalRef.current = null
    }
  }, [])

  const startAutosaveInterval = useCallback(() => {
    stopAutosaveInterval()
    autosaveIntervalRef.current = setInterval(() => doAutosaveRef.current(), 3000)
  }, [stopAutosaveInterval])

  // Final save on unmount only (modal close)
  useEffect(() => {
    return () => {
      doAutosaveRef.current()
      stopAutosaveInterval()
    }
  }, [])

  // Start/stop interval when editing state changes
  useEffect(() => {
    if (isEditing && customPrompt.trim()) {
      doAutosaveRef.current()
      startAutosaveInterval()
    } else {
      stopAutosaveInterval()
    }
  }, [isEditing, customPrompt])

  const handlePresetChange = useCallback((e: Event) => {
    const id = (e.target as HTMLSelectElement).value

    // No-op guard: skip if the already-active preset is re-selected
    // (mirrors SettingsManager's guard, prevents unnecessary effect firings)
    if (id === selectedPresetId && !useCustom) return

    if (id === '__custom__') {
      if (!useCustom) {
        const current = getPreset(selectedPresetId)
        if (current) setCustomPrompt(current.systemPrompt || '')
      }
      setUseCustom(true)
    } else {
      // Save current edits before switching away
      doAutosaveRef.current()
      stopAutosaveInterval()
      setSelectedPresetId(id)
      setUseCustom(false)
      setIsEditing(false)
      setCustomPrompt('')
      // Immediately load the preset's params to avoid the stale-closure effect race:
      // the [isEditing, customPrompt] effect fires doAutosave before the
      // [selectedPresetId, useCustom] effect loads correct params.
      const preset = getPreset(id)
      if (preset?.params) {
        setParams({ ...preset.params })
      } else {
        setParams({ ...DEFAULT_PARAMS })
      }
    }
  }, [selectedPresetId, useCustom, stopAutosaveInterval])

  const selectedPreset = presets.find((p) => p.id === selectedPresetId)

  const handleSavePreset = useCallback(() => {
    if (!saveName.trim()) return
    if (!activePrompt) return
    stopAutosaveInterval()
    setIsEditing(false)
    const saved = savePreset(saveName.trim(), activePrompt, params)
    refreshPresets()
    setSelectedPresetId(saved.id)
    setUseCustom(false)
    setSaveName('')
    setShowSaveDialog(false)
  }, [saveName, activePrompt, params, refreshPresets, stopAutosaveInterval])

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!selectedPreset) return
    deletePreset(selectedPreset.id)
    refreshPresets()
    if (selectedPresetId === selectedPreset.id) {
      setSelectedPresetId('default')
      setIsEditing(false)
      setCustomPrompt('')
    }
    setShowDeleteConfirm(false)
  }, [selectedPreset, selectedPresetId, refreshPresets])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  // Close delete confirmation if selectedPresetId changes externally
  useEffect(() => {
    if (showDeleteConfirm) setShowDeleteConfirm(false)
  }, [selectedPresetId])

  const handleExport = useCallback(() => {
    const json = exportPresets()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chronicle-presets-${new Date().toISOString().slice(0, 10)}.json`
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
      const result = importPresets(text)
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

  // ── Logging for params-switching diagnostics ──
  const prevPresetRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevPresetRef.current
    if (prev !== null && prev !== selectedPresetId) {
      const p = getPreset(selectedPresetId)
      console.log('[Chronicle-prompts] preset switch:',
        prev, '→', selectedPresetId,
        '| params from preset:', p?.params ? JSON.stringify(p.params) : 'none (will use DEFAULT)',
        '| current params state:', JSON.stringify(params))
    }
    prevPresetRef.current = selectedPresetId
  })

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
          value={useCustom ? '__custom__' : selectedPresetId}
          onChange={handlePresetChange}
          disabled={loading}
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.builtIn ? '' : ' (custom)'}
            </option>
          ))}
          <option value="__custom__">Custom prompt…</option>
        </select>
      </div>

      {selectedPreset && (
        <div class="chronicle-pm-preview-section">
          <div class="chronicle-pm-preview-bar">
            <span
              class="chronicle-pm-summary"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? '▼' : '▶'} View prompt
            </span>
            <div class="chronicle-pm-toolbar">
              {selectedPreset && !selectedPreset.builtIn && (
                <button
                  class="chronicle-pm-delete-btn"
                  onClick={handleDeleteClick}
                  disabled={loading}
                  title="Delete this preset"
                >
                  Delete Preset
                </button>
              )}
              <button
                class="chronicle-pm-tool-btn"
                onClick={() => setShowSaveDialog(true)}
                disabled={loading || (!useCustom && !selectedPreset)}
                title="Save current custom prompt as a named preset"
              >
                Save
              </button>
              <button
                class="chronicle-pm-tool-btn"
                onClick={handleExport}
                disabled={presets.filter((p) => !p.builtIn).length === 0}
                title="Export custom presets"
              >
                Export
              </button>
              <button
                class="chronicle-pm-tool-btn"
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
            <>
            <textarea
              class="chronicle-pm-textarea"
              value={useCustom || isEditing ? customPrompt : (selectedPreset?.systemPrompt || '')}
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

      {importError && (
        <div class="chronicle-pm-error">{importError}</div>
      )}

      {showSaveDialog && (
        <div class="chronicle-pm-overlay" onClick={() => setShowSaveDialog(false)}>
          <div class="chronicle-pm-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Save as Preset</h4>
            <input
              class="chronicle-pm-input"
              value={saveName}
              onInput={(e) => setSaveName((e.target as HTMLInputElement).value)}
              placeholder="Preset name…"
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              autoFocus
            />
            <div class="chronicle-pm-dialog-actions">
              <button class="chronicle-pm-dialog-btn" onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button class="chronicle-pm-dialog-btn chronicle-pm-dialog-primary" onClick={handleSavePreset} disabled={!saveName.trim()}>
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
