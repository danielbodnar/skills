# ${PKG_BIN} Reference

**Always check `references/links.md` for upstream docs and `meta.json` for
freshness before asserting version-specific behavior.**

## Contents

- [Quick Reference](#quick-reference)
- [Resources and Documentation](#resources-and-documentation)
- [Installation](#installation)
- [Upstream README](#upstream-readme)
- [Recent Releases](#recent-releases)

## Quick Reference

- Package: `${PKG_NAME}` (${MANAGER})
- Binary: `${PKG_BIN}`
- Version at generation: `${PKG_VERSION}` (snapshot — see meta.json `generatedAt`)
- Homepage: ${PKG_HOMEPAGE}
- Repository: ${PKG_REPO}
- Summary: ${DESCRIPTION}

## Resources and Documentation

@links.md

## Installation

```bash
# Installed on this system via ${MANAGER}; reinstall/update with the same manager.
# pacman:  sudo pacman -S ${PKG_NAME}
# cargo:   cargo install ${PKG_NAME}
# bun:     bun add -g ${PKG_NAME}
# npm:     npm install -g ${PKG_NAME}
# mise:    mise use -g ${PKG_NAME}
```

## Upstream README

@readme.md

## Recent Releases

@releases.md
