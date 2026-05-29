export const buttonCSS = /* css */ `

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
`
