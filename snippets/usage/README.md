# Usage CLI Examples and Snippets

This directory contains comprehensive examples and code snippets for working with Usage CLI, the specification and CLI tool for defining command-line interfaces.

## Directory Structure

```
usage/
├── basic/              # Basic Usage CLI specifications
├── configuration/      # Advanced configuration examples
├── completions/        # Shell completion generation
├── scripts/           # Script integration examples
├── documentation/     # Documentation generation
├── integration/       # CI/CD and build integration
├── schemas/           # JSON schemas and type definitions
├── linting/           # Code quality and formatting
└── README.md          # This file
```

## Quick Reference

### Installation

```bash
# Preferred method with mise
mise use -g usage

# Alternative methods
cargo install usage-cli
brew install usage
pacman -S usage
```

### Basic Usage

```bash
# Generate completions
usage generate completion bash mycli > mycli.bash

# Generate documentation
usage generate markdown -f cli.usage.kdl > docs.md

# Generate manpage
usage generate manpage -f cli.usage.kdl > mycli.1
```

## Examples by Category

### 📝 Basic Specifications

- **[simple-cli.usage.kdl](./basic/simple-cli.usage.kdl)** - Simple CLI with basic flags and arguments
- **[nested-commands.usage.kdl](./basic/nested-commands.usage.kdl)** - CLI with nested subcommands and aliases

### ⚙️ Configuration

- **[config-integration.usage.kdl](./configuration/config-integration.usage.kdl)** - Advanced configuration with environment variables and config files

### 🖥️ Script Integration

- **[bash-script.sh](./scripts/bash-script.sh)** - Bash script with Usage CLI integration
- **[node-script.js](./scripts/node-script.js)** - Node.js script with Usage CLI
- **[bun-script.ts](./scripts/bun-script.ts)** - Bun/TypeScript script with Usage CLI

### 🔧 Shell Completions

- **[generate-completions.sh](./completions/generate-completions.sh)** - Complete script for generating all shell completions

### 📚 Documentation

- **[generate-docs.sh](./documentation/generate-docs.sh)** - Comprehensive documentation generation script

### 🔄 CI/CD Integration

- **[ci-cd-examples.yml](./integration/ci-cd-examples.yml)** - GitHub Actions, GitLab CI, Azure Pipelines, Jenkins examples

### 📋 Schemas

- **[usage-spec.schema.json](./schemas/usage-spec.schema.json)** - JSON Schema for Usage CLI specifications

### 🎨 Code Quality

- **[biome.json](./linting/biome.json)** - Biome configuration for TypeScript/JavaScript projects

## Common Patterns

### Basic CLI Structure

```kdl
min_usage_version "1.0.0"

name "My CLI"
bin "mycli"
about "A sample CLI tool"
version "1.0.0"

flag "-f --force" help="Force operation"
flag "-u --user <user>" help="User to run as" env="CLI_USER" default="admin"

arg "<input>" help="Input file"
arg "[output]" help="Output file"
```

### Nested Commands

```kdl
cmd "config" help="Manage configuration" {
  cmd "get" help="Get config value" {
    arg "<key>" help="Configuration key"
  }
  cmd "set" help="Set config value" {
    arg "<key>" help="Configuration key"
    arg "<value>" help="Configuration value"
  }
}
```

### Script Integration

```bash
#!/usr/bin/env -S usage bash
#USAGE flag "-v --verbose" help="Enable verbose output"
#USAGE arg "<file>" help="File to process"

if [ "$usage_verbose" = "true" ]; then
  echo "Processing: $usage_file"
fi
```

## Best Practices

### 1. Specification Organization

- Place metadata at the top
- Group global flags together
- Organize commands hierarchically
- Use consistent naming conventions

### 2. Configuration Priority

1. CLI flags (highest priority)
2. Environment variables
3. Configuration files
4. Default values (lowest priority)

### 3. Help and Documentation

- Provide clear help text for all flags and arguments
- Include usage examples
- Use consistent terminology
- Document configuration file format

### 4. Shell Integration

- Generate completions for all major shells
- Provide installation scripts
- Test completions with actual usage
- Include Fig/Amazon Q support for modern terminals

### 5. CI/CD Integration

- Validate Usage specifications in CI
- Generate documentation automatically
- Include completion generation in build process
- Test CLI functionality after build

## Resources

- **Documentation**: <https://usage.jdx.dev/>
- **GitHub**: <https://github.com/jdx/usage>
- **Complete Reference**: `@$HOME/.claude/references/usage.md`

## Contributing

When adding new examples:

1. Follow the existing directory structure
2. Include comprehensive comments
3. Provide real-world use cases
4. Test all examples before committing
5. Update this README with new additions

## License

Examples in this directory are provided for educational purposes and follow the same license terms as the projects they demonstrate.
