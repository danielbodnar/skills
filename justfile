# Skills Marketplace - Task Runner
# https://github.com/danielbodnar/skills

set shell := ["nu", "-c"]

default:
    @just --list

# Initialize the project (install deps, init submodules)
init:
    bun install
    git submodule update --init --recursive

# Update all vendor submodules to latest
update-vendors:
    git submodule update --remote --merge vendors/

# Update all external plugin submodules
update-plugins:
    git submodule update --remote --merge external_plugins/

# Validate marketplace manifest and all plugin paths
validate:
    bun run src/index.ts validate

# Generate CATALOG.md from all content
catalog:
    bun run src/index.ts catalog

# List all plugins in the marketplace
list:
    bun run src/index.ts list

# Create a new first-party plugin
new-plugin name:
    mkdir plugins/{{name}}
    mkdir plugins/{{name}}/.claude-plugin
    mkdir plugins/{{name}}/commands
    mkdir plugins/{{name}}/skills

# Build the CLI tool
build:
    bun build --compile --outfile ./dist/skills src/index.ts

# Run linting
lint:
    bunx oxlint src/

# Run tests
test:
    bun test

# Sync references and snippets to ~/.claude/
sync:
    nu scripts/sync-references.nu

# Type check
typecheck:
    bunx tsc --noEmit
