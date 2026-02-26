# Skills Marketplace

A centralized collection of Claude Code plugins, skills, references, configs, and vendor integrations.

## Quick Start

```bash
# Register as a Claude Code marketplace
claude plugin marketplace add github:danielbodnar/skills

# Or use the CLI tool
bunx skills@latest list
bunx skills@latest add cloudflare/skills@agents-sdk
```

## What's Inside

### Plugins

**First-party** (`plugins/`):

| Plugin | Description |
|--------|-------------|
| `code-quality` | OxLint, Biome, Prettier configuration and linting skills |
| `project-scaffold` | Mise, justfile, devcontainer, and project template skills |
| `infra-ops` | SRE commands for incident response, capacity planning, and system analysis |

**External** (`external_plugins/` — git submodules):

| Plugin | Source |
|--------|--------|
| `superpowers` | [obra/superpowers](https://github.com/obra/superpowers) |
| `qodo-skills` | [qodo-ai/qodo-skills](https://github.com/qodo-ai/qodo-skills) |
| `huggingface-skills` | [huggingface/skills](https://github.com/huggingface/skills) |
| `sentry-skills` | [getsentry/sentry-for-claude](https://github.com/getsentry/sentry-for-claude) |
| `posthog` | [PostHog/posthog-for-claude](https://github.com/PostHog/posthog-for-claude) |
| `coderabbit` | [coderabbitai/claude-plugin](https://github.com/coderabbitai/claude-plugin) |
| `firecrawl` | [firecrawl/firecrawl-claude-plugin](https://github.com/firecrawl/firecrawl-claude-plugin) |
| `sonatype-guide` | [sonatype/sonatype-guide-claude-plugin](https://github.com/sonatype/sonatype-guide-claude-plugin) |

### References & Snippets

Canonical source for `~/.claude/references/` and `~/.claude/snippets/`. Covers 65+ tools including Effect-TS, Bun, Astro, Vue, Cloudflare Workers, Rust, and more.

### Configs

Shareable configuration templates in `configs/`:

- **Mise** — tool version management configs
- **Linters** — OxLint, Biome, Prettier presets
- **Justfiles** — task runner recipes for Bun, Rust, Cloudflare
- **Devcontainers** — Bun and Rust container configurations
- **GitHub** — Copilot agents, CI/CD workflows
- **Editors** — Neovim, Zed, VS Code settings

### Vendor References

Shallow submodules in `vendors/` for reference:

- MCP servers (awesome-mcp-servers, official servers, Cloudflare)
- Editor configs (kickstart.nvim, LazyVim, Zed extensions)
- Devcontainer features and templates
- Linter/formatter source (oxc, biome)
- Tool source (mise, just)
- Claude ecosystem (claude-plugins-official)

## Directory Structure

```
skills/
├── .claude-plugin/          # Marketplace manifest
├── src/                     # CLI tool source
├── plugins/                 # First-party plugins
├── external_plugins/        # 3rd-party plugins (submodules)
├── vendors/                 # Reference repos (shallow submodules)
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

The `skills` CLI manages the collection:

```bash
skills <command> [options] [arguments]

skills list [glob]            # List plugins, filter by glob
skills search <query>         # Search by name/description/category
skills add <org/repo[@path]>  # Add an external plugin
skills update [target]        # Update submodules (vendors|plugins|all)
skills validate               # Validate manifests and paths
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
skills add cloudflare/skills@agents   # Add with path
skills list --json | jq '.[] | .name' # Pipe to jq
skills sync --dry-run                 # Preview sync
```

## Development

```bash
# Install dependencies
bun install

# Initialize submodules
git submodule update --init --recursive

# Or use just
just init

# Run tests
just test

# Build CLI
just build
```

## Management

```bash
# Update all vendors to latest
just update-vendors

# Update all external plugins
just update-plugins

# Validate everything
just validate

# Generate catalog
just catalog

# Sync references to ~/.claude/
just sync
```

## Adding a New Plugin

```bash
# Create plugin skeleton
just new-plugin my-plugin

# Edit plugin manifest
# plugins/my-plugin/.claude-plugin/plugin.json

# Add skills and commands
# plugins/my-plugin/skills/
# plugins/my-plugin/commands/
```

## License

MIT
