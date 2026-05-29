export const toastCSS = /* css */ `

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
`
