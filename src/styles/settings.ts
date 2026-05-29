export const settingsCSS = /* css */ `

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
`
