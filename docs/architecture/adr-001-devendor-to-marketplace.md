# ADR-001: Replace git submodules with remote marketplace sources

- **Status:** Accepted (2026-06-09)
- **PR:** [#1](https://github.com/danielbodnar/skills/pull/1)

## Context

The repo originally carried 17 git submodules (~220 MB of working-tree
checkouts) in three unrelated roles:

1. **Real third-party plugins** (`external_plugins/`): superpowers,
   huggingface-skills, sentry-for-claude — listed in `marketplace.json` via
   local paths into the submodule checkouts.
2. **Reference-only source trees** (`vendors/`): full sources of dev tools
   (biome 115 MB, oxc 44 MB, mise 34 MB, just, devcontainers, editor configs,
   MCP server catalogs) vendored "for reference" — never installable plugins.
3. **A nested marketplace**: `anthropics/claude-plugins-official` as a
   submodule.

Submodules made cloning slow, required `git submodule update --init` to get a
working repo, drifted from upstream unless manually bumped, and conflated
"content this marketplace serves" with "source code someone might want to read".

## Decision

1. **Third-party plugins → remote `url` git sources.** Claude Code's
   marketplace `source` field natively accepts `github`, `url` (git),
   `git-subdir`, and `npm` objects. The official Anthropic marketplace already
   listed our three external plugins as `url` sources to the same upstreams, so
   we mirror those entries verbatim (renaming `sentry-skills` → `sentry`).
2. **Entries are unpinned.** With no `ref`/`sha`/`version`, Claude Code uses
   the upstream commit SHA as the version key — installs and `/plugin update`
   track the latest commit, which is what submodule `--remote` updates
   approximated, without the submodule.
3. **Reference vendors → deleted.** Dev tools are installed via mise
   (`.mise.toml`), not vendored as source. Each former vendor gets a row in
   `references/dev-tools.md` (upstream, install, covering skill). Content we
   actually authored (bodnar-sh/configs) was folded into `configs/`.
4. **No nested marketplaces.** Instead of vendoring claude-plugins-official,
   selected Anthropic plugins are re-exposed as `git-subdir` entries (sparse
   clone of one subdirectory), and `references/related-marketplaces.md` points
   users at the official/community marketplaces directly.

## Consequences

- Plain `git clone` yields a complete repo; ~220 MB and all submodule
  ceremony removed.
- The CLI lost its `git submodule` plumbing (`src/lib/submodules.ts` deleted);
  `add`/`update`/`validate` now operate purely on `marketplace.json`.
- Installing external plugins requires network access to the upstream repos at
  install time (previously satisfied by the local checkout).
- Upstream changes flow to users without any action in this repo. The
  trade-off is no review gate on upstream commits; pin with `ref`/`sha` if a
  plugin needs vetting.
- `sentry-skills` users must reinstall as `sentry`.

## Alternatives considered

- **Vendor plain copies (no submodules)** — how the official repo carries its
  external integrations. Rejected: keeps the repo large and makes us
  responsible for re-vendoring on every upstream change.
- **Pin everything to SHAs** — byte-identical to the old submodule pins.
  Rejected by preference: tracking upstream beats bumping pins for this
  repo's purpose.
