export const promptCSS = /* css */ `

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
`
