# Skills Marketplace

A centralized collection of Claude Code plugins, skills, references, and configs. No git submodules — external plugins are catalog entries with remote git sources, fetched by Claude Code at install time.

## Quick Start

```bash
# Register as a Claude Code marketplace
claude plugin marketplace add github:danielbodnar/skills

# Or use the CLI tool
bunx skills@latest list
bunx skills@latest add obra/superpowers
```

## What's Inside

### Plugins

**First-party** (`plugins/`, versioned with this repo):

| Plugin | Description |
|--------|-------------|
| `code-quality` | OxLint, Biome, Prettier configuration and linting skills |
| `project-scaffold` | Mise, justfile, devcontainer, and project template skills |
| `infra-ops` | SRE commands for incident response, capacity planning, and system analysis |

**External** (remote git sources — nothing vendored, installs track upstream):

| Plugin | Source |
|--------|--------|
| `superpowers` | [obra/superpowers](https://github.com/obra/superpowers) |
| `huggingface-skills` | [huggingface/skills](https://github.com/huggingface/skills) |
| `sentry` | [getsentry/sentry-for-claude](https://github.com/getsentry/sentry-for-claude) |

**Cherry-picked from [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)** (`git-subdir` sources):

| Plugin | Category |
|--------|----------|
| `hookify` | productivity |
| `security-guidance` | security |
| `plugin-dev` | development |
| `skill-creator` | development |
| `typescript-lsp`, `rust-analyzer-lsp`, `gopls-lsp` | language servers |

See `references/related-marketplaces.md` for the official and community marketplaces themselves.

### References & Snippets

Canonical source for `~/.claude/references/` and `~/.claude/snippets/`. Covers 65+ tools including Effect-TS, Bun, Astro, Vue, Cloudflare Workers, Rust, and more. Dev tools formerly vendored as submodules are documented in `references/dev-tools.md` and version-managed via `.mise.toml`.

### Configs

Shareable configuration templates in `configs/`:

- **Mise** — tool version management configs
- **Linters** — OxLint, Biome, Prettier presets (incl. `bodnar-sh` oxlint/oxfmt bases)
- **Git hooks** — pre-commit / pre-push hooks with installer
- **Justfiles** — task runner recipes for Bun, Rust, Cloudflare
- **Devcontainers** — Bun and Rust container configurations
- **GitHub** — Copilot agents, CI/CD workflows
- **Editors** — Neovim, Zed, VS Code settings

## Directory Structure

```
skills/
├── .claude-plugin/          # Marketplace manifest (local + remote plugin sources)
├── src/                     # CLI tool source
├── plugins/                 # First-party plugins
├── rules/                   # Global rules
├── styleguides/             # Code style guides
├── standards/               # Coding standards
├── references/              # Tool/framework reference docs
├── snippets/                # Code examples and patterns
├── configs/                 # Shareable configuration files
├── scripts/                 # Nushell utility scripts
└── justfile                 # Task runner
```

## CLI Tool

The `skills` CLI manages the catalog:

```bash
skills <command> [options] [arguments]

skills list [glob]            # List plugins, filter by glob
skills search <query>         # Search by name/description/category
skills add <org/repo[@path]>  # Register a plugin with a remote git source
skills update [plugin]        # Show upstream-tracking vs pinned plugins
skills validate               # Validate manifest and plugin sources
skills catalog                # Generate CATALOG.md
skills sync                   # Sync references to ~/.claude/
```

### Global Flags

```
-h, --help       Show help
-v, --verbose    Detailed output
-q, --quiet      Suppress non-error output
-V, --version    Show version
--json           JSON output (where supported)
--dry-run        Preview without applying
```

### Examples

```bash
skills list "code-*"                  # Glob-filtered list
skills search "linting"               # Full-text search
skills add obra/superpowers           # Register remote plugin
skills add anthropics/claude-plugins-official@plugins/hookify
skills list --json | jq '.[] | .name' # Pipe to jq
skills sync --dry-run                 # Preview sync
```

## Versioning & Updates

External entries are intentionally **unpinned**: Claude Code uses the source's
commit SHA as the version key, so `/plugin update` pulls the latest upstream
commit. To pin a plugin, add `ref` (branch/tag) or `sha` to its source object
in `marketplace.json`.

## Development

```bash
just init        # bun install
just test        # Run tests
just build       # Build CLI
just validate    # Validate marketplace
just catalog     # Generate catalog
just sync        # Sync references to ~/.claude/
```

## Adding a New Plugin

```bash
# First-party: create plugin skeleton
just new-plugin my-plugin
# then edit plugins/my-plugin/.claude-plugin/plugin.json, skills/, commands/

# External: register a remote source
just add org/repo
```

## License

MIT
