/**
 * Chronicle — Prompt presets system.
 * Built-in presets + user-customizable presets persisted in localStorage.
 */

import { SUMMARIZE_SYSTEM_PROMPT } from './prompts'
import type { GenerationParams } from './types'

export const DEFAULT_PARAMS: GenerationParams = {
  temperature: 0.3,
  top_p: 1,
  max_tokens: 4096,
  top_k: 0,
}

export interface PromptPreset {
  id: string
  name: string
  systemPrompt: string
  builtIn: boolean // true = cannot be deleted
  outputFormat?: 'json' | 'text' // json = new format, text/undefined = old TITLE:/CONTENT: format
  params?: GenerationParams
}

const STORAGE_KEY = 'chronicle_prompt_presets'

const BUILT_IN_PRESETS: PromptPreset[] = [
  {
    id: 'default',
    name: 'Default',
    systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
    builtIn: true,
    outputFormat: 'json',
  },
]

function loadUserPresets(): PromptPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p: unknown): p is PromptPreset =>
        typeof p === 'object' && p !== null &&
        typeof (p as any).id === 'string' &&
        typeof (p as any).name === 'string' &&
        typeof (p as any).systemPrompt === 'string'
    )
  } catch {
    return []
  }
}

function saveUserPresets(presets: PromptPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch (err) {
    console.error('[Chronicle] Failed to save presets:', err)
  }
}

export function getAllPresets(): PromptPreset[] {
  return [...BUILT_IN_PRESETS, ...loadUserPresets()]
}

export function getPreset(id: string): PromptPreset | undefined {
  return getAllPresets().find((p) => p.id === id)
}

/** Returns custom presets still using the old TITLE:/CONTENT: format. */
export function getOldFormatPresets(): PromptPreset[] {
  return loadUserPresets().filter(p => p.outputFormat !== 'json')
}

export function updatePreset(id: string, updates: Partial<Pick<PromptPreset, 'name' | 'systemPrompt' | 'params'>>): PromptPreset | null {
  const userPresets = loadUserPresets()
  const idx = userPresets.findIndex((p) => p.id === id)
  if (idx === -1) return null
  userPresets[idx] = { ...userPresets[idx], ...updates }
  saveUserPresets(userPresets)
  return userPresets[idx]
}

export function findPresetByName(name: string): PromptPreset | undefined {
  return loadUserPresets().find((p) => !p.builtIn && p.name === name)
}

export function savePreset(name: string, systemPrompt: string, params?: GenerationParams): PromptPreset {
  const userPresets = loadUserPresets()
  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const preset: PromptPreset = { id, name, systemPrompt, builtIn: false, outputFormat: 'json', params }
  userPresets.push(preset)
  saveUserPresets(userPresets)
  return preset
}

export function deletePreset(id: string): boolean {
  const userPresets = loadUserPresets()
  const idx = userPresets.findIndex((p) => p.id === id)
  if (idx === -1) return false
  userPresets.splice(idx, 1)
  saveUserPresets(userPresets)
  return true
}

export function exportPresets(): string {
  return JSON.stringify(loadUserPresets(), null, 2)
}

export function importPresets(json: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return { success: false, count: 0, error: 'Expected an array of presets' }

    const valid = parsed.filter(
      (p: unknown): p is PromptPreset =>
        typeof p === 'object' && p !== null &&
        typeof (p as any).id === 'string' &&
        typeof (p as any).name === 'string' &&
        typeof (p as any).systemPrompt === 'string'
    )

    if (valid.length === 0) return { success: false, count: 0, error: 'No valid presets found in file' }

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
