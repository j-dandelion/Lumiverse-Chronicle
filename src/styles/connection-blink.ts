export const connectionBlinkCSS = /* css */ `

    /* ── New Connection Button Blink ──────────────── */
    @keyframes chronicle-conn-blink {
      0%, 100% {
        box-shadow: 0 0 0 0 transparent;
      }
      50% {
        box-shadow: 0 0 0 3px var(--lumiverse-primary), 0 0 10px var(--lumiverse-primary-050);
      }
    }
    .chronicle-conn-highlight {
      animation: chronicle-conn-blink 2s ease-in-out 2;
    }
`
