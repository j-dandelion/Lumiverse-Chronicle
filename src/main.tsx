/**
 * Chronicle — Frontend entry point
 * Orchestrates the extension: styles, select mode, bar injection, backend relay, modal, teardown.
 *
 * All sub-modules are extracted to their own files. Protocol types come from ./types.
 * Components access the Spindle context via ChronicleContext (Preact Context) instead of globalThis.
 */

import { render } from 'preact'
import { useEffect } from 'preact/hooks'
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'

import { ChronicleContext } from './context'
import { injectStyles } from './styles'
import { findChatColumn, observeSelectMode, getSelectedMessageIds } from './select-mode'
import { injectIntoSelectBar, setRenderTracker, unmountComponentAtNode } from './select-bar'
import { setupBackendListener } from './backend-relay'
import { createFullTeardown } from './teardown'
import { SummarizeFlow } from './components/SummarizeFlow'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SummaryToast, type ToastState } from './components/SummaryToast'
import { DEFAULT_SETTINGS, type EntrySettings } from './settings'
import type { SummarizePreview, GenerationParams } from './types'

// ── Modal opener reference (set during setup, used by SummarizeButton) ──

let _openModal: ((count: number) => void) | undefined

/** Registered by SummarizeButton to open the modal on button click */
export function getOpenModal(): ((count: number) => void) | undefined {
  return _openModal
}

// Module-level reference to the active tracked teardown function.
// Set by setup(), called by exported teardown() on Spindle shutdown.
let _activeTeardown: (() => void) | null = null

// ── Modal guard ────────────────────────────────────────────────────
let _modalOpen = false
let _modalSafetyTimer: ReturnType<typeof setTimeout> | null = null

// ── Setup ───────────────────────────────────────────────────────────

export function setup(spindleCtx: SpindleFrontendContext) {
  console.log('[Chronicle] Setup starting...')

  // Local state — no module-level mutable vars
  let _removeObserver: (() => void) | null = null
  let _removeStyles: (() => void) | null = null
  let _backendUnsub: (() => void) | null = null
  let _selectBarCleanup: { cleanup: () => void } | null = null
  const _renders: Array<{ root: Element; unmount: () => void }> = []

  // Wire the render tracker into select-bar (it's a standalone module)
  setRenderTracker(_renders)

  // ── Summary generation state (survives modal dismiss) ──
  let _generating = false
  let _generationSelectedCount = 0
  let _generationEntrySettings: EntrySettings = { ...DEFAULT_SETTINGS }
  let _generationLorebookId: string | undefined
  let _generationActivePrompt: string | undefined
  let _generationConnectionId: string | undefined
  let _generationParams: GenerationParams | undefined
  let _toastCleanup: (() => void) | null = null
  let _generatingSafetyTimer: ReturnType<typeof setTimeout> | null = null

  function startGenerating() {
    _generating = true
    // Safety timeout: if no response within 5 min, auto-clear and show error
    // Backend has 2-min LLM timeout + 5-min deadlock guard, so 5 min is safe
    _generatingSafetyTimer = setTimeout(() => {
      if (_generating) {
        _generating = false
        showSummaryToast('error', 'Summary generation timed out.')
      }
      _generatingSafetyTimer = null
    }, 300_000)
  }

  function stopGenerating() {
    _generating = false
    if (_generatingSafetyTimer) {
      clearTimeout(_generatingSafetyTimer)
      _generatingSafetyTimer = null
    }
  }

  function showSummaryToast(state: ToastState, message: string) {
    dismissSummaryToast()
    const mount = document.createElement('div')
    mount.setAttribute('data-chronicle', 'toast')
    document.body.appendChild(mount)
    const cleanup = () => {
      render(null as any, mount)
      mount.remove()
      if (_toastCleanup === cleanup) _toastCleanup = null
    }
    render(
      <SummaryToast
        state={state}
        message={message}
        onDone={state !== 'generating' ? cleanup : undefined}
      />,
      mount
    )
    _toastCleanup = cleanup
  }

  function dismissSummaryToast() {
    _toastCleanup?.()
    _toastCleanup = null
  }

  // ── Helper: get selected message IDs (delegated to select-mode) ──
  // See select-mode.ts for the implementation

  // ── Modal Shell (Escape dismiss wrapper) ────────────────────────

  function ChronicleModalShell({ count, onClose, onGenerateStart }: {
    count: number
    onClose: () => void
    onGenerateStart: (params: {
      customPrompt: string | undefined
      connectionId: string | undefined
      lorebookId: string | undefined
      entrySettings: EntrySettings
      activePrompt: string | undefined
      generationParams?: GenerationParams
    }) => void
  }) {
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    return <SummarizeFlow selectedCount={count} onRequestClose={onClose} onGenerateStart={onGenerateStart} />
  }

  function openChronicleModal(count: number) {
    if (count === 0) return
    if (!spindleCtx) return
    if (_modalOpen || _generating) return  // Guard against double-open + generating

    const maxH = Math.min(720, window.innerHeight - 200)
    const modal = spindleCtx.ui.showModal({
      title: 'Create Summary / Memory',
      width: 600,
      maxHeight: maxH,
    })

    const handleGenerateStart = (params: {
      customPrompt: string | undefined
      connectionId: string | undefined
      lorebookId: string | undefined
      entrySettings: EntrySettings
      activePrompt: string | undefined
      generationParams?: GenerationParams
    }) => {
      startGenerating()
      _generationSelectedCount = count
      _generationEntrySettings = params.entrySettings
      _generationLorebookId = params.lorebookId
      _generationActivePrompt = params.activePrompt
      _generationConnectionId = params.connectionId
      _generationParams = params.generationParams
      showSummaryToast('generating', 'Generating summary\u2026')
      modal.dismiss()
    }

    _modalOpen = true

    render(
      <ChronicleContext.Provider value={spindleCtx}>
        <ErrorBoundary name="modal">
          <ChronicleModalShell count={count} onClose={() => modal.dismiss()} onGenerateStart={handleGenerateStart} />
        </ErrorBoundary>
      </ChronicleContext.Provider>,
      modal.root
    )

    const dismissAndRelease = () => {
      render(null as any, modal.root)
      _modalOpen = false
      if (_modalSafetyTimer) { clearTimeout(_modalSafetyTimer); _modalSafetyTimer = null }
    }

    modal.onDismiss(dismissAndRelease)

    // Clear any stale safety timer from a previous modal before setting a new one
    if (_modalSafetyTimer) { clearTimeout(_modalSafetyTimer); _modalSafetyTimer = null }
    // Safety timeout: if onDismiss never fires (abnormal teardown), release after 60s
    _modalSafetyTimer = setTimeout(() => {
      _modalOpen = false
      _modalSafetyTimer = null
    }, 60_000)
  }

  // Expose for SummarizeButton (module-level ref, not globalThis)
  _openModal = openChronicleModal

  function openPreviewModal(previewData: SummarizePreview, count: number) {
    if (!spindleCtx) return
    if (_modalOpen) return

    const maxH = Math.min(720, window.innerHeight - 200)
    const modal = spindleCtx.ui.showModal({
      title: `Lorebook Entry Preview (${count} ${count === 1 ? 'message' : 'messages'})`,
      width: 600,
      maxHeight: maxH,
    })

    const handleGenerateStart = (params: {
      customPrompt: string | undefined
      connectionId: string | undefined
      lorebookId: string | undefined
      entrySettings: EntrySettings
      activePrompt: string | undefined
      generationParams?: GenerationParams
    }) => {
      startGenerating()
      _generationSelectedCount = count
      _generationEntrySettings = params.entrySettings
      _generationLorebookId = params.lorebookId
      _generationActivePrompt = params.activePrompt
      _generationConnectionId = params.connectionId
      _generationParams = params.generationParams
      showSummaryToast('generating', 'Generating summary\u2026')
      modal.dismiss()
    }

    _modalOpen = true

    // Clear any stale safety timer from a previous modal before setting a new one
    if (_modalSafetyTimer) { clearTimeout(_modalSafetyTimer); _modalSafetyTimer = null }

    render(
      <ChronicleContext.Provider value={spindleCtx}>
        <ErrorBoundary name="preview-modal">
          <SummarizeFlow
            selectedCount={count}
            preview={previewData}
            entrySettings={_generationEntrySettings}
            lorebookId={_generationLorebookId}
            initialActivePrompt={_generationActivePrompt}
            initialConnectionId={_generationConnectionId}
            initialGenerationParams={_generationParams}
            onRequestClose={() => modal.dismiss()}
            onGenerateStart={handleGenerateStart}
          />
        </ErrorBoundary>
      </ChronicleContext.Provider>,
      modal.root
    )

    const dismissAndRelease = () => {
      render(null as any, modal.root)
      _modalOpen = false
      if (_modalSafetyTimer) { clearTimeout(_modalSafetyTimer); _modalSafetyTimer = null }
    }

    modal.onDismiss(dismissAndRelease)
    _modalSafetyTimer = setTimeout(() => {
      _modalOpen = false
      _modalSafetyTimer = null
    }, 60_000)
  }

  // ── Select mode handlers ─────────────────────────────────────────

  function onSelectModeActivate() {
    console.log('[Chronicle] Select mode activated')
    // Skip re-inject if our components are already mounted — this avoids
    // a race where setMessageSelectMode(true) fires the data-select-mode
    // observer, which would otherwise unmount + remount Chronicle components.
    const existingSummary = document.querySelector('[data-chronicle="summarize-btn"]')
    if (existingSummary) {
      return
    }
    _selectBarCleanup?.cleanup()
    _selectBarCleanup = injectIntoSelectBar()
  }

  function onSelectModeDeactivate() {
    console.log('[Chronicle] Select mode deactivated')
    _selectBarCleanup?.cleanup()
    _selectBarCleanup = null
  }

  // ── Wire everything ──────────────────────────────────────────────

  _removeStyles = injectStyles()
  _backendUnsub = setupBackendListener(spindleCtx)

  // ── Module-level listener: summarize_preview / summarize_failed ──
  // Runs regardless of modal state — catches results when modal was
  // dismissed during generation. The in-modal SummarizeFlow listener
  // (via chronicle:backend-message CustomEvent) handles in-modal events.
  spindleCtx.onBackendMessage((payload: unknown) => {
    const msg = payload as Record<string, unknown> | null
    if (!msg || typeof msg.type !== 'string') return

    if (msg.type === 'summarize_preview' && _generating) {
      const data = msg as unknown as SummarizePreview
      stopGenerating()
      dismissSummaryToast()
      openPreviewModal(data, _generationSelectedCount)
      return
    }

    if (msg.type === 'summarize_saved') {
      dismissSummaryToast()
      showSummaryToast('success', 'Summary saved to lorebook')
      return
    }

    if (msg.type === 'summarize_failed' && _generating) {
      stopGenerating()
      const errorMsg = (msg.error as string) || 'Unknown error occurred.'
      showSummaryToast('error', `Summary failed: ${errorMsg}`)
      return
    }
  })
  _removeObserver = observeSelectMode(onSelectModeActivate, onSelectModeDeactivate)

  // Teardown
  const teardownState = {
    _removeObserver: _removeObserver as (() => void) | null,
    _removeStyles: _removeStyles as (() => void) | null,
    _selectBarCleanup: _selectBarCleanup as { cleanup: () => void } | null,
    _backendUnsub: _backendUnsub as (() => void) | null,
    _renders,
    _teardownRef: { current: null as (() => void) | null },
  }
  const fullTeardown = createFullTeardown(teardownState)
  teardownState._teardownRef.current = fullTeardown
  _activeTeardown = fullTeardown

  console.log('[Chronicle] Setup complete')
}

export function teardown() {
  console.log('[Chronicle] Teardown requested')

  // Prefer the tracked cleanup path
  if (_activeTeardown) {
    _activeTeardown()
    _activeTeardown = null
    return
  }

  // Fallback: scorched-earth if tracked path wasn't set up
  document.querySelectorAll('[data-chronicle]').forEach((el) => el.remove())
}

// Re-export from components (for bundled module resolution)
export { PROTOCOL_VERSION } from './types'
export { isValidSummarizeRequestV2, isValidSaveSummaryRequest, isValidDiscardSummaryRequest, isValidListConnectionsRequest, isValidListLorebooksRequest } from './types'
export type {
  SummarizeRequestV2,
  SaveSummaryRequest,
  DiscardSummaryRequest,
  ListConnectionsRequest,
  ConnectionsListResponse,
  SummarizeProgress,
  SummarizeFailed,
  SummarizePreview,
  SummarizeSaved,
  FrontendToBackend,
  BackendToFrontend,
} from './types'

export { buildSummarizePrompt, parseSummaryResponse } from './prompts'
