/**
 * Chronicle — Styles
 * All extension CSS in a single file, organized by component.
 * Uses --lumiverse-* CSS variables for theming.
 */

export function injectStyles(): () => void {
  const style = document.createElement('style')
  style.setAttribute('data-chronicle', 'styles')
  style.textContent = getChronicleCSS()
  document.head.appendChild(style)
  return () => style.remove()
}

function getChronicleCSS(): string {
  return /* css */ `
    /* ── Chronicle Design Tokens ────────────────────────── */
    :root {
      --chronicle-error-bg: rgba(239, 68, 68, 0.1);
      --chronicle-error-border: rgba(252, 165, 165, 0.25);
      --chronicle-error-text: rgb(252, 165, 165);
      --chronicle-success-text: rgb(74, 222, 128);
      --chronicle-overlay-bg: rgba(0, 0, 0, 0.5);
    }

    /* ── Summarize Button ─────────────────────────────────── */
    [data-chronicle="summarize-btn"] {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .chronicle-summarize-btn {
      background: var(--lumiverse-primary-015);
      border: 1px solid var(--lumiverse-primary-050);
      color: var(--lumiverse-primary);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast), border-color var(--lumiverse-transition-fast);
    }
    .chronicle-summarize-btn:hover:not(:disabled) {
      background: var(--lumiverse-primary-030);
    }
    .chronicle-summarize-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .chronicle-summarize-spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--lumiverse-primary-020);
      border-top-color: var(--lumiverse-primary);
      border-radius: 50%;
      animation: chronicle-spin 0.6s linear infinite;
    }
    @keyframes chronicle-spin {
      to { transform: rotate(360deg); }
    }

    /* ── Prompt Manager ─────────────────────────────── */
    [data-chronicle="prompt-manager"] {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
      border-top: 1px solid var(--lumiverse-border);
      padding-top: 8px;
    }
    .chronicle-pm-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-pm-label {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      font-weight: 500;
    }
    .chronicle-pm-select {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    .chronicle-pm-textarea {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      padding: 8px;
      border-radius: 6px;
      resize: vertical;
      min-height: 160px;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--lumiverse-font-mono);
      line-height: 1.4;
    }
    .chronicle-pm-textarea:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
    }
    .chronicle-pm-params {
      margin-top: 12px;
      padding: 10px 12px;
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chronicle-pm-params-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chronicle-pm-params-row .chronicle-pm-label {
      min-width: 110px;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      margin: 0;
    }
    .chronicle-pm-params-val {
      color: var(--lumiverse-text-dim);
      font-weight: 500;
      margin-left: 2px;
    }
    .chronicle-pm-range {
      flex: 1;
      accent-color: var(--lumiverse-primary);
    }
    .chronicle-pm-details {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
    }
    .chronicle-pm-preview-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    .chronicle-pm-preview-section {
      width: 100%;
    }
    .chronicle-pm-preview-section .chronicle-pm-pre,
    .chronicle-pm-preview-section .chronicle-pm-textarea {
      margin-top: 8px;
    }
    .chronicle-pm-preview-bar .chronicle-pm-toolbar {
      margin-left: auto;
    }
    .chronicle-pm-summary {
      cursor: pointer;
      color: var(--lumiverse-text-dim);
      user-select: none;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
    }
    .chronicle-pm-pre {
      background: var(--lumiverse-bg-deep);
      border: 1px solid var(--lumiverse-border);
      border-radius: 6px;
      padding: 8px;
      margin-top: 4px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      max-height: 150px;
      overflow-y: auto;
      font-family: var(--lumiverse-font-mono);
    }
    .chronicle-summarize-action-btn {
      background: var(--lumiverse-primary-015);
      border: 1px solid var(--lumiverse-primary-050);
      color: var(--lumiverse-primary);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: background var(--lumiverse-transition-fast);
      flex: 1;
      min-width: 140px;
    }
    .chronicle-summarize-action-btn:hover:not(:disabled) {
      background: var(--lumiverse-primary-030);
    }
    .chronicle-summarize-action-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .chronicle-pm-toolbar {
      display: flex;
      gap: 4px;
    }
    .chronicle-pm-tool-btn {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text-dim);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-pm-tool-btn:hover:not(:disabled) {
      background: var(--lumiverse-fill-hover);
      color: var(--lumiverse-text);
    }
    .chronicle-pm-tool-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .chronicle-pm-delete-btn {
      background: var(--chronicle-error-bg);
      color: var(--chronicle-error-text);
      border: 1px solid var(--chronicle-error-border);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-pm-delete-btn:hover:not(:disabled) {
      background: var(--chronicle-error-bg);
      filter: brightness(1.3);
    }
    .chronicle-pm-delete-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .chronicle-pm-error { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--chronicle-error-text); }
    .chronicle-pm-warning {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-subtle);
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      border-radius: 6px;
      padding: 6px 10px;
      margin-bottom: 8px;
    }
    .chronicle-pm-overlay {
      position: fixed; inset: 0;
      background: var(--chronicle-overlay-bg);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .chronicle-pm-dialog {
      background: var(--lumiverse-bg);
      border: 1px solid var(--lumiverse-border);
      border-radius: 12px;
      padding: 20px;
      min-width: 300px;
      max-width: 400px;
    }
    .chronicle-pm-dialog h4 { margin: 0 0 12px 0; font-size: calc(14px * var(--lumiverse-font-scale, 1)); }
    .chronicle-pm-input {
      width: 100%;
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      caret-color: var(--lumiverse-text);
      font-size: calc(13px * var(--lumiverse-font-scale, 1));
      padding: 8px 10px;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .chronicle-pm-input:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
      box-shadow: 0 0 0 2px var(--lumiverse-primary-010);
    }
    .chronicle-pm-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .chronicle-pm-dialog-btn {
      padding: 6px 14px; border-radius: 6px; cursor: pointer;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
    }
    .chronicle-pm-dialog-primary {
      background: var(--lumiverse-primary-010);
      border-color: var(--lumiverse-primary);
      color: var(--lumiverse-primary);
    }

    /* ── Summarize Flow ──────────────────────────────── */
    [data-chronicle="summarize-flow"] { display: flex; flex-direction: column; gap: 12px; }
    .chronicle-sf-count {
      background: var(--lumiverse-fill-hover);
      color: var(--lumiverse-primary);
      font-size: calc(13px * var(--lumiverse-font-scale, 1));
      padding: 10px 14px;
      border-radius: 8px;
      font-weight: 500;
      text-align: center;
    }

    /* ── Auto-hide controls ─────────────────────────────── */
    .chronicle-sf-autohide {
      padding: 10px 12px;
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: 8px;
    }

    .chronicle-sf-autohide-toggle-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chronicle-sf-autohide-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text);
    }

    .chronicle-sf-autohide-toggle input[type="checkbox"] {
      margin: 0;
      accent-color: var(--lumiverse-primary);
    }

    .chronicle-sf-autohide-count {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chronicle-sf-autohide-input {
      width: 68px;
      padding: 4px 8px;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      background: var(--lumiverse-fill);
      border: 1px solid var(--lumiverse-border);
      border-radius: 6px;
      color: var(--lumiverse-text);
      text-align: center;
      box-sizing: border-box;
    }

    .chronicle-sf-autohide-input:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
      box-shadow: 0 0 0 2px var(--lumiverse-primary-010);
    }

    .chronicle-sf-autohide-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ── Info tooltip ──────────────────────────────────── */
    .chronicle-info-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid var(--lumiverse-text-dim);
      color: var(--lumiverse-text-dim);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      font-weight: 700;
      font-style: normal;
      font-family: var(--lumiverse-font-sans, sans-serif);
      opacity: 0.4;
      flex-shrink: 0;
      position: relative;
      user-select: none;
      line-height: 1;
    }

    .chronicle-info-icon:hover {
      opacity: 0.8;
    }

    .chronicle-info-icon::after {
      content: attr(data-tooltip);
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--lumiverse-bg-deep);
      color: var(--lumiverse-text);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      font-weight: 400;
      font-family: var(--lumiverse-font-sans, sans-serif);
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--lumiverse-border);
      white-space: normal;
      width: max-content;
      max-width: 280px;
      line-height: 1.4;
      pointer-events: none;
      display: none;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      text-align: left;
    }

    .chronicle-info-icon:hover::after {
      display: block;
    }

    .chronicle-sf-generate-row {
      display: flex;
    }
    .chronicle-sf-hint {
      color: var(--lumiverse-text-dim);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      text-align: center;
      padding: 16px 0;
    }
    .chronicle-sf-title-row { display: flex; flex-direction: column; gap: 4px; }
    .chronicle-sf-title-format-hint {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      opacity: 0.6;
      margin-left: 4px;
      white-space: nowrap;
    }
    .chronicle-sf-format-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-sf-format-custom-input {
      margin-top: 4px;
    }
    .chronicle-sf-content {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      border-radius: 8px;
      padding: 12px;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 300px;
      overflow-y: auto;
    }
    .chronicle-sf-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .chronicle-sf-btn {
      padding: 8px 16px; border-radius: 8px; cursor: pointer;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
      transition: background var(--lumiverse-transition-fast);
      flex: 1; text-align: center; min-width: 80px;
    }
    .chronicle-sf-btn:hover:not(:disabled) { background: var(--lumiverse-fill-hover); }
    .chronicle-sf-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .chronicle-sf-btn-primary {
      background: var(--lumiverse-primary-010);
      border-color: var(--lumiverse-primary);
      color: var(--lumiverse-primary);
      font-weight: 500;
    }
    .chronicle-sf-btn-primary:hover:not(:disabled) { background: var(--lumiverse-fill-hover); }
    .chronicle-sf-error {
      background: var(--chronicle-error-bg);
      border: 1px solid var(--chronicle-error-border);
      color: var(--chronicle-error-text);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      padding: 8px 12px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* ── Settings Manager ──────────────────────────── */
    [data-chronicle="settings-manager"] {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
      border-top: 1px solid var(--lumiverse-border);
      padding-top: 8px;
    }
    .chronicle-sm-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-sm-label {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      font-weight: 500;
    }
    .chronicle-sm-select {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    .chronicle-sm-delete-btn {
      background: var(--chronicle-error-bg);
      color: var(--chronicle-error-text);
      border: 1px solid var(--chronicle-error-border);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-sm-delete-btn:hover:not(:disabled) {
      background: var(--chronicle-error-bg);
      filter: brightness(1.3);
    }
    .chronicle-sm-delete-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .chronicle-sm-error { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--chronicle-error-text); }
    .chronicle-sm-preview-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    .chronicle-sm-summary {
      cursor: pointer;
      color: var(--lumiverse-text-dim);
      user-select: none;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
    }
    .chronicle-sm-toolbar {
      display: flex;
      gap: 4px;
      margin-left: auto;
    }
    .chronicle-sm-tool-btn {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text-dim);
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-sm-tool-btn:hover:not(:disabled) {
      background: var(--lumiverse-fill-hover);
      color: var(--lumiverse-text);
    }
    .chronicle-sm-tool-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .chronicle-sm-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .chronicle-sm-section-heading {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--lumiverse-text-dim);
      margin-top: 4px;
    }
    .chronicle-sm-field-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chronicle-sm-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .chronicle-sm-field-small {
      max-width: 100px;
    }
    .chronicle-sm-field-label {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      font-weight: 500;
    }
    .chronicle-sm-input {
      width: 100%;
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      caret-color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .chronicle-sm-input:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
      box-shadow: 0 0 0 2px var(--lumiverse-primary-010);
    }
    .chronicle-sm-field-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .chronicle-sm-toggle-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
    }
    .chronicle-sm-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text);
      cursor: pointer;
      user-select: none;
    }
    .chronicle-sm-toggle input[type="checkbox"] {
      accent-color: var(--lumiverse-primary);
      cursor: pointer;
    }
    .chronicle-sm-group-toggle {
      background: none;
      border: none;
      color: var(--lumiverse-text-dim);
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      cursor: pointer;
      padding: 4px 0;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 4px;
      border-bottom: 1px solid var(--lumiverse-border);
      width: 100%;
      font-weight: 500;
    }
    .chronicle-sm-group-toggle:hover {
      color: var(--lumiverse-text);
    }
    .chronicle-sm-chevron {
      font-size: 8px;
      transition: transform 0.15s;
      display: inline-block;
    }
    .chronicle-sm-chevron-open {
      transform: rotate(90deg);
    }
    .chronicle-sm-inactive-note {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      padding: 6px 8px;
      background: var(--lumiverse-fill-subtle);
      border-radius: 4px;
      font-style: italic;
    }
    .chronicle-sm-overlay {
      position: fixed; inset: 0;
      background: var(--chronicle-overlay-bg);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .chronicle-sm-dialog {
      background: var(--lumiverse-bg);
      border: 1px solid var(--lumiverse-border);
      border-radius: 12px;
      padding: 20px;
      min-width: 300px;
      max-width: 400px;
    }
    .chronicle-sm-dialog h4 { margin: 0 0 12px 0; font-size: calc(14px * var(--lumiverse-font-scale, 1)); }
    .chronicle-sm-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .chronicle-sm-dialog-btn {
      padding: 6px 14px; border-radius: 6px; cursor: pointer;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
    }
    .chronicle-sm-dialog-primary {
      background: var(--lumiverse-primary-010);
      border-color: var(--lumiverse-primary);
      color: var(--lumiverse-primary);
    }

    /* ── Summarize Flow — Keys row ─────────────────── */
    .chronicle-sf-keys-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-sf-keys-input {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      width: 100%;
      box-sizing: border-box;
      font-family: inherit;
    }
    .chronicle-sf-keys-input:focus {
      outline: none;
      border-color: var(--lumiverse-primary);
    }
    .chronicle-sf-keys-hint {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      opacity: 0.6;
      padding-left: 2px;
    }

    /* ── Connection Manager ──────────────────────── */
    [data-chronicle="connection-manager"] {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
      border-top: 1px solid var(--lumiverse-border);
      padding-top: 8px;
    }
    .chronicle-conn-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-conn-label {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      font-weight: 500;
    }
    .chronicle-conn-select {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    .chronicle-conn-select:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* ── Connection Hint ──────────────────────────── */
    .chronicle-conn-hint {
      font-size: calc(10px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      line-height: 1.4;
      display: flex;
      gap: 4px;
      align-items: flex-start;
      margin-top: 4px;
    }
    .chronicle-conn-hint-icon {
      flex-shrink: 0;
      font-size: 11px;
    }
    .chronicle-conn-hint-text {
      flex: 1;
    }
    .chronicle-conn-link {
      background: none;
      border: none;
      padding: 0;
      margin: 0;
      color: var(--lumiverse-primary);
      cursor: pointer;
      font-size: inherit;
      font-family: inherit;
      text-decoration: underline;
      text-decoration-style: dotted;
      display: inline;
    }
    .chronicle-conn-link:hover {
      text-decoration-style: solid;
    }
    .chronicle-conn-hint-close {
      background: none;
      border: none;
      color: var(--lumiverse-text-dim);
      cursor: pointer;
      padding: 0 2px;
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      line-height: 1;
      flex-shrink: 0;
      margin-left: auto;
      opacity: 0.5;
    }
    .chronicle-conn-hint-close:hover {
      opacity: 1;
      color: var(--lumiverse-text);
    }

    /* ── New Connection Button Blink ──────────────── */
    @keyframes chronicle-conn-blink {
      0%, 100% {
        box-shadow: 0 0 0 0 transparent;
      }
      50% {
        box-shadow: 0 0 0 3px var(--lumiverse-primary), 0 0 10px var(--lumiverse-primary-050);
      }
    }
    .chronicle-conn-highlight {
      animation: chronicle-conn-blink 2s ease-in-out 2;
    }

    /* ── Lorebook Manager ──────────────────────────── */
    [data-chronicle="lorebook-manager"] {
      margin-top: 4px;
      border-top: 1px solid var(--lumiverse-border);
      padding-top: 8px;
    }
    .chronicle-lb-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .chronicle-lb-label {
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text-dim);
      font-weight: 500;
    }
    .chronicle-lb-select {
      background: var(--lumiverse-fill-hover);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    .chronicle-lb-select:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* ── Error boundary ─────────────────────────────────── */
    .chronicle-error-boundary {
      padding: 24px;
      text-align: center;
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: 8px;
      margin: 16px;
    }
    .chronicle-error-boundary-icon { font-size: 32px; margin-bottom: 8px; }
    .chronicle-error-boundary-title { font-size: 14px; font-weight: 600; color: var(--lumiverse-text); margin-bottom: 4px; }
    .chronicle-error-boundary-msg { font-size: 12px; color: var(--lumiverse-text-secondary); margin-bottom: 12px; word-break: break-word; }
    .chronicle-error-boundary-dismiss {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
    }

    /* ── Summary Generation Toast ─────────────────────── */
    .chronicle-toast {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background: var(--lumiverse-bg);
      border: 1px solid var(--lumiverse-border);
      border-radius: 10px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      font-size: calc(13px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text);
      max-width: 420px;
      white-space: nowrap;
      transition: opacity 0.4s ease;
    }
    .chronicle-toast-fading {
      opacity: 0;
    }
    .chronicle-toast-error {
      border-color: var(--chronicle-error-border);
    }
    .chronicle-toast-success {
      border-color: var(--chronicle-success-text);
    }
    .chronicle-toast-icon {
      color: var(--chronicle-success-text);
      font-weight: 700;
      font-size: calc(14px * var(--lumiverse-font-scale, 1));
    }

    /* ── Delete Confirmation Popup ───────────────────── */
    .chronicle-dc-overlay {
      position: fixed; inset: 0;
      background: var(--chronicle-overlay-bg);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000;
    }
    .chronicle-dc-dialog {
      background: var(--lumiverse-bg);
      border: 1px solid var(--lumiverse-border);
      border-radius: 10px;
      padding: 16px;
      max-width: 280px;
      width: 90%;
    }
    .chronicle-dc-dialog h4 {
      margin: 0 0 8px 0;
      font-size: calc(13px * var(--lumiverse-font-scale, 1));
      color: var(--chronicle-error-text);
      font-weight: 600;
    }
    .chronicle-dc-message {
      font-size: calc(12px * var(--lumiverse-font-scale, 1));
      color: var(--lumiverse-text);
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    .chronicle-dc-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .chronicle-dc-btn {
      padding: 5px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: calc(11px * var(--lumiverse-font-scale, 1));
      border: 1px solid var(--lumiverse-border);
      background: var(--lumiverse-fill-subtle);
      color: var(--lumiverse-text);
      transition: background var(--lumiverse-transition-fast);
    }
    .chronicle-dc-btn:hover {
      background: var(--lumiverse-fill-hover);
    }
    .chronicle-dc-btn-delete {
      background: var(--chronicle-error-bg);
      border-color: var(--chronicle-error-border);
      color: var(--chronicle-error-text);
    }
    .chronicle-dc-btn-delete:hover {
      filter: brightness(1.3);
    }

  `
}

