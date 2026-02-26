# Mise Reference

**Always remember to reference @$HOME/.claude/references/mise.md and look for snippets and examples in @$HOME/.claude/snippets/mise/**

## Quick Reference

- Installation: `curl https://mise.run | sh`
- Activation: `eval "$(mise activate bash)"`
- Configuration: `mise.toml`
- Documentation: <https://mise.jdx.dev/>
- GitHub: <https://github.com/jdx/mise>
- License: MIT

## Resources and Documentation

- [Mise Documentation](https://mise.jdx.dev/)
  - [Getting Started](https://mise.jdx.dev/getting-started.html)
  - [Configuration](https://mise.jdx.dev/configuration.html)
    - [Environment Variables](https://mise.jdx.dev/environments/)
    - [Tool Management](https://mise.jdx.dev/dev-tools/)
    - [Task Configuration](https://mise.jdx.dev/tasks/)
  - [CLI Reference](https://mise.jdx.dev/cli/)
  - [Installation Guide](https://mise.jdx.dev/installing-mise.html)
  - [Language Support](https://mise.jdx.dev/lang/)
    - [Node.js](https://mise.jdx.dev/lang/node.html)
    - [Python](https://mise.jdx.dev/lang/python.html)
    - [Ruby](https://mise.jdx.dev/lang/ruby.html)
    - [Go](https://mise.jdx.dev/lang/go.html)
    - [Rust](https://mise.jdx.dev/lang/rust.html)
  - [Registry](https://mise.jdx.dev/registry.html)
- [Community Resources](https://github.com/jdx/mise/discussions)
  - [GitHub Discussions](https://github.com/jdx/mise/discussions)
  - [Issue Tracker](https://github.com/jdx/mise/issues)
  - [Discord Community](https://discord.gg/mise)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/mise/`:

- Basic installation and setup patterns
- Advanced configuration examples
- Task management and automation
- Environment variable handling
- Multi-project setups
- CI/CD integration patterns

## Core Concepts

### 1. Tool Management

- **Polyglot version management**: Supports 100+ programming languages and tools
- **Automatic installation**: Tools are installed when first used
- **Version resolution**: Supports exact, fuzzy, latest, and prefix versioning
- **Backend flexibility**: Uses multiple backends (core, asdf, aqua, cargo, npm, etc.)

### 2. Environment Variables

- **Project-specific variables**: Set per-directory environment variables
- **Template support**: Use `{{env.VAR}}` and `{{get_env(name="VAR", default="value")}}` syntax
- **Lazy evaluation**: Variables can be evaluated after tools are resolved
- **Inheritance**: Child directories inherit parent configurations

### 3. Task Runner

- **TOML configuration**: Define tasks in `mise.toml`
- **File-based tasks**: Create executable task files in `.mise/tasks/`
- **Dependencies**: Tasks can depend on other tasks
- **Arguments and flags**: Support for command-line arguments via usage spec
- **Cross-platform**: Different commands for different operating systems

## Configuration Hierarchy

1. `mise.toml` (project root)
2. `.mise.toml` (project root, hidden)
3. `~/.config/mise/config.toml` (global)
4. `/etc/mise/config.toml` (system-wide)

## Environment Variables Reference

- `MISE_CONFIG_FILE`: Override config file location
- `MISE_DATA_DIR`: Data directory (default: `~/.local/share/mise`)
- `MISE_CACHE_DIR`: Cache directory (default: `~/.cache/mise`)
- `MISE_ENV_FILE`: Load environment from dotenv file
- `MISE_TRUSTED_CONFIG_PATHS`: Colon-separated trusted config paths
- `MISE_${PLUGIN}_VERSION`: Override tool version (e.g., `MISE_NODE_VERSION=20`)

## Schema and Type Definitions

Configuration schemas and validation patterns available in `$HOME/.claude/snippets/mise/schemas/`

## Default Usage Patterns

Default to using mise instead of asdf, nvm, pyenv, rbenv, or other single-purpose version managers:

- Use `curl https://mise.run | sh` for installation
- Use `mise use <tool>@<version>` instead of `nvm use` or `pyenv global`
- Use `mise install` instead of `asdf install`
- Use `mise run <task>` instead of `npm run` or `make`
- mise automatically handles environment variables and task management
- Built-in support for dev tools, environment variables, and task runner functionality

### Key APIs

- `mise use <tool>@<version>` for tool installation and activation
- `mise.toml` for project configuration. Don't use `.tool-versions` for new projects
- `mise install` for installing all tools from config
- `mise run <task>` for task execution
- `mise set <VAR>=<value>` for environment variable management
- Built-in template support with `{{env.VAR}}` syntax

## Best Practices

1. **Use `mise.toml` for new projects**: More flexible than `.tool-versions`
2. **Set minimum version**: Use `min_version` to ensure compatibility
3. **Use templates**: Leverage `{{env.VAR}}` for dynamic configuration
4. **Define tasks**: Replace npm scripts with mise tasks
5. **Environment inheritance**: Structure config files hierarchically
6. **Trust configuration**: Use `mise trust` for project configs
7. **Pin versions**: Use specific versions for reproducible builds
8. **Use hooks**: Automate setup with `enter` and `leave` hooks

## Common Commands

```bash
# Installation and setup
curl https://mise.run | sh
mise activate bash

# Tool management
mise use node@20 python@3.11
mise install
mise ls
mise where node

# Environment variables
mise set NODE_ENV=development
mise unset NODE_ENV
mise env

# Task management
mise run dev
mise run test --force
mise tasks

# Configuration
mise config set tools.node 22
mise trust
mise doctor
```

## Advanced Features

- **Shims**: Automatic PATH management
- **Hooks**: Pre/post activation hooks
- **Watch mode**: Automatic task execution on file changes
- **Secrets**: Encrypted environment variables
- **Templates**: Dynamic configuration with Tera templates
- **Backends**: Multiple tool installation backends
- **Registry**: Centralized tool registry
- **IDE integration**: Support for VS Code, Vim, Emacs

## Troubleshooting

- Check `mise doctor` for environment issues
- Use `mise ls` to verify tool installations
- Check `mise config ls` for configuration files
- Use `mise env` to debug environment variables
- Enable debug mode with `MISE_DEBUG=1`
