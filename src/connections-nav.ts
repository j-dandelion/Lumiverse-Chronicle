/**
 * Chronicle — Connections drawer navigation
 * Opens the Lumiverse Connections drawer and highlights relevant buttons.
 * Extracted from SummarizeFlow to keep flow logic clean.
 */

function blinkButton(btn: HTMLElement): void {
  btn.classList.remove('chronicle-conn-highlight')
  void btn.offsetWidth
  btn.classList.add('chronicle-conn-highlight')
}

function watchForDuplicateMenuItem(startTime: number): void {
  const observer = new MutationObserver((mutations) => {
    const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0)
    if (!hasAddedNodes && Date.now() - startTime < 30_000) return
    if (Date.now() - startTime > 30_000) {
      observer.disconnect()
      return
    }
    const items = document.querySelectorAll<HTMLElement>(
      '[class*="contextMenu"] button, [class*="ContextMenu"] button'
    )
    for (const btn of items) {
      if (btn.textContent?.includes('Duplicate')) {
        blinkButton(btn)
        observer.disconnect()
        break
      }
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
  setTimeout(() => observer.disconnect(), 35_000)
}

/**
 * Close the Chronicle modal, open the Connections drawer, blink relevant buttons.
 */
export function openConnectionsDrawer(onModalClose?: () => void): void {
  onModalClose?.()

  requestAnimationFrame(() => {
    const connectBtn = document.querySelector<HTMLElement>('button[title="Connections"]')
    if (connectBtn) connectBtn.click()

    setTimeout(() => {
      const allButtons = document.querySelectorAll('button')
      for (const btn of allButtons) {
        if (btn.textContent?.includes('New Connection')) {
          blinkButton(btn as HTMLElement)
          break
        }
      }
    }, 300)

    setTimeout(() => {
      const moreBtns = document.querySelectorAll<HTMLElement>('button[title="More actions"]')
      if (moreBtns.length > 0) {
        blinkButton(moreBtns[0])
        watchForDuplicateMenuItem(Date.now())
      }
    }, 800)
  })
}
