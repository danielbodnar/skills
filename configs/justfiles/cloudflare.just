# Cloudflare Workers justfile
# Usage: Copy to project root as justfile
#
# Requires: bun, wrangler, nushell

set shell := ["nu", "-c"]

# Default recipe: list all available commands
default:
    @just --list

# Install dependencies
install:
    bun --bun install

# Start local dev server
dev:
    bunx wrangler@latest dev

# Start local dev server with remote resources
dev-remote:
    bunx wrangler@latest dev --remote

# Deploy to Cloudflare
deploy:
    bunx wrangler@latest deploy

# Deploy to a specific environment
deploy-env env:
    bunx wrangler@latest deploy --env {{env}}

# Tail production logs
tail:
    bunx wrangler@latest tail

# Tail logs for a specific environment
tail-env env:
    bunx wrangler@latest tail --env {{env}}

# Generate TypeScript types from wrangler.jsonc bindings
types:
    bunx wrangler@latest types

# Set a secret value (interactive)
secret-put name:
    bunx wrangler@latest secret put {{name}}

# List all secrets
secret-list:
    bunx wrangler@latest secret list

# Delete a secret
secret-delete name:
    bunx wrangler@latest secret delete {{name}}

# Run D1 migrations locally
d1-migrate-local db:
    bunx wrangler@latest d1 migrations apply {{db}} --local

# Run D1 migrations in production
d1-migrate-remote db:
    bunx wrangler@latest d1 migrations apply {{db}} --remote

# Open D1 console locally
d1-console db:
    bunx wrangler@latest d1 execute {{db}} --local --command "SELECT 1"

# Lint with oxlint
lint:
    bunx oxlint@latest

# Run tests
test:
    bun test

# Type check
typecheck:
    bunx tsc --noEmit

# Clean build artifacts
clean:
    rm -r dist
    rm -r .wrangler
