/**
 * Chronicle — Shared preset management hook
 * Encapsulates the preset CRUD, autosave, export/import, and dialog patterns
 * shared by PromptManager and SettingsManager.
 */
import { useState, useEffect, useCallback, useRef } from 'preact/hooks'

export interface PresetLike {
  id: string
  name: string
  builtIn: boolean
}

interface UsePresetManagerOptions<T extends PresetLike> {
  selectedKey: string
  loadAll: () => T[]
  save: (name: string) => T
  update: (id: string, updates: Partial<T>) => T | null
  findByName: (name: string) => T | undefined
  deletePreset: (id: string) => boolean
  exportAll: () => string
  importAll: (json: string) => { success: boolean; error?: string }
  autosaveName?: string
}

export function usePresetManager<T extends PresetLike>(opts: UsePresetManagerOptions<T>) {
  const {
    selectedKey,
    loadAll,
    save,
    findByName,
    deletePreset,
    exportAll,
    importAll,
    autosaveName = 'Autosave',
  } = opts

  const [presets, setPresets] = useState<T[]>([])

  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(selectedKey)
      if (saved) return saved
    } catch { /* ignore */ }
    return 'default'
  })

  const [useCustom, setUseCustom] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autosaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doAutosaveRef = useRef<(() => void) | null>(null)

  // Load presets on mount
  useEffect(() => {
    setPresets(loadAll())
  }, [])

  const refreshPresets = useCallback(() => {
    setPresets(loadAll())
  }, [loadAll])

  // Persist selected preset ID
  useEffect(() => {
    try { localStorage.setItem(selectedKey, selectedPresetId) } catch { /* ignore */ }
  }, [selectedKey, selectedPresetId])

  // Autosave interval management
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

  // Final save on unmount
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

  // Apply a preset by ID
  const applyPreset = useCallback((id: string) => {
    if (id === '__custom__') {
      setUseCustom(true)
      return
    }
    stopAutosaveInterval()
    setSelectedPresetId(id)
    setUseCustom(false)
    setIsEditing(false)
  }, [stopAutosaveInterval])

  // Handle preset dropdown change
  const handlePresetChange = useCallback((e: Event) => {
    const id = (e.target as HTMLSelectElement).value
    if (id === selectedPresetId && !useCustom) return
    if (id === '__custom__') {
      setUseCustom(true)
    } else {
      doAutosaveRef.current?.()
      stopAutosaveInterval()
      setSelectedPresetId(id)
      setUseCustom(false)
      setIsEditing(false)
    }
  }, [selectedPresetId, useCustom, stopAutosaveInterval])

  const selectedPreset = presets.find((p) => p.id === selectedPresetId)

  // Ensure autosave preset exists — generic version
  const ensureAutosavePreset = useCallback(() => {
    const currentPreset = presets.find(p => p.id === selectedPresetId)
    if (currentPreset && !currentPreset.builtIn) {
      if (!isEditing) setIsEditing(true)
      return
    }
    const existing = findByName(autosaveName)
    if (existing) {
      setSelectedPresetId(existing.id)
    } else {
      const saved = save(autosaveName)
      refreshPresets()
      setSelectedPresetId(saved.id)
    }
    if (!isEditing) setIsEditing(true)
  }, [presets, selectedPresetId, findByName, save, refreshPresets, isEditing, autosaveName])

  // Delete handlers
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
    }
    setShowDeleteConfirm(false)
  }, [selectedPreset, selectedPresetId, refreshPresets, deletePreset])

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  // Close delete confirmation on external preset change
  useEffect(() => {
    if (showDeleteConfirm) setShowDeleteConfirm(false)
  }, [selectedPresetId])

  // Export/import
  const handleExport = useCallback(() => {
    const json = exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chronicle-presets-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportAll])

  const handleImportFile = useCallback((e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const result = importAll(text)
      if (result.success) {
        refreshPresets()
        setImportError(null)
      } else {
        setImportError(result.error || 'Import failed')
      }
    }
    reader.readAsText(file)
    input.value = ''
  }, [importAll, refreshPresets])

  const handleTriggerImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    // State
    presets,
    selectedPresetId,
    setSelectedPresetId,
    useCustom,
    setUseCustom,
    isEditing,
    setIsEditing,
    selectedPreset,
    showSaveDialog,
    setShowSaveDialog,
    saveName,
    setSaveName,
    importError,
    setImportError,
    showDeleteConfirm,
    setShowDeleteConfirm,
    fileInputRef,

    // Refs
    doAutosaveRef,
    autosaveIntervalRef,

    // Actions
    refreshPresets,
    applyPreset,
    handlePresetChange,
    ensureAutosavePreset,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    handleExport,
    handleImportFile,
    handleTriggerImport,
    stopAutosaveInterval,
    startAutosaveInterval,
  }
}
