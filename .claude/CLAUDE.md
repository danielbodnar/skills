# Skills Marketplace — Repo Instructions

## Overview

This is a Claude Code marketplace and plugin collection. It serves as the canonical source for references, snippets, rules, styleguides, and shareable configs.

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

Add as a git submodule:

```bash
git submodule add <url> external_plugins/<name>
```

Then add an entry to `.claude-plugin/marketplace.json`.

## Managing Vendor Submodules

Vendors are shallow submodules for reference only:

```bash
git submodule add --depth 1 <url> vendors/<category>/<name>
```

Set `shallow = true` in `.gitmodules` for the entry.

## Validation

```bash
just validate
```

This checks:
- `marketplace.json` schema validity
- All plugin source paths resolve
- All plugin.json manifests are valid
- All submodules are initialized

## CLI Development

The CLI is in `src/` using Effect-TS and Bun:

- `src/index.ts` — entry point with command routing
- `src/commands/` — one file per subcommand
- `src/lib/schema.ts` — Effect-TS Schema definitions
- `src/lib/marketplace.ts` — marketplace.json read/write
- `src/lib/submodules.ts` — git submodule operations

Build: `just build`
Test: `just test`
Lint: `just lint`

## Conventions

- All config files use JSON/JSONC (not TOML/YAML) where possible
- Nushell for all scripts (`scripts/*.nu`)
- Effect-TS for all TypeScript business logic
- Bun as sole runtime and package manager
- Conventional commits for all changes
