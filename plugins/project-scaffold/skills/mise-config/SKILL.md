# mise-config

Set up mise for tool version management with Bun, Node, and Rust presets.

## Overview

[Mise](https://mise.jdx.dev/) is a polyglot tool version manager that replaces nvm, rbenv, pyenv, and similar tools with a single unified interface. This skill generates `.mise.toml` configurations tailored to different project types, ensuring consistent tool versions across development environments and CI pipelines.

## When to Use

- Starting a new project that needs pinned tool versions
- Migrating from `.nvmrc`, `.node-version`, `.tool-versions`, or `rust-toolchain.toml`
- Setting up CI/CD pipelines that need reproducible tool versions
- Standardizing tool versions across a team

## Configuration Templates

### Bun Project (TypeScript/JavaScript)

The default for all TS/JS projects. Pins Bun as the primary runtime with just as the task runner.

```toml
[tools]
bun = "latest"
just = "latest"

[env]
BUN_INSTALL = "{{env.HOME}}/.bun"
```

### Bun + Node Project

For projects that depend on packages requiring Node.js (e.g., native addons, specific CLI tools).

```toml
[tools]
bun = "latest"
node = "22"
just = "latest"

[env]
BUN_INSTALL = "{{env.HOME}}/.bun"
```

### Cloudflare Workers Project

Adds wrangler compatibility. Node is included because some wrangler internals require it.

```toml
[tools]
bun = "latest"
node = "22"
just = "latest"

[env]
BUN_INSTALL = "{{env.HOME}}/.bun"
WRANGLER_SEND_METRICS = "false"
```

### Rust Project

For systems programming, CLI tools, and performance-critical applications.

```toml
[tools]
rust = "stable"
just = "latest"

[env]
CARGO_TERM_COLOR = "always"
```

### Rust + Bun Project

For full-stack projects with a Rust backend and TypeScript frontend or tooling.

```toml
[tools]
bun = "latest"
rust = "stable"
just = "latest"

[env]
BUN_INSTALL = "{{env.HOME}}/.bun"
CARGO_TERM_COLOR = "always"
```

### Full Stack (Bun + Node + Rust)

For monorepos or complex projects requiring all three runtimes.

```toml
[tools]
bun = "latest"
node = "22"
rust = "stable"
just = "latest"

[env]
BUN_INSTALL = "{{env.HOME}}/.bun"
CARGO_TERM_COLOR = "always"
```

## Common Tool Versions

| Tool | Recommended | Notes |
|------|-------------|-------|
| `bun` | `latest` | Always use latest stable |
| `node` | `22` | LTS, only when required by dependencies |
| `rust` | `stable` | Use stable channel unless nightly features needed |
| `just` | `latest` | Task runner, always latest |
| `deno` | `latest` | Only if project explicitly requires Deno |

## CI Integration

### GitHub Actions

Use the official `jdx/mise-action` to install tools from `.mise.toml`:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: jdx/mise-action@v2
  - run: bun install
  - run: bun test
```

The action automatically reads `.mise.toml` and installs all specified tools at the correct versions.

### GitLab CI

```yaml
before_script:
  - curl https://mise.run | sh
  - eval "$(~/.local/bin/mise activate bash)"
  - mise install
```

## Task Configuration

Mise supports inline tasks via `[tasks]`. For simple projects, this can replace a justfile entirely:

```toml
[tools]
bun = "latest"

[tasks.dev]
run = "bun run --watch src/index.ts"
description = "Start dev server with file watching"

[tasks.build]
run = "bun build --compile --outfile ./dist/app src/index.ts"
description = "Build production binary"

[tasks.test]
run = "bun test"
description = "Run test suite"

[tasks.lint]
run = "bunx oxlint src/"
description = "Lint source code"
```

## Environment Variables

Mise can manage environment variables per-project via the `[env]` table. Sensitive values should use `env_file` instead:

```toml
[env]
NODE_ENV = "development"

# Load secrets from .env (not committed to git)
env_file = ".env"
```

## Migration Guide

### From .nvmrc / .node-version

Replace the file contents with a `.mise.toml`:

```toml
[tools]
node = "22"  # was: 22.14.0 in .nvmrc
```

### From rust-toolchain.toml

```toml
[tools]
rust = "stable"  # was: [toolchain] channel = "stable"
```

### From .tool-versions (asdf)

Mise reads `.tool-versions` natively, but `.mise.toml` is preferred for new projects. Convert by mapping each line to a `[tools]` entry.

## Best Practices

- Always commit `.mise.toml` to version control
- Use `latest` for tools that should always be current (bun, just)
- Pin major versions for tools where breaking changes matter (node = "22")
- Use `mise trust` on first clone to activate the configuration
- Keep `.mise.toml` at the project root alongside `package.json`
- Prefer `.mise.toml` over `.tool-versions` for new projects
