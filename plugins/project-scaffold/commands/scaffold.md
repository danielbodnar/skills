---
name: scaffold
description: Scaffold a new project with mise, justfile, editorconfig, and gitignore
---

Scaffold a new project in the current directory with standard configuration files.

## Steps

Detect the project type from context clues (existing files, user input, directory name). If ambiguous, ask the user which type: `bun`, `cloudflare-workers`, `rust`, or `rust-bun`.

### Create `.mise.toml`

Generate a `.mise.toml` file appropriate for the detected project type. Use the templates from the `mise-config` skill. Always include `just = "latest"`.

### Create `justfile`

Generate a `justfile` with recipes appropriate for the project type. Use the templates from the `justfile-patterns` skill. Always set `shell := ["nu", "-c"]` and include a `default` recipe that runs `just --list`.

### Create `.editorconfig`

Generate a standard `.editorconfig`:

```ini
root = true

[*]
end_of_line = lf
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab

[justfile]
indent_style = space
indent_size = 4
```

### Create `.gitignore`

Generate a `.gitignore` appropriate for the project type. Always include:

```
# Dependencies
node_modules/

# Build output
dist/

# Cache and scratch
.cache/
.scratch/
.agents/

# Environment
.env
.env.*
!.env.example
.dev.vars

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
*.swp
*.swo
*~

# Bun
bun.lockb

# Test coverage
coverage/
```

For Rust projects, also add:

```
# Rust
target/
Cargo.lock
```

For Cloudflare Workers, also add:

```
# Wrangler
.wrangler/
```

### Initialize git (if not already a repo)

If the current directory is not already a git repository, initialize one with `git init`.

### Summary

After creating all files, list what was generated and suggest next steps:

- `mise trust` to activate tool versions
- `mise install` to install the tools
- `just` to see available recipes
- Create `package.json` (for Bun projects) or `Cargo.toml` (for Rust projects) if not present
