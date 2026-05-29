export const autohideCSS = /* css */ `

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
`
