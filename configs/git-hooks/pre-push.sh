#!/usr/bin/env bash
# pre-push: full-repo trufflehog + socket scan + full nyx scan. Fails loudly on findings.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

echo "[hook] pre-push: full-repo scans"

if command -v trufflehog >/dev/null 2>&1; then
  echo "[hook] trufflehog git (full history)..."
  trufflehog git "file://$repo_root" --no-update --fail
else
  echo "[hook] WARN trufflehog not on PATH — skipping. (mise install)" >&2
fi

if command -v socket >/dev/null 2>&1; then
  if [ -f package.json ]; then
    echo "[hook] socket scan (deps)..."
    socket scan create . --view --report
  else
    echo "[hook] socket: no package.json — skipping deps scan"
  fi
else
  echo "[hook] WARN socket not on PATH — skipping. (mise install)" >&2
fi

if command -v nyx-scanner >/dev/null 2>&1; then
  echo "[hook] nyx-scanner scan (full)..."
  nyx-scanner scan .
elif command -v nyx >/dev/null 2>&1; then
  echo "[hook] nyx scan (full)..."
  nyx scan .
else
  echo "[hook] WARN nyx-scanner not on PATH — skipping. (mise install)" >&2
fi

echo "[hook] pre-push: ok"
