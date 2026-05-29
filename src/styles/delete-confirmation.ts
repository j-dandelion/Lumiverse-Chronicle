export const deleteConfirmationCSS = /* css */ `

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
