# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **pkg-skills plugin** (`plugins/pkg-skills/`): indexes installed packages
  across pacman/cargo/bun/npm/pnpm/yarn/mise/go/pipx/deno/uv and generates a
  Claude skill per opted-in package (cheatsheet, command spec blocks, curated
  reference, raw help/man/changelog artifacts, parameterized examples,
  snippets, refresh script, machine-readable meta.json).
  - Opt-in via `$XDG_CONFIG_HOME/pkg-skills/packages.conf` (synced
    commented-out by default; `pkg-skills select` space-to-toggle TUI).
  - Executable `templates/` directory (`${VAR}` + `@ref`, no template engine)
    rendered identically by a deterministic TS resolver and the
    `/pkg-skills-scaffold` slash command.
  - Fail-closed validator enforcing Anthropic skill best practices (naming
    reserved words, description limits, body length, one-level refs, TOC).
  - systemd user timer + pacman (alpm) hook with spool/drain bridge:
    `systemctl --user enable --now pkg-skills.timer pkg-skills-drain.path`.

## [2.0.0] - 2026-06-09

### Changed

- **BREAKING:** Eliminated all git submodules. External plugins (superpowers,
  huggingface-skills, sentry) are now `marketplace.json` entries with remote
  `url` git sources, mirroring the entries in anthropics/claude-plugins-official.
- `sentry-skills` plugin renamed to `sentry` to match the official marketplace.
- `skills add` now registers a remote-source marketplace entry instead of
  cloning a git submodule; `org/repo@path` produces a `git-subdir` source.
- `skills update` now reports upstream-tracking vs pinned plugins instead of
  running `git submodule update`.
- `skills validate` validates remote source objects (github/url/git-subdir/npm)
  and rejects duplicate plugin names.
- Marketplace plugin schema extended: `source` accepts remote source objects;
  entries may carry `version`, `author`, `homepage`, `strict`, `lspServers`.

### Added

- Cherry-picked Anthropic plugins via `git-subdir` sources: hookify,
  security-guidance, plugin-dev, skill-creator, typescript-lsp,
  rust-analyzer-lsp, gopls-lsp.
- `configs/linters/bodnar-sh/` (oxlint/oxfmt bases) and `configs/git-hooks/`
  folded in from bodnar-sh/configs.
- `references/dev-tools.md` — upstream/install/skill pointers for all formerly
  vendored dev tools; `references/related-marketplaces.md`.
- oxlint and biome pinned in `.mise.toml`.

### Removed

- `external_plugins/` and `vendors/` submodule trees (~220 MB), `.gitmodules`,
  `src/lib/submodules.ts`, and the `update-vendors`/`update-plugins` just
  recipes.

## [1.0.0] - 2026-02-25

### Added

- Initial release of the Skills Marketplace
- CLI tool (`skills`) with subcommands: list, search, add, update, validate, catalog, sync
- First-party plugins: code-quality, project-scaffold, infra-ops
- External plugin submodules: superpowers, qodo-skills, huggingface-skills, sentry-skills, posthog, coderabbit, firecrawl, sonatype-guide
- Vendor reference submodules: MCP servers, editor configs, devcontainers, linters, mise, just, claude-plugins-official
- Shareable configurations: mise, linters, justfiles, devcontainers, GitHub workflows, editor settings
- Canonical references (65+ tool/framework docs)
- Canonical snippets (65+ code example directories)
- Rules: reject-python, use-nushell, prevent-chained-commands, no-react, bun-only, functional-only
- Styleguides: nushell, typescript, effect-ts, rust
- Standards: typescript-and-javascript-coding-standards, nushell-scripting-standards
- Nushell management scripts: validate-marketplace, generate-catalog, sync-references
- Marketplace manifest for Claude Code plugin discovery
