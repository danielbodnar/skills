# Bun project justfile
# Usage: Copy to project root as justfile
#
# Requires: bun, nushell

set shell := ["nu", "-c"]

# Default recipe: list all available commands
default:
    @just --list

# Install dependencies
install:
    bun --bun install

# Add a production dependency
add *packages:
    bun --bun add {{packages}}

# Add a dev dependency
add-dev *packages:
    bun --bun add -D {{packages}}

# Start dev server with file watching
dev:
    bun run --watch src/index.ts

# Build for production
build:
    bun build ./src/index.ts --outdir ./dist

# Build a standalone executable
compile name="app":
    bun build ./src/index.ts --compile --outfile ./dist/{{name}}

# Run all tests
test:
    bun test

# Run tests in watch mode
test-watch:
    bun test --watch

# Lint with oxlint
lint:
    bunx oxlint@latest

# Lint and auto-fix
lint-fix:
    bunx oxlint@latest --fix

# Format with prettier
format:
    bunx prettier@latest --write .

# Check formatting without writing
format-check:
    bunx prettier@latest --check .

# Run lint and format checks (CI mode)
quality:
    bunx oxlint@latest
    bunx prettier@latest --check .

# Type check without emitting
typecheck:
    bunx tsc --noEmit

# Clean build artifacts
clean:
    rm -r dist
    rm -r node_modules/.cache
