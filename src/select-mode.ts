/**
 * Chronicle — Select mode detection
 * Uses MutationObserver to detect when Lumiverse enters/exits message selection mode.
 */

/**
 * Get IDs of all currently selected messages by scanning the DOM.
 * Looks for elements with data-message-id whose className includes 'selected'.
 */
export function getSelectedMessageIds(): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  document.querySelectorAll('[data-message-id]').forEach((el) => {
    const classStr = (el as HTMLElement).className
    if (typeof classStr === 'string' && classStr.includes('selected')) {
      const mid = el.getAttribute('data-message-id')
      if (mid && !seen.has(mid)) {
        seen.add(mid)
        ids.push(mid)
      }
    }
  })
  return ids
}

export function findChatColumn(): Element | null {
  return document.querySelector('[data-select-mode]')
    ?? document.querySelector('[class*="chatColumnInner"]')
    ?? null
}

export function observeSelectMode(
  onActivate: () => void,
  onDeactivate: () => void
): () => void {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'data-select-mode') {
        const el = m.target as Element
        if (el.hasAttribute('data-select-mode')) {
          onActivate()
        } else {
          onDeactivate()
        }
      }
    }
  })

  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['data-select-mode'],
  })

  // Check if already active
  const initial = findChatColumn()
  if (initial?.hasAttribute('data-select-mode')) {
    setTimeout(onActivate, 0)
  }

  return () => observer.disconnect()
}
