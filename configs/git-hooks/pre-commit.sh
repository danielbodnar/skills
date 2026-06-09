#!/usr/bin/env bash
# pre-commit: trufflehog + nyx-scanner over staged files. Fails loudly on findings.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

mapfile -t staged < <(git diff --cached --name-only --diff-filter=ACM)
if [ "${#staged[@]}" -eq 0 ]; then
  exit 0
fi

echo "[hook] pre-commit: scanning ${#staged[@]} staged file(s)"

if command -v trufflehog >/dev/null 2>&1; then
  echo "[hook] trufflehog filesystem (staged)..."
  trufflehog filesystem --no-update --fail --no-verification "${staged[@]}"
else
  echo "[hook] WARN trufflehog not on PATH — skipping. (mise install)" >&2
fi

if command -v nyx-scanner >/dev/null 2>&1; then
  echo "[hook] nyx-scanner scan (staged)..."
  nyx-scanner scan --no-index "${staged[@]}"
elif command -v nyx >/dev/null 2>&1; then
  echo "[hook] nyx scan (staged)..."
  nyx scan --no-index "${staged[@]}"
else
  echo "[hook] WARN nyx-scanner not on PATH — skipping. (mise install)" >&2
fi

echo "[hook] pre-commit: ok"
