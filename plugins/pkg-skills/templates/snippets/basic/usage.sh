#!/usr/bin/env bash
# ${PKG_BIN} — minimal scripted invocation with failure handling.
set -euo pipefail

if ! command -v ${PKG_BIN} >/dev/null 2>&1; then
  echo "${PKG_BIN} not found — install via ${MANAGER}" >&2
  exit 127
fi

${PKG_BIN} "$@"
