/**
 * SummarizeButton — "Chronicle" button injected into MessageSelectBar.
 * Opens a modal with SummarizeFlow via the shared openChronicleModal helper.
 */

import { useState, useEffect } from 'preact/hooks'
import type { FunctionComponent } from 'preact'
import { getOpenModal } from '../main'
import { getSelectedMessageIds } from '../select-mode'

interface Props {
  selectedCount: number
}

export const SummarizeButton: FunctionComponent<Props> = ({ selectedCount: _initialCount }) => {
  const [selectedCount, setSelectedCount] = useState(_initialCount)

  // Observe selected count via DOM mutations
  useEffect(() => {
    let pendingUpdate = false

    const checkCount = () => {
      if (pendingUpdate) return
      pendingUpdate = true
      // Double rAF debounce batches rapid mutations within ~32ms
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const ids = getSelectedMessageIds()
          setSelectedCount(ids.length)
          pendingUpdate = false
        })
      })
    }

    checkCount()

    const observer = new MutationObserver(() => checkCount())

    const chatContainer = document.querySelector('[data-select-mode]')
      ?? document.querySelector('[class*="chatColumnInner"]')
    if (chatContainer) {
      observer.observe(chatContainer, {
        attributes: true,
        subtree: true,
        childList: true,
      })
    }

    return () => observer.disconnect()
  }, [])

  const handleClick = () => {
    if (selectedCount === 0) return
    getOpenModal()?.(selectedCount)
  }

  return (
    <button
      class="chronicle-summarize-btn"
      disabled={selectedCount === 0}
      onClick={handleClick}
      title="Summarize selected messages"
    >
      Summarize
    </button>
  )
}
