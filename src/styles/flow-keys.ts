export const flowKeysCSS = /* css */ `

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
`
