# devcontainer-config

Set up devcontainer configurations for Bun and Rust development environments.

## Overview

[Dev Containers](https://containers.dev/) provide reproducible, containerized development environments that work with VS Code, GitHub Codespaces, and any editor supporting the devcontainer spec. This skill generates `.devcontainer/devcontainer.json` configurations optimized for Bun and Rust development workflows.

## When to Use

- Setting up a project for GitHub Codespaces
- Ensuring consistent development environments across a team
- Onboarding new contributors without manual tool installation
- Creating reproducible build environments for CI

## Bun Development Container

Full-featured TypeScript/Bun development environment with common tools pre-installed.

### `.devcontainer/devcontainer.json`

```jsonc
{
  "name": "Bun Development",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": false,
      "installOhMyZsh": false,
      "upgradePackages": true
    },
    "ghcr.io/devcontainers/features/git:1": {
      "ppa": true,
      "version": "latest"
    },
    "ghcr.io/oven-sh/setup-bun:1": {
      "version": "latest"
    },
    "ghcr.io/jdx/devcontainer-feature-mise:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers-extra/features/just:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers-extra/features/nushell:1": {
      "version": "latest"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "biomejs.biome",
        "oxc.oxc-vscode",
        "oven.bun-vscode",
        "EditorConfig.EditorConfig",
        "skellock.just"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "biomejs.biome",
        "terminal.integrated.defaultProfile.linux": "nu"
      }
    }
  },
  "postCreateCommand": "bun install",
  "remoteUser": "vscode"
}
```

## Cloudflare Workers Container

Extends the Bun container with Node.js for wrangler compatibility and Cloudflare-specific extensions.

### `.devcontainer/devcontainer.json`

```jsonc
{
  "name": "Cloudflare Workers Development",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": false,
      "installOhMyZsh": false,
      "upgradePackages": true
    },
    "ghcr.io/devcontainers/features/git:1": {
      "ppa": true,
      "version": "latest"
    },
    "ghcr.io/devcontainers/features/node:1": {
      "version": "22"
    },
    "ghcr.io/oven-sh/setup-bun:1": {
      "version": "latest"
    },
    "ghcr.io/jdx/devcontainer-feature-mise:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers-extra/features/just:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers-extra/features/nushell:1": {
      "version": "latest"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "biomejs.biome",
        "oxc.oxc-vscode",
        "oven.bun-vscode",
        "cloudflare.cloudflare-workers-bindings-extension",
        "EditorConfig.EditorConfig",
        "skellock.just"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "biomejs.biome",
        "terminal.integrated.defaultProfile.linux": "nu"
      }
    }
  },
  "forwardPorts": [8787],
  "postCreateCommand": "bun install",
  "remoteUser": "vscode"
}
```

## Rust Development Container

Optimized for Rust development with cargo, clippy, and rust-analyzer pre-configured.

### `.devcontainer/devcontainer.json`

```jsonc
{
  "name": "Rust Development",
  "image": "mcr.microsoft.com/devcontainers/rust:latest",
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": false,
      "installOhMyZsh": false,
      "upgradePackages": true
    },
    "ghcr.io/devcontainers/features/git:1": {
      "ppa": true,
      "version": "latest"
    },
    "ghcr.io/jdx/devcontainer-feature-mise:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers-extra/features/just:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers-extra/features/nushell:1": {
      "version": "latest"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "rust-lang.rust-analyzer",
        "tamasfe.even-better-toml",
        "vadimcn.vscode-lldb",
        "serayuzgur.crates",
        "EditorConfig.EditorConfig",
        "skellock.just"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "rust-analyzer.check.command": "clippy",
        "terminal.integrated.defaultProfile.linux": "nu"
      }
    }
  },
  "postCreateCommand": "cargo build",
  "remoteUser": "vscode"
}
```

## Rust + Bun Full Stack Container

Combined environment for projects with both Rust and TypeScript components.

### `.devcontainer/devcontainer.json`

```jsonc
{
  "name": "Rust + Bun Full Stack",
  "image": "mcr.microsoft.com/devcontainers/rust:latest",
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": false,
      "installOhMyZsh": false,
      "upgradePackages": true
    },
    "ghcr.io/devcontainers/features/git:1": {
      "ppa": true,
      "version": "latest"
    },
    "ghcr.io/oven-sh/setup-bun:1": {
      "version": "latest"
    },
    "ghcr.io/jdx/devcontainer-feature-mise:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers-extra/features/just:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers-extra/features/nushell:1": {
      "version": "latest"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "rust-lang.rust-analyzer",
        "tamasfe.even-better-toml",
        "vadimcn.vscode-lldb",
        "serayuzgur.crates",
        "biomejs.biome",
        "oxc.oxc-vscode",
        "oven.bun-vscode",
        "EditorConfig.EditorConfig",
        "skellock.just"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "rust-analyzer.check.command": "clippy",
        "terminal.integrated.defaultProfile.linux": "nu"
      }
    }
  },
  "postCreateCommand": "cargo build; bun install",
  "remoteUser": "vscode"
}
```

## Available Features

### Core Features

| Feature | Purpose |
|---------|---------|
| `ghcr.io/devcontainers/features/common-utils` | Base utilities, user setup |
| `ghcr.io/devcontainers/features/git` | Git with latest version |
| `ghcr.io/devcontainers/features/node` | Node.js runtime (when needed) |

### Runtime Features

| Feature | Purpose |
|---------|---------|
| `ghcr.io/oven-sh/setup-bun` | Bun runtime and package manager |
| `mcr.microsoft.com/devcontainers/rust` | Rust toolchain (base image) |

### Tool Features

| Feature | Purpose |
|---------|---------|
| `ghcr.io/jdx/devcontainer-feature-mise` | Mise tool version manager |
| `ghcr.io/devcontainers-extra/features/just` | Just command runner |
| `ghcr.io/devcontainers-extra/features/nushell` | Nushell shell |

## Customizations

### Editor Extensions

Extensions are specified per-template to match the project type. Common extensions included in all templates:

- `EditorConfig.EditorConfig` -- enforces `.editorconfig` settings
- `skellock.just` -- justfile syntax highlighting and recipe running

### Settings

All templates configure:

- Format on save enabled
- Nushell as the default terminal shell
- Project-appropriate default formatter (Biome for TS, rust-analyzer for Rust)

## Lifecycle Commands

| Command | When | Purpose |
|---------|------|---------|
| `postCreateCommand` | After container creation | Install dependencies |
| `postStartCommand` | Each container start | Start services |
| `postAttachCommand` | Each editor attach | Editor-specific setup |

## Port Forwarding

For projects with local servers, add `forwardPorts`:

```jsonc
{
  "forwardPorts": [3000, 8787],
  "portsAttributes": {
    "3000": {
      "label": "Frontend",
      "onAutoForward": "notify"
    },
    "8787": {
      "label": "Workers Dev",
      "onAutoForward": "notify"
    }
  }
}
```

## GitHub Codespaces Configuration

For Codespaces-specific settings, add machine type and prebuild hints:

```jsonc
{
  "hostRequirements": {
    "cpus": 4,
    "memory": "8gb",
    "storage": "32gb"
  },
  "codespaces": {
    "openFiles": ["src/index.ts"]
  }
}
```

## Best Practices

- Always disable zsh and oh-my-zsh in `common-utils` (use Nushell instead)
- Set `remoteUser` to `vscode` for proper file permissions
- Use `postCreateCommand` for one-time setup (dependency installation)
- Prefer devcontainer features over Dockerfile customization
- Keep the feature list minimal to reduce container build time
- Pin major versions for stability (e.g., Node `22`, not `latest`)
- Include only extensions relevant to the project type
- Forward only the ports the project actually uses
