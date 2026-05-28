/**
 * SummarizeFlow — The summarization interface for ChroniclePanel.
 * Shows selected count, prompt customization, settings presets, and post-summary preview with save/discard/retry.
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import type { FunctionComponent } from 'preact'
import { useChronicleCtx } from '../context'
import { PromptManager } from './PromptManager'
import { SettingsManager } from './SettingsManager'
import { ConnectionManager } from './ConnectionManager'
import { LorebookManager } from './LorebookManager'
import { DEFAULT_SETTINGS, settingsToCreateInput, type EntrySettings } from '../settings'
import { getSelectedMessageIds } from '../select-mode'
import { PROTOCOL_VERSION } from '../types'
import type { GenerationParams } from '../types'
import { DEFAULT_PARAMS } from '../presets'

type FlowState = 'idle' | 'summarizing' | 'preview' | 'saving' | 'error' | 'save_timeout'

interface PreviewData {
  requestId: string
  title: string
  content: string
  messageCount: number
  keys?: string[]
}

interface Props {
  selectedCount: number
  onRequestClose?: () => void
  /** Pre-loaded preview data — when provided, component opens in preview mode */
  preview?: PreviewData | null
  /** Initial entry settings (used when reopening with preview) */
  entrySettings?: EntrySettings
  /** Initial lorebook ID (used when reopening with preview) */
  lorebookId?: string
  /** Initial active prompt (used when reopening with preview, for retry) */
  initialActivePrompt?: string
  /** Initial connection ID (used when reopening with preview, for retry) */
  initialConnectionId?: string
  /** Initial generation params (used when reopening with preview, for retry) */
  initialGenerationParams?: GenerationParams
  /** Called when generation begins — parent dismisses modal and shows toast */
  onGenerateStart?: (params: {
    customPrompt: string | undefined
    connectionId: string | undefined
    lorebookId: string | undefined
    entrySettings: EntrySettings
    activePrompt: string | undefined
    generationParams?: GenerationParams
  }) => void
}

const TITLE_FORMAT_PRESETS = [
  { label: '{title}', value: '{title}' },
  { label: '{number} - {title}', value: '{number} - {title}' },
  { label: '{date} - {title}', value: '{date} - {title}' },
  { label: '{date} {time} - {title}', value: '{date} {time} - {title}' },
  { label: 'Chronicle: {title}', value: 'Chronicle: {title}' },
  { label: 'Chronicle: {title} ({date})', value: 'Chronicle: {title} ({date})' },
  { label: 'Custom…', value: '__custom__' },
]

export const SummarizeFlow: FunctionComponent<Props> = (props) => {
  const {
    selectedCount,
    onRequestClose,
    preview: previewProp,
    entrySettings: entrySettingsProp,
    lorebookId: lorebookIdProp,
    initialActivePrompt,
    initialConnectionId,
    initialGenerationParams,
    onGenerateStart,
  } = props

  // When preview prop is provided, start in preview mode directly
  const [flowState, setFlowState] = useState<FlowState>(
    previewProp ? 'preview' : 'idle'
  )
  const [previewData, setPreviewData] = useState<PreviewData | null>(
    previewProp ?? null
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorStage, setErrorStage] = useState<string | undefined>(undefined)
  const [errorRetryable, setErrorRetryable] = useState<boolean>(true)
  const [activePrompt, setActivePrompt] = useState<string | undefined>(
    initialActivePrompt ?? undefined
  )
  const [summaryTitle, setSummaryTitle] = useState(previewProp?.title ?? '')
  const [summaryKeys, setSummaryKeys] = useState<string[]>(previewProp?.keys ?? [])
  const [summaryContent, setSummaryContent] = useState(previewProp?.content ?? '')
  const [entrySettings, setEntrySettings] = useState<EntrySettings>(
    entrySettingsProp ?? { ...DEFAULT_SETTINGS }
  )
  const [connectionId, setConnectionId] = useState<string | undefined>(
    initialConnectionId ?? undefined
  )
  const [lorebookId, setLorebookId] = useState<string | undefined>(
    lorebookIdProp ?? undefined
  )
  // Auto-hide settings (persisted to localStorage)
  const [autoHidePrior, setAutoHidePrior] = useState<boolean>(() => {
    try { return localStorage.getItem('chronicle:autoHidePrior') === 'true' } catch { return true }
  })
  const [keepVisibleCount, setKeepVisibleCount] = useState<number>(() => {
    try {
      const v = localStorage.getItem('chronicle:keepVisibleCount')
      return v ? Math.max(0, parseInt(v, 10) || 0) : 10
    } catch { return 10 }
  })
  // Recent context settings (persisted)
  const [includeRecentContext, setIncludeRecentContext] = useState<boolean>(() => {
    try { return localStorage.getItem('chronicle:includeRecentContext') === 'true' } catch { return false }
  })
  const [recentContextCount, setRecentContextCount] = useState<number>(() => {
    try {
      const v = localStorage.getItem('chronicle:recentContextCount')
      return v ? Math.max(1, Math.min(10, parseInt(v, 10) || 3)) : 3
    } catch { return 3 }
  })
  const [generationParams, setGenerationParams] = useState<GenerationParams>(
    initialGenerationParams ? { ...initialGenerationParams } : { ...DEFAULT_PARAMS }
  )
  // Title format template (persisted)
  const DEFAULT_TITLE_FORMAT = '{number} - {title}'
  const [titleFormat, setTitleFormat] = useState(() => {
    try { return localStorage.getItem('chronicle:titleFormat') || DEFAULT_TITLE_FORMAT } catch { return DEFAULT_TITLE_FORMAT }
  })
  // Whether the user is in custom format mode (persisted boolean — NOT derived from value matching)
  const [useCustomFormat, setUseCustomFormat] = useState(() => {
    try { return localStorage.getItem('chronicle:useCustomTitleFormat') === 'true' } catch { return false }
  })
  const selectedFormatValue = useCustomFormat ? '__custom__' : titleFormat
  const previewDataRef = useRef<PreviewData | null>(previewProp ?? null)
  const flowStateRef = useRef<FlowState>(previewProp ? 'preview' : 'idle')

  // Keep preview in ref for cleanup callback
  previewDataRef.current = previewData
  flowStateRef.current = flowState

  const ctx = useChronicleCtx()

  const sendToBackend = useCallback((payload: unknown): void => {
    if (!ctx) return
    try {
      ctx.sendToBackend(payload)
    } catch {
      // ctx.sendToBackend can throw if Spindle context is in a bad state
    }
  }, [ctx])

  // Auto-set title and keys when preview prop changes
  useEffect(() => {
    if (previewProp) {
      setSummaryTitle(previewProp.title)
      setSummaryKeys(previewProp.keys ?? [])
    }
  }, [previewProp])

  // Persist auto-hide settings to localStorage
  useEffect(() => {
    try { localStorage.setItem('chronicle:autoHidePrior', String(autoHidePrior)) } catch {}
  }, [autoHidePrior])

  useEffect(() => {
    try { localStorage.setItem('chronicle:keepVisibleCount', String(keepVisibleCount)) } catch {}
  }, [keepVisibleCount])

  // Persist custom title format mode
  useEffect(() => {
    try { localStorage.setItem('chronicle:useCustomTitleFormat', String(useCustomFormat)) } catch {}
  }, [useCustomFormat])

  // Cleanup on unmount: discard any active preview (unless saving)
  useEffect(() => {
    return () => {
      if (flowStateRef.current === 'saving') return
      const activePreview = previewDataRef.current
      if (activePreview) {
        try {
          ctx?.sendToBackend({ type: 'discard_summary', requestId: activePreview.requestId })
        } catch {
          // Best-effort — ctx may be null during teardown
        }
      }
    }
  }, [ctx])

  // Stable ref for onRequestClose to avoid stale closure in the []-dep useEffect
  const onRequestCloseRef = useRef(onRequestClose)
  useEffect(() => { onRequestCloseRef.current = onRequestClose }, [onRequestClose])

  // Listen for backend responses (in-modal events only)
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail as Record<string, unknown> | null
      if (!msg) return

      switch (msg.type) {
        case 'summarize_preview': {
          const data = msg as unknown as PreviewData & { type: string }
          setPreviewData(data)
          setFlowState('preview')
          setSummaryTitle(data.title)
          setSummaryKeys(data.keys ?? [])
          setSummaryContent(data.content ?? '')
          setErrorMessage(null)
          break
        }
        case 'summarize_saved': {
          // Dismiss modal — success toast is shown by main.tsx module-level listener
          onRequestCloseRef.current?.()
          break
        }
        case 'summarize_failed': {
          setFlowState('error')
          setErrorMessage(msg.error as string)
          setErrorStage(msg.stage as string)
          setErrorRetryable((msg as any).retryable ?? true)
          break
        }
        case 'summarize_progress': {
          if ((msg.stage as string) === 'saving') {
            setFlowState('saving')
          }
          break
        }
      }
    }

    window.addEventListener('chronicle:backend-message', handler)
    return () => window.removeEventListener('chronicle:backend-message', handler)
  }, [])

  // Reset to idle when selection clears (but not during active preview)
  useEffect(() => {
    if (selectedCount === 0 && flowState !== 'saving' && flowState !== 'preview') {
      resetFlow()
    }
  }, [selectedCount])

  // Safety timeout: if saving takes >15s, show a fallback instead of hanging forever
  useEffect(() => {
    if (flowState !== 'saving') return
    const timer = setTimeout(() => {
      setFlowState('save_timeout')
    }, 15_000)
    return () => clearTimeout(timer)
  }, [flowState])

  const resetFlow = useCallback(() => {
    setFlowState('idle')
    setPreviewData(null)
    setErrorMessage(null)
    setErrorStage(undefined)
    setErrorRetryable(true)
    setSummaryTitle('')
    setSummaryContent('')
  }, [])

  const discardPending = useCallback((requestId: string) => {
    sendToBackend({ type: 'discard_summary', requestId })
  }, [sendToBackend])

  const handleCreateSummary = useCallback((customPrompt?: string) => {
    // If there's a previous preview, discard it first — clear state and ref
    // synchronously so the unmount cleanup (which fires on modal dismiss below)
    // doesn't send a duplicate discard_summary for the same requestId.
    if (previewData) {
      discardPending(previewData.requestId)
      setPreviewData(null)
      previewDataRef.current = null
    }

    // Get selected message IDs from DOM
    const ids = getSelectedMessageIds()

    if (ids.length === 0) {
      setFlowState('error')
      setErrorMessage('No messages currently selected.')
      return
    }

    sendToBackend({
        type: 'summarize_v2',
        protocolVersion: PROTOCOL_VERSION,
        messageIds: ids,
        customPrompt: customPrompt,
        previewOnly: true,
        connectionId: connectionId,
        worldBookId: lorebookId,
        autoHidePrior: autoHidePrior,
        keepVisibleCount: autoHidePrior ? keepVisibleCount : 0,
        params: generationParams,
        includeRecentContext: includeRecentContext,
        recentContextCount: recentContextCount,
      })

    // Notify parent — it will dismiss the modal and show the generating toast
    onGenerateStart?.({
      customPrompt,
      connectionId,
      lorebookId,
      entrySettings,
      activePrompt: customPrompt ?? activePrompt,
      generationParams,
    })
  }, [sendToBackend, previewData, discardPending, connectionId, lorebookId, onGenerateStart, entrySettings, activePrompt, autoHidePrior, keepVisibleCount, includeRecentContext, recentContextCount, generationParams])

  const handleRetry = useCallback(() => {
    if (previewData) {
      discardPending(previewData.requestId)
    }
    setPreviewData(null)
    setErrorMessage(null)
    handleCreateSummary(activePrompt)
  }, [previewData, discardPending, handleCreateSummary, activePrompt])

  const handleSave = useCallback(() => {
    if (!previewData) return

    // Show saving state immediately — don't wait for backend progress event
    setFlowState('saving')

    // Convert settings to Spindle-compatible input shape for the backend
    const settingsInput = settingsToCreateInput(entrySettings)

    sendToBackend({
      type: 'save_summary',
      requestId: previewData.requestId,
      title: summaryTitle !== previewData.title ? summaryTitle : undefined,
      titleFormat: titleFormat,
      keys: summaryKeys,
      content: summaryContent !== previewData.content ? summaryContent : undefined,
      settings: settingsInput,
      lorebookId: lorebookId,
    })
  }, [previewData, sendToBackend, summaryTitle, summaryKeys, summaryContent, entrySettings, lorebookId, titleFormat])

  const handleDiscard = useCallback(() => {
    if (!previewData) return
    discardPending(previewData.requestId)
    resetFlow()
  }, [previewData, discardPending, resetFlow])

  const handleErrorRetry = useCallback(() => {
    if (errorStage === 'saving' && previewData) {
      // Only retry saves that the server has flagged as retryable
      if (errorRetryable) {
        handleSave()
      }
      // If not retryable: do nothing — user must dismiss the error
    } else {
      // Generation errors always allow retry
      handleCreateSummary(activePrompt)
    }
  }, [errorStage, previewData, errorRetryable, handleSave, handleCreateSummary, activePrompt])

  // ── Duplicate blink: watches for context menu after More actions click ──
  const activeObserversRef = useRef<Set<MutationObserver>>(new Set())
  const moreActionsBlinkedRef = useRef(0)

  const watchForDuplicate = useCallback(() => {
    const observer = new MutationObserver((mutations) => {
      // Quick filter: only scan if mutations added any elements
      const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0)
      if (!hasAddedNodes && Date.now() - moreActionsBlinkedRef.current < 30_000) return
      if (Date.now() - moreActionsBlinkedRef.current > 30_000) {
        observer.disconnect()
        activeObserversRef.current.delete(observer)
        return
      }
      const items = document.querySelectorAll<HTMLElement>(
        '[class*="contextMenu"] button, [class*="ContextMenu"] button'
      )
      for (const btn of items) {
        if (btn.textContent?.includes('Duplicate')) {
          btn.classList.remove('chronicle-conn-highlight')
          void btn.offsetWidth
          btn.classList.add('chronicle-conn-highlight')
          observer.disconnect()
          activeObserversRef.current.delete(observer)
          break
        }
      }
    })

    activeObserversRef.current.add(observer)
    observer.observe(document.body, { childList: true, subtree: true })

    // Safety cleanup after 35s
    setTimeout(() => {
      observer.disconnect()
      activeObserversRef.current.delete(observer)
    }, 35_000)
  }, [])

  // Cleanup all observers on unmount
  useEffect(() => {
    return () => {
      for (const obs of activeObserversRef.current) {
        obs.disconnect()
      }
      activeObserversRef.current.clear()
    }
  }, [])

  // ── handleOpenConnectionsDrawer: close modal, open drawer, blink btn ──

  const handleOpenConnectionsDrawer = useCallback(() => {
    // 1. Close the modal
    onRequestClose?.()

    // 2. Open the Connections drawer by clicking the sidebar tab button
    requestAnimationFrame(() => {
      const connectBtn = document.querySelector<HTMLElement>(
        'button[title="Connections"]'
      )
      if (connectBtn) {
        connectBtn.click()
      }

      // 3. After drawer renders, blink the "New Connection" button
      setTimeout(() => {
        const allButtons = document.querySelectorAll('button')
        for (const btn of allButtons) {
          if (btn.textContent?.includes('New Connection')) {
            btn.classList.remove('chronicle-conn-highlight')
            void (btn as HTMLElement).offsetWidth
            btn.classList.add('chronicle-conn-highlight')
            break
          }
        }
      }, 300)

      // Blink the first More actions button and watch for Duplicate menu
      setTimeout(() => {
        const moreBtns = document.querySelectorAll<HTMLElement>('button[title="More actions"]')
        if (moreBtns.length > 0) {
          const moreBtn = moreBtns[0]
          moreBtn.classList.remove('chronicle-conn-highlight')
          void moreBtn.offsetWidth
          moreBtn.classList.add('chronicle-conn-highlight')
          // Start watching for the Duplicate context menu item
          moreActionsBlinkedRef.current = Date.now()
          watchForDuplicate()
        }
      }, 800)
    })
  }, [onRequestClose, watchForDuplicate])

  if (selectedCount === 0 && flowState === 'idle') {
    return <div class="chronicle-sf-hint">Select messages in a chat to summarize them.</div>
  }

  return (
    <div data-chronicle="summarize-flow">
      {flowState === 'idle' && (
        <>
          <div class="chronicle-sf-generate-row">
            <button
              class="chronicle-summarize-action-btn"
              onClick={() => handleCreateSummary(activePrompt)}
              disabled={!activePrompt}
            >
              Generate and Preview
            </button>
          </div>
          <div class="chronicle-sf-count">
            {selectedCount} message{selectedCount !== 1 ? 's' : ''} selected
          </div>
          {/* Auto-hide controls */}
          <div class="chronicle-sf-autohide">
            <div class="chronicle-sf-autohide-toggle-row">
              <label class="chronicle-sf-autohide-toggle">
                <input
                  type="checkbox"
                  checked={autoHidePrior}
                  onChange={(e) => setAutoHidePrior((e.target as HTMLInputElement).checked)}
                />
                <span>Auto-hide prior messages</span>
              </label>
              <span class="chronicle-info-icon" data-tooltip="After summary is finalized, automatically hide summarized messages and all previous messages from context. (Applies to database, no need to scroll up and load messages)">i</span>
            </div>
            <div class="chronicle-sf-autohide-count">
              <input
                class="chronicle-sf-autohide-input"
                type="number"
                min="0"
                step="1"
                value={keepVisibleCount}
                disabled={!autoHidePrior}
                onInput={(e) => {
                  const raw = (e.target as HTMLInputElement).value
                  if (raw === '') {
                    setKeepVisibleCount(0)
                  } else {
                    const v = parseInt(raw, 10)
                    if (!isNaN(v) && v >= 0) setKeepVisibleCount(v)
                  }
                }}
              />
              <label class="chronicle-pm-label" style={{ opacity: autoHidePrior ? 1 : 0.5 }}>
                Number of prior messages to keep visible
              </label>
              <span class="chronicle-info-icon" data-tooltip="Protects a number of recent messages from the auto-hide function. This helps keep LLM responses coherent and consistent after summarization. (Recommended: 5-10 messages)">i</span>
            </div>
          </div>
          {/* Recent context controls */}
          <div class="chronicle-sf-autohide">
            <div class="chronicle-sf-autohide-toggle-row">
              <label class="chronicle-sf-autohide-toggle">
                <input
                  type="checkbox"
                  checked={includeRecentContext}
                  disabled={!lorebookId || lorebookId === '__auto_generate__'}
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked
                    setIncludeRecentContext(checked)
                    try { localStorage.setItem('chronicle:includeRecentContext', String(checked)) } catch {}
                  }}
                />
                <span style={{ opacity: (!lorebookId || lorebookId === '__auto_generate__') ? 0.5 : 1 }}>
                  Include recent summaries as context
                </span>
              </label>
              <span class="chronicle-info-icon" data-tooltip="Fetches the most recent lorebook entries and includes their summaries as context for the LLM. This helps the LLM write a coherent next scene and use the correct scene number. Requires a lorebook to be selected.">i</span>
            </div>
            <div class="chronicle-sf-autohide-count">
              <input
                class="chronicle-sf-autohide-input"
                type="number"
                min="1"
                max="10"
                step="1"
                value={recentContextCount}
                disabled={!includeRecentContext || !lorebookId || lorebookId === '__auto_generate__'}
                onInput={(e) => {
                  const raw = (e.target as HTMLInputElement).value
                  if (raw === '') {
                    setRecentContextCount(3)
                  } else {
                    const v = parseInt(raw, 10)
                    if (!isNaN(v) && v >= 1) {
                      // Clamp to range — don't silently reject
                      const clamped = Math.max(1, Math.min(10, v))
                      setRecentContextCount(clamped)
                      try { localStorage.setItem('chronicle:recentContextCount', String(clamped)) } catch {}
                    }
                  }
                }}
              />
              <label class="chronicle-pm-label" style={{ opacity: (includeRecentContext && lorebookId && lorebookId !== '__auto_generate__') ? 1 : 0.5 }}>
                Number of recent entries to include
              </label>
            </div>
          </div>
          <LorebookManager
            onLorebookChange={setLorebookId}
            loading={false}
          />
          <ConnectionManager
            onConnectionChange={setConnectionId}
            loading={false}
            onOpenConnectionsDrawer={handleOpenConnectionsDrawer}
          />
          <PromptManager
            onActivePromptChange={setActivePrompt}
            onParamsChange={(p) => { if (p) setGenerationParams(p) }}
            loading={false}
          />
          <SettingsManager
            settings={entrySettings}
            onSettingsChange={setEntrySettings}
            loading={false}
          />
        </>
      )}

      {flowState === 'preview' && previewData && (
        <>
          <div class="chronicle-sf-title-row">
            <label class="chronicle-pm-label">Title</label>
            <input
              class="chronicle-pm-input"
              value={summaryTitle}
              onInput={(e) => setSummaryTitle((e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="chronicle-sf-title-row">
            <label class="chronicle-pm-label">Title Format</label>
            <div class="chronicle-sf-format-row">
              <select
                class="chronicle-pm-select"
                value={selectedFormatValue}
                onChange={(e) => {
                  const val = (e.target as HTMLSelectElement).value
                  if (val === '__custom__') {
                    setUseCustomFormat(true)
                  } else {
                    setUseCustomFormat(false)
                    setTitleFormat(val)
                    try { localStorage.setItem('chronicle:titleFormat', val) } catch {}
                  }
                }}
              >
                {TITLE_FORMAT_PRESETS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {useCustomFormat && (
                <input
                  class="chronicle-pm-input chronicle-sf-format-custom-input"
                  value={titleFormat}
                  onInput={(e) => {
                    const val = (e.target as HTMLInputElement).value
                    setTitleFormat(val)
                    try { localStorage.setItem('chronicle:titleFormat', val) } catch {}
                  }}
                  placeholder={DEFAULT_TITLE_FORMAT}
                />
              )}
              <span class="chronicle-sf-title-format-hint">Variables: {'{title}'}, {'{date}'}, {'{time}'}, {'{number}'}</span>
            </div>
          </div>

          <textarea
            class="chronicle-pm-textarea"
            style={{ minHeight: 200, maxHeight: 400, marginTop: 0 }}
            value={summaryContent}
            onInput={(e) => setSummaryContent((e.target as HTMLTextAreaElement).value)}
          />

          <div class="chronicle-sf-keys-row">
            <label class="chronicle-pm-label">Trigger Keys</label>
            <input
              class="chronicle-sf-keys-input"
              value={summaryKeys.join(', ')}
              onInput={(e) => {
                const raw = (e.target as HTMLInputElement).value
                const keys = raw.split(',').map(k => k.trim()).filter(k => k.length > 0)
                setSummaryKeys(keys)
              }}
              placeholder="key1, key2, key3"
            />
            <span class="chronicle-sf-keys-hint">(Comma-separated)</span>
          </div>

          <div class="chronicle-sf-actions">
            <button
              class="chronicle-sf-btn chronicle-sf-btn-primary"
              onClick={handleSave}
            >
              Save Entry
            </button>
            <button
              class="chronicle-sf-btn"
              onClick={handleRetry}
            >
              Retry
            </button>
            <button
              class="chronicle-sf-btn"
              onClick={handleDiscard}
            >
              Discard
            </button>
          </div>
        </>
      )}

      {flowState === 'saving' && (
        <div class="chronicle-sf-count">
          <span class="chronicle-summarize-spinner" /> Saving entry…
        </div>
      )}

      {flowState === 'save_timeout' && (
        <div class="chronicle-sf-error">
          <span>The entry was saved but the confirmation response timed out. The entry should appear in the list below after refreshing.</span>
          <button class="chronicle-sf-btn" onClick={() => resetFlow()} style={{ flex: '0 0 auto', marginLeft: 8 }}>
            Dismiss
          </button>
        </div>
      )}

      {flowState === 'error' && errorMessage && (
        <div class="chronicle-sf-error">
          <span>{errorMessage}</span>
          <button
            class="chronicle-sf-btn"
            onClick={handleErrorRetry}
            style={{ flex: '0 0 auto', marginLeft: 8 }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
