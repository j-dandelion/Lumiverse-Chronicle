/**
 * Chronicle — SelectBar injection
 * Finds Lumiverse's MessageSelectBar and injects SummarizeButton.
 */

import { render } from 'preact'
import { SummarizeButton } from './components/SummarizeButton'
import { ErrorBoundary } from './components/ErrorBoundary'

/** Tracked renders — managed by main.tsx */
type RenderTracker = { root: Element; unmount: () => void }

let _trackedRenders: RenderTracker[] = []

export function setRenderTracker(renders: RenderTracker[]) {
  _trackedRenders = renders
}

function trackRender(root: Element, unmount: () => void) {
  _trackedRenders.push({ root, unmount })
}

function untrackRender(root: Element) {
  const idx = _trackedRenders.findIndex((r) => r.root === root)
  if (idx !== -1) _trackedRenders.splice(idx, 1)
}

export function unmountComponentAtNode(node: Element) {
  render(null as any, node)
}

function findSelectBar(): HTMLElement | null {
  // Strategy 1: find the "N of M selected" text, then walk up to the bar
  const countEls = document.querySelectorAll('[class*="count"]')
  for (const el of countEls) {
    if (el.textContent?.includes('selected')) {
      const left = el.parentElement
      const bar = left?.parentElement
      if (bar) return bar as HTMLElement
    }
  }

  // Strategy 2: find "Cancel" button and walk up: button → .actions → .bar
  const buttons = document.querySelectorAll('button')
  for (const btn of buttons) {
    if (btn.textContent?.trim() === 'Cancel') {
      const actions = btn.parentElement
      const bar = actions?.parentElement
      if (bar && bar.querySelector('[class*="actions"]')) {
        return bar as HTMLElement
      }
    }
  }

  // Strategy 3: find bar by CSS module class pattern (MessageSelectBar)
  const bars = document.querySelectorAll('[class*="MessageSelectBar"][class*="bar"]')
  for (const bar of bars) {
    if (bar.querySelector('[class*="actions"]') && bar.querySelector('[class*="count"]')) {
      return bar as HTMLElement
    }
  }

  // Strategy 4: find bar by structural pattern
  const allActions = document.querySelectorAll('[class*="actions"]')
  for (const actions of allActions) {
    if (actions.querySelector('[class*="count"]')) continue
    const bar = actions.parentElement
    if (bar && bar.querySelector('[class*="count"]')) {
      if (bar.querySelector('button')) {
        return bar as HTMLElement
      }
    }
  }

  return null
}

export function injectIntoSelectBar(): { cleanup: () => void } | null {
  const bar = findSelectBar()

  console.log('[Chronicle] Looking for MessageSelectBar:', bar?.tagName, (bar as HTMLElement)?.className)

  if (!bar) {
    console.warn('[Chronicle] MessageSelectBar not found')
    return null
  }

  const actions = bar.querySelector('[class*="actions"]') as HTMLElement | null

  console.log('[Chronicle] Looking for .actions inside bar:', actions?.className)

  if (!actions) {
    const childClasses = Array.from(bar.children).map(c => (c as HTMLElement).className)
    console.warn('[Chronicle] .actions not found in bar. Children:', childClasses)
    return null
  }

  const cancelBtn = Array.from(actions.querySelectorAll('button')).find(
    b => b.textContent?.trim() === 'Cancel' && !b.closest('[data-chronicle]')
  )

  // Summarize button mount
  let summaryCleanup: (() => void) | null = null
  if (!actions.querySelector('[data-chronicle="summarize-btn"]')) {
    const summaryMount = document.createElement('span')
    summaryMount.setAttribute('data-chronicle', 'summarize-btn')
    summaryMount.style.display = 'contents'
    if (cancelBtn) {
      actions.insertBefore(summaryMount, cancelBtn)
    } else {
      actions.appendChild(summaryMount)
    }

    render(
      <ErrorBoundary name="button">
        <SummarizeButton selectedCount={0} />
      </ErrorBoundary>,
      summaryMount
    )
    trackRender(summaryMount, () => unmountComponentAtNode(summaryMount))
    summaryCleanup = () => {
      unmountComponentAtNode(summaryMount)
      summaryMount.remove()
      untrackRender(summaryMount)
    }
  }

  return {
    cleanup: () => {
      summaryCleanup?.()
    },
  }
}
