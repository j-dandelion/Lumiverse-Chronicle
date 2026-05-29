/**
 * Chronicle — Styles
 * All extension CSS organized by component.
 * Uses --lumiverse-* CSS variables for theming.
 */

import { tokensCSS } from './styles/tokens'
import { buttonCSS } from './styles/button'
import { promptCSS } from './styles/prompt'
import { flowCSS } from './styles/flow'
import { autohideCSS } from './styles/autohide'
import { tooltipCSS } from './styles/tooltip'
import { settingsCSS } from './styles/settings'
import { flowKeysCSS } from './styles/flow-keys'
import { connectionCSS } from './styles/connection'
import { connectionHintCSS } from './styles/connection-hint'
import { connectionBlinkCSS } from './styles/connection-blink'
import { lorebookCSS } from './styles/lorebook'
import { errorBoundaryCSS } from './styles/error-boundary'
import { toastCSS } from './styles/toast'
import { deleteConfirmationCSS } from './styles/delete-confirmation'

const ALL_CSS: string[] = [
  tokensCSS,
  buttonCSS,
  promptCSS,
  flowCSS,
  autohideCSS,
  tooltipCSS,
  settingsCSS,
  flowKeysCSS,
  connectionCSS,
  connectionHintCSS,
  connectionBlinkCSS,
  lorebookCSS,
  errorBoundaryCSS,
  toastCSS,
  deleteConfirmationCSS,
]

export function injectStyles(): () => void {
  const style = document.createElement('style')
  style.setAttribute('data-chronicle', 'styles')
  style.textContent = getChronicleCSS()
  document.head.appendChild(style)
  return () => style.remove()
}

function getChronicleCSS(): string {
  return ALL_CSS.join('')
}
