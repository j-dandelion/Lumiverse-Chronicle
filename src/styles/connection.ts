export const connectionCSS = /* css */ `

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
`
