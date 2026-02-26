# justfile-patterns

Create justfiles with common recipes for Bun, Cloudflare Workers, and Rust projects.

## Overview

[Just](https://just.systems/) is a command runner similar to `make` but without the build system baggage. It uses a simple syntax for defining project-specific recipes (tasks). This skill provides production-ready justfile templates configured to use Nushell as the shell backend.

## When to Use

- Starting a new project that needs a task runner
- Replacing Makefiles, npm scripts, or shell aliases
- Standardizing project commands across a team
- Setting up CI-friendly task definitions

## Shell Configuration

All justfiles **must** set Nushell as the shell:

```just
set shell := ["nu", "-c"]
```

This ensures all recipe bodies use Nushell syntax, not bash. Every template below includes this setting.

## Bun Project Recipes

Standard justfile for a TypeScript/Bun project with linting, testing, and building.

```just
# Project Name - Task Runner
# https://github.com/org/project

set shell := ["nu", "-c"]

default:
    @just --list

# Install dependencies
install:
    bun install

# Start development server with file watching
dev:
    bun run --watch src/index.ts

# Build production binary
build:
    bun build --compile --outfile ./dist/app src/index.ts

# Run test suite
test:
    bun test

# Run tests in watch mode
test-watch:
    bun test --watch

# Lint source code with oxlint
lint:
    bunx oxlint src/

# Lint and auto-fix
lint-fix:
    bunx oxlint --fix src/

# Format code with Biome
format:
    bunx @biomejs/biome format --write src/

# Type check without emitting
typecheck:
    bunx tsc --noEmit

# Run all quality checks
check: lint typecheck test

# Clean build artifacts
clean:
    rm -r dist
```

## Cloudflare Workers Recipes

Extends the Bun template with wrangler commands for Workers development and deployment.

```just
# Worker Name - Task Runner
# https://github.com/org/worker

set shell := ["nu", "-c"]

default:
    @just --list

# Install dependencies
install:
    bun install

# Start local development server
dev:
    bunx wrangler dev

# Start dev with remote resources
dev-remote:
    bunx wrangler dev --remote

# Generate TypeScript types from wrangler.jsonc
types:
    bunx wrangler types

# Deploy to production
deploy:
    bunx wrangler deploy

# Deploy to staging environment
deploy-staging:
    bunx wrangler deploy --env staging

# Tail production logs
tail:
    bunx wrangler tail

# Tail staging logs
tail-staging:
    bunx wrangler tail --env staging

# Run test suite
test:
    bun test

# Lint source code
lint:
    bunx oxlint src/

# Type check
typecheck:
    bunx tsc --noEmit

# Run all quality checks
check: lint typecheck test

# Set a secret in production
secret name:
    bunx wrangler secret put {{name}}

# Set a secret in staging
secret-staging name:
    bunx wrangler secret put {{name}} --env staging

# List all KV namespaces
kv-list:
    bunx wrangler kv namespace list

# List all D1 databases
d1-list:
    bunx wrangler d1 list

# Open the Workers dashboard
dashboard:
    open https://dash.cloudflare.com/

# Clean build artifacts
clean:
    rm -r dist
    rm -r .wrangler
```

## Rust Project Recipes

Standard justfile for Rust projects with cargo commands.

```just
# Project Name - Task Runner
# https://github.com/org/project

set shell := ["nu", "-c"]

default:
    @just --list

# Build in debug mode
build:
    cargo build

# Build for release
build-release:
    cargo build --release

# Run the project
run *args:
    cargo run -- {{args}}

# Run tests
test:
    cargo test

# Run tests with output
test-verbose:
    cargo test -- --nocapture

# Lint with clippy
lint:
    cargo clippy -- -D warnings

# Format code
format:
    cargo fmt

# Check formatting without modifying
format-check:
    cargo fmt -- --check

# Run all quality checks
check: format-check lint test

# Generate documentation
doc:
    cargo doc --open

# Clean build artifacts
clean:
    cargo clean

# Update dependencies
update:
    cargo update

# Audit dependencies for vulnerabilities
audit:
    cargo audit

# Run benchmarks
bench:
    cargo bench
```

## Rust + Bun Monorepo Recipes

For projects with both a Rust backend and TypeScript frontend/tooling.

```just
# Project Name - Task Runner
# https://github.com/org/project

set shell := ["nu", "-c"]

default:
    @just --list

# --- Frontend (Bun/TypeScript) ---

# Install frontend dependencies
fe-install:
    cd frontend; bun install

# Start frontend dev server
fe-dev:
    cd frontend; bun run dev

# Build frontend
fe-build:
    cd frontend; bun run build

# Lint frontend
fe-lint:
    cd frontend; bunx oxlint src/

# Test frontend
fe-test:
    cd frontend; bun test

# --- Backend (Rust) ---

# Build backend
be-build:
    cargo build

# Build backend for release
be-build-release:
    cargo build --release

# Run backend
be-run:
    cargo run

# Test backend
be-test:
    cargo test

# Lint backend
be-lint:
    cargo clippy -- -D warnings

# --- Combined ---

# Run all tests
test: fe-test be-test

# Run all linters
lint: fe-lint be-lint

# Build everything for production
build: fe-build be-build-release

# Run all quality checks
check: lint test
```

## Recipe Patterns

### Parameterized Recipes

Recipes can accept arguments for flexibility:

```just
# Run a specific test file
test-file file:
    bun test {{file}}

# Deploy to a specific environment
deploy env="production":
    bunx wrangler deploy --env {{env}}

# Run with variable number of arguments
run *args:
    bun run src/index.ts {{args}}
```

### Conditional Recipes

Use Nushell conditionals inside recipe bodies:

```just
# Build based on environment
build env="development":
    if "{{env}}" == "production" { bun build --minify src/index.ts --outdir dist } else { bun build src/index.ts --outdir dist }
```

### Dependencies Between Recipes

Recipes can depend on other recipes:

```just
# Full CI pipeline
ci: install lint typecheck test build

# Deploy requires a passing build
deploy: check build
    bunx wrangler deploy
```

### Documentation Recipes

Add comments above recipes to generate help text with `just --list`:

```just
# Show project information
info:
    print $"Project: (open package.json | get name)"
    print $"Version: (open package.json | get version)"
```

## Best Practices

- Always set `shell := ["nu", "-c"]` at the top of every justfile
- Add a `default` recipe that runs `just --list` for discoverability
- Use comment lines above recipes for documentation (shown by `just --list`)
- Keep recipe names short and kebab-case
- Group related recipes with comment separators for monorepos
- Use `check` as the umbrella recipe that runs all quality gates
- Use `clean` to remove all generated artifacts
- Prefer `bunx` over installing global CLI tools
- Pin justfile indent style to spaces (4-wide) in `.editorconfig`
