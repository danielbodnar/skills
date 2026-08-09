#!/usr/bin/env bash
# Refresh this skill's docs without agent tokens:
# re-fetch help/man/tldr/GitHub artifacts, then regenerate the skill.
# Execute this script; there is no need to read it into context.
set -euo pipefail

if command -v pkg-skills >/dev/null 2>&1; then
  PKG_SKILLS=pkg-skills
elif command -v bunx >/dev/null 2>&1; then
  PKG_SKILLS="bunx @danielbodnar/pkg-skills"
else
  echo "pkg-skills CLI not found on PATH" >&2
  exit 127
fi

$PKG_SKILLS fetch "${PKG_NAME}"
$PKG_SKILLS generate "${PKG_NAME}"
echo "refreshed skill ${SKILL_NAME} from live ${MANAGER} metadata"
