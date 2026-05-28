#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUNTIME_DIR="$HOME/Lumiverse/data/extensions/chronicle/repo"

echo "==> Checking prerequisites..."
command -v bun >/dev/null 2>&1 || { echo "ERROR: bun not found"; exit 1; }
mkdir -p "$RUNTIME_DIR/dist"

echo "==> TypeScript check..."
cd "$SCRIPT_DIR"
bun run check || { echo "ERROR: tsc --noEmit found issues — build aborted"; exit 1; }

echo "==> Building frontend.js..."
bun build src/main.tsx --outfile dist/frontend.js --target browser --format esm || { echo "ERROR: frontend build failed"; exit 1; }

echo "==> Building worker.js..."
bun build src/worker.ts --outfile dist/worker.js --target bun --format esm || { echo "ERROR: worker build failed"; exit 1; }

echo "==> Deploying to runtime: $RUNTIME_DIR"
cp -v dist/frontend.js "$RUNTIME_DIR/dist/frontend.js"
cp -v dist/worker.js "$RUNTIME_DIR/dist/worker.js"
cp -v spindle.json "$RUNTIME_DIR/spindle.json"

echo "==> Done. Hard-refresh browser (Ctrl+F5)."
