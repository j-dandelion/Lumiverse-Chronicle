export const errorBoundaryCSS = /* css */ `

    /* ── Error boundary ─────────────────────────────────── */
    .chronicle-error-boundary {
      padding: 24px;
      text-align: center;
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      border-radius: 8px;
      margin: 16px;
    }
    .chronicle-error-boundary-icon { font-size: 32px; margin-bottom: 8px; }
    .chronicle-error-boundary-title { font-size: 14px; font-weight: 600; color: var(--lumiverse-text); margin-bottom: 4px; }
    .chronicle-error-boundary-msg { font-size: 12px; color: var(--lumiverse-text-secondary); margin-bottom: 12px; word-break: break-word; }
    .chronicle-error-boundary-dismiss {
      background: var(--lumiverse-fill-subtle);
      border: 1px solid var(--lumiverse-border);
      color: var(--lumiverse-text);
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
`
