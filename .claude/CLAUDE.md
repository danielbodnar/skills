# Skills Marketplace — Repo Instructions

## Overview

This is a Claude Code marketplace and plugin collection. It serves as the canonical source for references, snippets, rules, styleguides, and shareable configs. There are no git submodules — external plugins are referenced in `marketplace.json` via remote git sources and fetched by Claude Code at install time.

## Adding a New First-Party Plugin

```bash
just new-plugin <name>
```

Then populate:
- `plugins/<name>/.claude-plugin/plugin.json` — manifest
- `plugins/<name>/skills/` — skill directories with `SKILL.md`
- `plugins/<name>/commands/` — slash command `.md` files
- `plugins/<name>/agents/` — agent definitions (optional)
- `plugins/<name>/hooks/` — hook scripts (optional)

Update `.claude-plugin/marketplace.json` to register the plugin.

## Adding an External Plugin

Register it in `.claude-plugin/marketplace.json` with a remote source — no files are vendored:

```bash
just add obra/superpowers
just add anthropics/claude-plugins-official@plugins/hookify
```

`org/repo` produces a `github` source; `org/repo@path` produces a `git-subdir` source. Leave `ref`/`sha`/`version` unset so installs track the latest upstream commit; add them only to pin.

Supported source shapes (see `src/lib/schema.ts`):
- relative path string (`./plugins/<name>`) for first-party plugins
- `{ "source": "github", "repo": "org/repo" }`
- `{ "source": "url", "url": "https://…​.git" }`
- `{ "source": "git-subdir", "url": "…​.git", "path": "plugins/<name>" }`
- `{ "source": "npm", "package": "…" }`

## Reference Material

Dev tools (oxc, biome, mise, just, devcontainers, …) are NOT vendored. They are installed via mise (`.mise.toml`) and documented in `references/dev-tools.md`. Related marketplaces are listed in `references/related-marketplaces.md`.

## Validation

```bash
just validate
```

This checks:
- `marketplace.json` schema validity
- Local plugin source paths resolve and have plugin.json manifests
- Remote sources carry the required fields for their type
- No duplicate plugin names

## CLI Development

The CLI is in `src/` using Effect-TS and Bun:

- `src/index.ts` — entry point with command routing
- `src/commands/` — one file per subcommand
- `src/lib/schema.ts` — Effect-TS Schema definitions (incl. plugin source union)
- `src/lib/marketplace.ts` — marketplace.json read/write

Build: `just build`
Test: `just test`
Lint: `just lint`

## Conventions

- All config files use JSON/JSONC (not TOML/YAML) where possible
- Nushell for all scripts (`scripts/*.nu`)
- Effect-TS for all TypeScript business logic
- Bun as sole runtime and package manager
- Conventional commits for all changes
