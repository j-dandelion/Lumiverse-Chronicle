/**
 * Chronicle — View settings presets system.
 * Mirrors the lorebook entry editor fields from WorldBookEntryEditor.
 * Built-in presets + user-customizable presets persisted in localStorage.
 */

// ── Entry Settings interface ──────────────────────────────────────────

export interface EntrySettings {
  // Injection
  position: 0 | 1 | 2 | 3 | 4  // Before Main(0), After Main(1), Before AN(2), After AN(3), At Depth(4)
  depth: number                  // used when position === 4
  role: 'system' | 'user' | 'assistant'
  order: number                  // maps to order_value

  // Activation
  selective: boolean
  constant: boolean
  disabled: boolean
  caseSensitive: boolean
  matchWholeWords: boolean
  useRegex: boolean
  useProbability: boolean
  vectorized: boolean
  probability: number
  scanDepth: number | null
  selectiveLogic: 0 | 1 | 2 | 3  // AND All(0), NOT None(1), OR Any(2), NOT All(3)

  // Timing
  priority: number
  sticky: number
  cooldown: number
  delay: number

  // Recursion
  preventRecursion: boolean
  excludeRecursion: boolean
  delayUntilRecursion: boolean

  // Group
  groupName: string
  groupWeight: number
  groupOverride: boolean

  // Metadata
  automationId: string

  // Book
  worldBookId: string | null     // null = auto (Chronicle book)
}

// ── Settings Preset ───────────────────────────────────────────────────

export interface SettingsPreset {
  id: string
  name: string
  settings: EntrySettings
  builtIn: boolean
}

// ── Defaults ──────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: EntrySettings = {
  position: 1,
  depth: 4,
  role: 'system',
  order: 100,
  selective: false,
  constant: false,
  disabled: false,
  caseSensitive: false,
  matchWholeWords: true,
  useRegex: false,
  useProbability: false,
  vectorized: false,
  probability: 100,
  scanDepth: null,
  selectiveLogic: 2,
  priority: 10,
  sticky: 0,
  cooldown: 0,
  delay: 0,
  preventRecursion: false,
  excludeRecursion: false,
  delayUntilRecursion: false,
  groupName: '',
  groupWeight: 100,
  groupOverride: false,
  automationId: '',
  worldBookId: null,
}

const STORAGE_KEY = 'chronicle_settings_presets'

const BUILT_IN_PRESETS: SettingsPreset[] = [
  {
    id: 'default',
    name: 'Default',
    settings: { ...DEFAULT_SETTINGS },
    builtIn: true,
  },
  {
    id: 'after_main',
    name: 'After Main Prompt',
    settings: { ...DEFAULT_SETTINGS, position: 1, matchWholeWords: true },
    builtIn: true,
  },
  {
    id: 'always_constant',
    name: 'Always Active',
    settings: { ...DEFAULT_SETTINGS, constant: true, matchWholeWords: true, useProbability: false, probability: 100 },
    builtIn: true,
  },
  {
    id: 'vector',
    name: 'Vector Search',
    settings: { ...DEFAULT_SETTINGS, vectorized: true, constant: false, matchWholeWords: false },
    builtIn: true,
  },
  {
    id: 'depth_insert',
    name: 'At Depth Insert',
    settings: { ...DEFAULT_SETTINGS, position: 4, depth: 6, matchWholeWords: true },
    builtIn: true,
  },
]

// ── Persistence ───────────────────────────────────────────────────────

function loadUserPresets(): SettingsPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p: unknown): p is SettingsPreset =>
        typeof p === 'object' && p !== null &&
        typeof (p as SettingsPreset).id === 'string' &&
        typeof (p as SettingsPreset).name === 'string' &&
        typeof (p as SettingsPreset).settings === 'object'
    )
  } catch {
    return []
  }
}

function saveUserPresets(presets: SettingsPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch (err) {
    console.error('[Chronicle] Failed to save settings presets:', err)
  }
}

// ── Public API ────────────────────────────────────────────────────────

export function getAllSettingsPresets(): SettingsPreset[] {
  return [...BUILT_IN_PRESETS, ...loadUserPresets()]
}

export function getSettingsPreset(id: string): SettingsPreset | undefined {
  return getAllSettingsPresets().find((p) => p.id === id)
}

export function saveSettingsPreset(name: string, settings: EntrySettings): SettingsPreset {
  const userPresets = loadUserPresets()
  const id = `settings_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const preset: SettingsPreset = { id, name, settings, builtIn: false }
  userPresets.push(preset)
  saveUserPresets(userPresets)
  return preset
}

export function deleteSettingsPreset(id: string): boolean {
  const userPresets = loadUserPresets()
  const idx = userPresets.findIndex((p) => p.id === id)
  if (idx === -1) return false
  userPresets.splice(idx, 1)
  saveUserPresets(userPresets)
  return true
}

export function updateSettingsPreset(id: string, updates: Partial<Pick<SettingsPreset, 'name' | 'settings'>>): SettingsPreset | null {
  const userPresets = loadUserPresets()
  const idx = userPresets.findIndex((p) => p.id === id)
  if (idx === -1) return null
  userPresets[idx] = { ...userPresets[idx], ...updates }
  saveUserPresets(userPresets)
  return userPresets[idx]
}

export function findSettingsPresetByName(name: string): SettingsPreset | undefined {
  return loadUserPresets().find((p) => !p.builtIn && p.name === name)
}

export function exportSettingsPresets(): string {
  return JSON.stringify(loadUserPresets(), null, 2)
}

export function importSettingsPresets(json: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return { success: false, count: 0, error: 'Expected an array of presets' }

    const valid = parsed.filter(
      (p: unknown): p is SettingsPreset =>
        typeof p === 'object' && p !== null &&
        typeof (p as SettingsPreset).id === 'string' &&
        typeof (p as SettingsPreset).name === 'string' &&
        typeof (p as SettingsPreset).settings === 'object'
    )

    if (valid.length === 0) return { success: false, count: 0, error: 'No valid settings presets found in file' }

    const existing = loadUserPresets()
    const existingIds = new Set([...BUILT_IN_PRESETS.map((p) => p.id), ...existing.map((p) => p.id)])
    const deduped = valid.filter((p) => !existingIds.has(p.id))
    const merged = [...existing, ...deduped]
    saveUserPresets(merged)
    return { success: true, count: deduped.length }
  } catch (err) {
    return { success: false, count: 0, error: err instanceof Error ? err.message : 'Invalid JSON' }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

export const POSITION_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Before Main Prompt' },
  { value: 1, label: 'After Main Prompt' },
  { value: 2, label: 'Before AN' },
  { value: 3, label: 'After AN' },
  { value: 4, label: 'At Depth' },
]

export const ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'user', label: 'User' },
  { value: 'assistant', label: 'Assistant' },
]

export const SELECTIVE_LOGIC_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'AND All Keys' },
  { value: 1, label: 'NOT None' },
  { value: 2, label: 'OR Any Key' },
  { value: 3, label: 'NOT All' },
]

/**
 * The API input shape expected by the Spindle CreateWorldBookEntry API (snake_case keys).
 * Documented here so the mapping can't silently drop fields.
 * - depth is only present when position === 4
 * - automation_id is undefined when empty
 * - worldBookId is intentionally omitted — it's a client-side routing field
 */
export interface CreateEntryInput {
  position: number
  depth?: number
  role: string
  order_value: number
  selective: boolean
  constant: boolean
  disabled: boolean
  case_sensitive: boolean
  match_whole_words: boolean
  use_regex: boolean
  use_probability: boolean
  vectorized: boolean
  probability: number
  scan_depth: number | null
  selective_logic: number
  priority: number
  sticky: number
  cooldown: number
  delay: number
  prevent_recursion: boolean
  exclude_recursion: boolean
  delay_until_recursion: boolean
  group_name: string
  group_weight: number
  group_override: boolean
  automation_id: string | undefined
}

/**
 * Converts internal EntrySettings to the create-input shape expected by the Spindle API.
 */
export function settingsToCreateInput(settings: EntrySettings): CreateEntryInput {
  return {
    position: settings.position,
    ...(settings.position === 4 ? { depth: settings.depth } : {}),
    role: settings.role,
    order_value: settings.order,
    selective: settings.selective,
    constant: settings.constant,
    disabled: settings.disabled,
    case_sensitive: settings.caseSensitive,
    match_whole_words: settings.matchWholeWords,
    use_regex: settings.useRegex,
    use_probability: settings.useProbability,
    vectorized: settings.vectorized,
    probability: settings.probability,
    scan_depth: settings.scanDepth,
    selective_logic: settings.selectiveLogic,
    priority: settings.priority,
    sticky: settings.sticky,
    cooldown: settings.cooldown,
    delay: settings.delay,
    prevent_recursion: settings.preventRecursion,
    exclude_recursion: settings.excludeRecursion,
    delay_until_recursion: settings.delayUntilRecursion,
    group_name: settings.groupName,
    group_weight: settings.groupWeight,
    group_override: settings.groupOverride,
    automation_id: settings.automationId || undefined,
    // NOTE: worldBookId intentionally omitted — it's a client-side routing
    // field for lorebook selection UI. It is NOT a valid CreateWorldBookEntry
    // API field. The backend receives the lorebook ID via the separate
    // lorebookId request field, never through entrySettings.
  }
}
