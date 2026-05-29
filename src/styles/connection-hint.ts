export const connectionHintCSS = /* css */ `

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
`
