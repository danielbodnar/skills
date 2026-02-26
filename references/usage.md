# Usage CLI Reference

**Always remember to reference @$HOME/.claude/references/usage.md and look for snippets and examples in @$HOME/.claude/snippets/usage/**

## Quick Reference

- Installation: `mise use -g usage` or `cargo install usage-cli`
- Specification: KDL-based configuration for CLI definitions
- Documentation: <https://usage.jdx.dev/>
- GitHub: <https://github.com/jdx/usage>
- Package: <https://crates.io/crates/usage-cli>

## Resources and Documentation

- [Usage CLI Documentation](https://usage.jdx.dev/)
  - [Getting Started](https://usage.jdx.dev/cli/)
  - [CLI Reference](https://usage.jdx.dev/cli/reference/)
    - [Generate Commands](https://usage.jdx.dev/cli/reference/generate/)
    - [Completion Commands](https://usage.jdx.dev/cli/completions/)
  - [Specification Reference](https://usage.jdx.dev/spec/)
    - [KDL Syntax](https://usage.jdx.dev/spec/reference/)
    - [Flags](https://usage.jdx.dev/spec/reference/flag/)
    - [Arguments](https://usage.jdx.dev/spec/reference/arg/)
    - [Commands](https://usage.jdx.dev/spec/reference/cmd/)
    - [Configuration](https://usage.jdx.dev/spec/reference/config/)
  - [Script Integration](https://usage.jdx.dev/cli/scripts/)
  - [Shell Completions](https://usage.jdx.dev/cli/completions/)
  - [Documentation Generation](https://usage.jdx.dev/cli/manpages/)
- [Community Resources](https://github.com/jdx/usage)
  - [Examples](https://github.com/jdx/usage/tree/main/examples)
  - [Issue Tracker](https://github.com/jdx/usage/issues)
  - [Discussions](https://github.com/jdx/usage/discussions)

## Installation Methods

### Primary Installation (Recommended)

- **mise**: `mise use -g usage`
- **Cargo**: `cargo install usage-cli`
- **Cargo with binstall**: `cargo binstall usage-cli`

### Alternative Package Managers

- **Homebrew**: `brew install usage`
- **Arch Linux**: `pacman -S usage`

## Core Commands

### Generation Commands

- `usage generate completion <shell> <bin>` - Generate shell completions
- `usage generate markdown [FLAGS]` - Generate markdown documentation
- `usage generate manpage [FLAGS]` - Generate manpage documentation
- `usage generate fig [FLAGS]` - Generate Fig/Amazon Q completions
- `usage generate json [FLAGS]` - Generate JSON schema

### Completion Commands

- `usage complete-word --file <spec> -- <args>` - Get completion suggestions
- `usage --completions <shell>` - Output completion script for shell

### Utility Commands

- `usage --help` - Show help information
- `usage --version` - Show version information

## Specification Syntax (KDL)

### Basic Structure

```kdl
min_usage_version "1.0.0"

# Metadata
name "My CLI"
bin "mycli"
about "CLI description"
version "1.0.0"
author "Author Name"
license "MIT"

# Global flags
flag "-h --help" help="Show help"
flag "-V --version" help="Show version"

# Commands and arguments
cmd "subcommand" help="Subcommand description" {
  arg "<required>" help="Required argument"
  arg "[optional]" help="Optional argument"
  flag "-f --force" help="Force operation"
}
```

### Flag Definitions

```kdl
# Basic flags
flag "-f --force" help="Force operation"
flag "-v --verbose" help="Verbose output" count=true
flag "--dry-run" help="Dry run mode"

# Flags with values
flag "-u --user <user>" help="User to run as"
flag "--config <file>" help="Config file path"

# Flags with environment variables and defaults
flag "-u --user <user>" help="User" env="CLI_USER" default="admin"
flag "--port <port>" help="Port" env="PORT" default="3000"

# Global flags
flag "-v --verbose" help="Verbose" global=true count=true
```

### Argument Definitions

```kdl
# Required positional arguments
arg "<file>" help="Input file"
arg "<dir>" help="Directory path"

# Optional positional arguments
arg "[output]" help="Output file"
arg "[target]" help="Build target"

# Arguments with completions
arg "<file>" help="File" complete="file"
arg "<dir>" help="Directory" complete="dir"
```

### Command Definitions

```kdl
cmd "build" help="Build the project" {
  flag "--watch" help="Watch for changes"
  flag "--target <target>" help="Build target"
  arg "[file]" help="Entry file"
}

cmd "config" help="Manage configuration" {
  cmd "get" help="Get config value" {
    arg "<key>" help="Config key"
  }
  cmd "set" help="Set config value" {
    arg "<key>" help="Config key"
    arg "<value>" help="Config value"
    flag "-f --force" help="Overwrite existing"
  }
}
```

### Configuration Files

```kdl
# Configuration file support
config_file ".mycli.toml" findup=true

# Flag with config file binding
flag "-u --user <user>" help="User" config="settings.user" default="admin"
```

### Advanced Features

```kdl
# Command aliases
cmd "config" help="Manage config" {
  cmd "add" help="Add config" {
    alias "set" "create"
    arg "<key>" help="Config key"
    arg "<value>" help="Config value"
  }
  cmd "remove" help="Remove config" {
    alias "rm" "delete"
    arg "<key>" help="Config key"
  }
}

# Hidden commands and aliases
cmd "internal" help="Internal command" hide=true
cmd "config" {
  cmd "remove" {
    alias "delete" hide=true  # Hidden alias
  }
}

# Required subcommands
cmd "git" subcommand_required=true {
  cmd "add" { /* ... */ }
  cmd "commit" { /* ... */ }
}

# Help customization
cmd "build" {
  before_help "Before help text"
  help "Build the project"
  after_help "After help text"
  before_long_help "Before long help"
  long_help "Detailed build description"
  after_long_help "After long help"
}

# Examples
cmd "build" {
  example "Basic build" "mycli build"
  example "Watch mode" "mycli build --watch"
}

# Source code links
source_code_link_template "https://github.com/user/repo/blob/main/src/cli/{{path}}.rs"
```

## Script Integration

### Bash Scripts

```bash
#!/usr/bin/env -S usage bash
#USAGE flag "-f --force" help="Overwrite existing file"
#USAGE flag "-u --user <user>" help="User to run as"
#USAGE arg "<file>" help="File to process" default="output.txt"

# Access parsed arguments via environment variables
if [ "$usage_force" = "true" ]; then
  rm -f "$usage_file"
fi

user=${usage_user:-world}
echo "Hello, $user" >> "$usage_file"
```

### JavaScript/Node.js Scripts

```javascript
#!/usr/bin/env -S usage node
//USAGE flag "-f --force" help="Overwrite existing file"
//USAGE flag "-u --user <user>" help="User to run as"
//USAGE arg "<file>" help="File to process" default="output.txt"

const fs = require("fs");
const { usage_user, usage_force, usage_file } = process.env;

if (usage_force === "true") {
  fs.rmSync(usage_file, { force: true });
}

const user = usage_user ?? "world";
fs.appendFileSync(usage_file, `Hello, ${user}\n`);
```

### TypeScript/Bun Scripts

```typescript
#!/usr/bin/env -S usage bun run
//USAGE flag "--dev" help="Development mode"
//USAGE flag "--port <port>" help="Server port" default="3000"
//USAGE arg "[file]" help="Entry file" default="index.ts"

const isDev = process.env.usage_dev === "true";
const port = parseInt(process.env.usage_port || "3000");
const file = process.env.usage_file || "index.ts";

// Bun server implementation
export default {
  port,
  development: isDev,
  fetch() {
    return new Response("Hello World!");
  },
};
```

## Shell Completions

### Generating Completions

```bash
# Bash
usage generate completion bash mycli > ~/.bash_completions/mycli.bash
source ~/.bash_completions/mycli.bash

# Zsh
usage generate completion zsh mycli > ~/.zsh_completions/_mycli
source ~/.zsh_completions/_mycli

# Fish
usage generate completion fish mycli > ~/.config/fish/completions/mycli.fish

# Fig/Amazon Q
usage generate fig -f ./mycli.usage.kdl > ./mycli.fig.ts
```

### Dynamic Completions

```bash
# Complete words dynamically
usage complete-word --file ./mycli.usage.kdl -- mycli build --t
# Output: --target
```

### Installing Completions System-wide

```bash
# Bash (system-wide)
usage generate completion bash mycli > /etc/bash_completion.d/mycli

# Zsh (system-wide)
usage generate completion zsh mycli > /usr/local/share/zsh/site-functions/_mycli

# Usage CLI self-completions
usage --completions bash > /etc/bash_completion.d/usage
usage --completions zsh > /usr/share/zsh/site-functions/_usage
usage --completions fish > ~/.config/fish/completions/usage.fish
```

## Documentation Generation

### Markdown Documentation

```bash
# Generate markdown docs
usage generate markdown -f ./mycli.usage.kdl > docs/cli.md

# With custom template
usage generate markdown --template custom.md.tera -f ./mycli.usage.kdl
```

### Manpage Generation

```bash
# Generate manpage
usage generate manpage -f ./mycli.usage.kdl > /usr/share/man/man1/mycli.1

# View generated manpage
man mycli
```

### JSON Schema Export

```bash
# Generate JSON schema
usage generate json -f ./mycli.usage.kdl > schema/cli.json

# Use in TypeScript projects
tsc --resolveJsonModule --allowSyntheticDefaultImports
```

## Integration Patterns

### Build Tool Integration

```bash
# Add to package.json scripts
{
  "scripts": {
    "build:completions": "usage generate completion bash mycli > completions/mycli.bash",
    "build:docs": "usage generate markdown -f ./cli.usage.kdl > docs/cli.md",
    "build:man": "usage generate manpage -f ./cli.usage.kdl > man/mycli.1"
  }
}
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Generate CLI Documentation
  run: |
    usage generate markdown -f ./cli.usage.kdl > docs/cli.md
    usage generate completion bash mycli > completions/mycli.bash
    usage generate completion zsh mycli > completions/_mycli
    usage generate completion fish mycli > completions/mycli.fish
```

### Development Workflow

```bash
# Development script with Usage
#!/usr/bin/env -S usage bash
#USAGE flag "--watch" help="Watch for changes"
#USAGE flag "--port <port>" help="Dev server port" default="3000"
#USAGE arg "[env]" help="Environment" default="development"

if [ "$usage_watch" = "true" ]; then
  echo "Starting development server with hot reload..."
  bun --hot --port "$usage_port" dev
else
  echo "Starting development server..."
  bun --port "$usage_port" dev
fi
```

## Best Practices

### Configuration Priority Order

1. **CLI flags** (highest priority)
2. **Environment variables**
3. **Configuration files**
4. **Default values** (lowest priority)

### Specification Organization

```kdl
min_usage_version "1.0.0"

# 1. Metadata first
name "My CLI"
bin "mycli"
version "1.0.0"

# 2. Global configuration
config_file ".mycli.toml" findup=true

# 3. Global flags
flag "-h --help" help="Show help" global=true
flag "-v --verbose" help="Verbose output" global=true count=true

# 4. Commands (organized hierarchically)
cmd "build" { /* ... */ }
cmd "test" { /* ... */ }
cmd "deploy" { /* ... */ }
```

### Error Handling

```kdl
# Provide helpful error messages
flag "-f --file <file>" help="Input file (required)"

# Use validation patterns
arg "<port>" help="Port number (1-65535)"

# Provide examples
cmd "deploy" {
  example "Deploy to staging" "mycli deploy --env staging"
  example "Deploy with custom config" "mycli deploy --config prod.toml"
}
```

### Security Considerations

```kdl
# Sensitive flags (avoid logging)
flag "--token <token>" help="API token" env="API_TOKEN"
flag "--password <pass>" help="Password" env="PASSWORD"

# Configuration file permissions
config_file "~/.mycli/config.toml" mode=0o600
```

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/usage/`:

- Basic specification patterns
- Advanced configuration examples
- Script integration patterns
- Shell completion setup
- Documentation generation workflows
- CI/CD integration examples

## Schema and Type Definitions

JSON schemas and TypeScript definitions in `$HOME/.claude/snippets/usage/schemas/`

## Linting and Formatting

Configuration files for KDL formatting and validation in `$HOME/.claude/snippets/usage/linting/`
