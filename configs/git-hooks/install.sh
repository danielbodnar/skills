#!/usr/bin/env bash
# install.sh: wire @bodnar-sh/configs hooks into the current git repo.
# Usage: bun run @bodnar-sh/configs/git-hooks/install
# Idempotent: safe to re-run.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
hooks_src="$(cd "$(dirname "$0")" && pwd)"
hooks_dst="$repo_root/.git/hooks"

mkdir -p "$hooks_dst"

for hook in pre-commit pre-push; do
  src="$hooks_src/$hook.sh"
  dst="$hooks_dst/$hook"
  if [ ! -f "$src" ]; then
    echo "[install] missing source: $src" >&2
    exit 1
  fi
  ln -snf "$src" "$dst"
  chmod +x "$src"
  echo "[install] $hook -> $src"
done

echo "[install] core.hooksPath = .git/hooks (default; symlinks used)"
echo "[install] verify with: ls -la $hooks_dst"
