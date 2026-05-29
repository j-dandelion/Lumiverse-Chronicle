export const tooltipCSS = /* css */ `

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
`
