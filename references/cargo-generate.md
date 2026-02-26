# cargo-generate Reference

**Always remember to reference ~/.claude/references/cargo-generate.md and look for snippets and examples in ~/.claude/snippets/cargo-generate/**

## Quick Reference

- Installation: `cargo install cargo-generate`
- Usage: `cargo generate --git <template-repo> --name <project-name>`
- Documentation: <https://cargo-generate.github.io/cargo-generate/>
- GitHub: <https://github.com/cargo-generate/cargo-generate>
- Crates.io: <https://crates.io/crates/cargo-generate>

## Resources and Documentation

- [cargo-generate Documentation](https://cargo-generate.github.io/cargo-generate/)
  - [Getting Started](https://cargo-generate.github.io/cargo-generate/installation.html)
  - [Usage Guide](https://cargo-generate.github.io/cargo-generate/usage.html)
  - [Template Creation](https://cargo-generate.github.io/cargo-generate/templates/)
    - [Basic Templates](https://cargo-generate.github.io/cargo-generate/templates/basic.html)
    - [Template Placeholders](https://cargo-generate.github.io/cargo-generate/templates/template_defined_placeholders.html)
    - [Liquid Templates](https://cargo-generate.github.io/cargo-generate/templates/liquid.html)
    - [Rhai Hooks](https://cargo-generate.github.io/cargo-generate/templates/rhai.html)
  - [Configuration](https://cargo-generate.github.io/cargo-generate/configuration.html)
  - [CLI Reference](https://cargo-generate.github.io/cargo-generate/cli.html)
- [Community Resources](https://github.com/cargo-generate/cargo-generate)
  - [Template Registry](https://github.com/topics/cargo-generate)
  - [Example Templates](https://github.com/rustwasm/wasm-pack-template)
  - [Contributing Guide](https://github.com/cargo-generate/cargo-generate/blob/main/CONTRIBUTING.md)

## Core Concepts

### Project Generation

- **Template-based**: Uses existing Git repositories as templates
- **Liquid Templating**: Files with `.liquid` extension are processed using Shopify's Liquid template language
- **Placeholder Substitution**: Supports both built-in and custom placeholders
- **Hook Scripts**: Rhai scripts for advanced template processing

### Template Structure

- **Git Repository**: Templates are Git repositories containing project scaffolding
- **Configuration File**: `cargo-generate.toml` for template-specific settings
- **Liquid Files**: `.liquid` extension files are processed and renamed
- **Static Files**: Regular files are copied as-is to the new project

### Placeholder System

- **Built-in Placeholders**: `project-name`, `crate_name`, `crate_type`, `authors`, `os-arch`
- **Custom Placeholders**: Defined in `cargo-generate.toml` with prompts and validation
- **Value Sources**: CLI flags, config files, environment variables, user prompts

## Installation and Setup

### Installation Methods

```bash
# Install from crates.io
cargo install cargo-generate

# Install specific version
cargo install cargo-generate --version 0.18.5

# Install from Git (latest)
cargo install --git https://github.com/cargo-generate/cargo-generate
```

### Configuration

Global configuration in `~/.cargo/config.toml`:

```toml
[cargo-generate]
# Default values for placeholders
authors = ["Your Name <you@example.com>"]

# Favorite templates
[cargo-generate.favorites]
wasm = "https://github.com/rustwasm/wasm-pack-template"
cli = "https://github.com/clap-rs/clap-derive-template"
```

## Basic Usage Patterns

### Simple Project Generation

```bash
# Generate from GitHub template
cargo generate --git https://github.com/rustwasm/wasm-pack-template --name my-wasm-project

# Generate from local template
cargo generate --path ./my-template --name new-project

# Generate with custom values
cargo generate --git <template> --name <project> --define key=value
```

### Advanced Options

```bash
# Skip Git initialization
cargo generate --git <template> --name <project> --vcs none

# Use specific branch or tag
cargo generate --git <template> --branch develop --name <project>

# Generate in current directory
cargo generate --git <template> --init

# Force overwrite existing files
cargo generate --git <template> --name <project> --force
```

## Template Creation

### Basic Template Structure

```
my-template/
├── cargo-generate.toml          # Template configuration
├── Cargo.toml.liquid           # Processed Cargo.toml
├── src/
│   ├── lib.rs.liquid          # Processed source files
│   └── main.rs
├── README.md.liquid            # Processed README
├── .gitignore
└── hooks/                      # Rhai hook scripts
    ├── pre-generate.rhai
    └── post-generate.rhai
```

### Template Configuration (cargo-generate.toml)

```toml
[template]
cargo_generate_version = ">=0.18.0"

[placeholders.project_description]
type = "string"
prompt = "Enter project description"
default = "A new Rust project"

[placeholders.use_async]
type = "bool"
prompt = "Use async/await?"
default = false

[placeholders.license]
type = "string"
prompt = "Choose license"
choices = ["MIT", "Apache-2.0", "GPL-3.0"]
default = "MIT"

[placeholders.features]
type = "array"
prompt = "Select features"
choices = ["serde", "tokio", "clap"]

[conditional.'crate_type == "bin"']
ignore = ["src/lib.rs"]

[conditional.'!use_async']
ignore = ["src/async.rs"]
```

### Liquid Template Examples

```rust
// Cargo.toml.liquid
[package]
name = "{{crate_name}}"
version = "0.1.0"
authors = [{{authors}}]
description = "{{project_description}}"
license = "{{license}}"

[dependencies]
{% if use_async -%}
tokio = { version = "1.0", features = ["full"] }
{% endif -%}
{% for feature in features -%}
{{feature}} = "1.0"
{% endfor -%}
```

## Advanced Features

### Rhai Hook Scripts

```rust
// hooks/pre-generate.rhai
// Validate project name
if variable::get("project-name").len() < 3 {
    abort("Project name must be at least 3 characters");
}

// Set computed values
let uppercase_name = variable::get("project-name").to_upper();
variable::set("PROJECT_NAME_UPPER", uppercase_name);
```

```rust
// hooks/post-generate.rhai
// Run post-generation commands
if variable::get("init_git") {
    system::command("git", ["init"]);
    system::command("git", ["add", "."]);
    system::command("git", ["commit", "-m", "Initial commit"]);
}

// Generate additional files
if variable::get("create_docs") {
    file::write("docs/README.md", "# Documentation\n");
}
```

### Conditional Template Processing

```toml
# cargo-generate.toml
[conditional.'crate_type == "bin"']
ignore = ["src/lib.rs", "benches/"]

[conditional.'license == "MIT"']
ignore = ["LICENSE-APACHE"]

[conditional.'use_github_actions']
include = [".github/workflows/ci.yml"]
```

### Complex Placeholder Types

```toml
[placeholders.database]
type = "string"
prompt = "Choose database"
choices = ["postgresql", "mysql", "sqlite"]
default = "sqlite"
regex = "^(postgresql|mysql|sqlite)$"

[placeholders.readme_content]
type = "editor"
prompt = "Enter README content (opens editor)"

[placeholders.features]
type = "array"
prompt = "Select features (space-separated)"
choices = ["async", "derive", "std"]
```

## Code Examples Location

Comprehensive examples available in `~/.claude/snippets/cargo-generate/`:

- Basic template creation and usage
- Advanced placeholder configurations
- Liquid templating patterns
- Rhai hook script examples
- Complex conditional processing
- Integration with CI/CD systems
- Custom template development
- WebAssembly project templates
- CLI application templates
- Library project templates

## Template Development Best Practices

### Template Organization

```
template-repo/
├── cargo-generate.toml          # Configuration
├── template/                    # Template files
│   ├── Cargo.toml.liquid
│   ├── src/
│   │   └── {{crate_type}}.rs.liquid
│   └── README.md.liquid
├── hooks/                       # Hook scripts
│   ├── pre-generate.rhai
│   └── post-generate.rhai
├── examples/                    # Generated examples
└── tests/                       # Template tests
```

### Validation and Testing

```rust
// hooks/pre-generate.rhai
fn validate_inputs() {
    let name = variable::get("project-name");
    if name.len() < 3 || name.len() > 50 {
        abort("Project name must be 3-50 characters");
    }
    
    if !name.matches("^[a-zA-Z][a-zA-Z0-9_-]*$") {
        abort("Project name must start with letter and contain only alphanumeric, underscore, or dash");
    }
}

validate_inputs();
```

### Error Handling

```rust
// hooks/post-generate.rhai
try {
    system::command("rustfmt", ["--edition", "2021", "src/lib.rs"]);
} catch (error) {
    print("Warning: rustfmt not available, skipping formatting");
}
```

## Integration Patterns

### CI/CD Integration

```yaml
# .github/workflows/template-test.yml.liquid
name: Template Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      {% if use_coverage -%}
      - uses: taiki-e/install-action@cargo-tarpaulin
      {% endif -%}
      - run: cargo test
      {% if use_coverage -%}
      - run: cargo tarpaulin --out xml
      {% endif -%}
```

### IDE Integration

```json
// .vscode/settings.json.liquid
{
    "rust-analyzer.cargo.features": [
        {% for feature in features -%}
        "{{feature}}"{% unless forloop.last %},{% endunless %}
        {% endfor -%}
    ],
    {% if use_async -%}
    "rust-analyzer.completion.callable.snippets": "add_parentheses"
    {% endif -%}
}
```

## Migration and Upgrade Patterns

### Template Versioning

```toml
[template]
cargo_generate_version = ">=0.18.0"
min_supported_version = "0.17.0"

[template.migrations]
"0.17.0" = "Update from 0.17.x to 0.18.x"
```

### Backwards Compatibility

```rust
// hooks/pre-generate.rhai
let version = variable::get("cargo_generate_version");
if version < "0.18.0" {
    // Handle older version compatibility
    variable::set("legacy_mode", true);
}
```

## Security Considerations

### Template Validation

```rust
// hooks/pre-generate.rhai
fn validate_security() {
    let project_name = variable::get("project-name");
    
    // Prevent path traversal
    if project_name.contains("..") || project_name.contains("/") {
        abort("Invalid project name: path traversal detected");
    }
    
    // Validate against known patterns
    let forbidden = ["admin", "root", "system"];
    if forbidden.contains(project_name.to_lower()) {
        abort("Project name not allowed");
    }
}

validate_security();
```

### Safe File Operations

```rust
// hooks/post-generate.rhai
fn safe_file_write(path, content) {
    // Validate path is within project directory
    if path.starts_with("/") || path.contains("..") {
        abort("Unsafe file path: " + path);
    }
    
    file::write(path, content);
}
```

## Performance Optimization

### Template Caching

```bash
# Use local clone for faster repeated generation
git clone https://github.com/your/template.git ~/.cargo-generate/templates/my-template
cargo generate --path ~/.cargo-generate/templates/my-template --name new-project
```

### Conditional Processing

```toml
# Minimize processing with smart conditionals
[conditional.'!use_feature_x']
ignore = ["src/feature_x/", "tests/feature_x_tests.rs"]
```

## Common Use Cases

### WebAssembly Projects

Based on wasm-pack-template pattern for Rust-to-WebAssembly compilation with npm publishing support.

### CLI Applications

Template patterns for command-line tools with argument parsing, configuration, and error handling.

### Library Crates

Structured templates for Rust libraries with documentation, testing, and publishing setup.

### Workspace Projects

Multi-crate workspace templates with shared dependencies and build configurations.

### Embedded Projects

Templates for embedded Rust development with hardware-specific configurations.

## Troubleshooting

### Common Issues

- **Template not found**: Verify Git URL and network access
- **Placeholder errors**: Check cargo-generate.toml syntax and placeholder definitions
- **Liquid syntax errors**: Validate Liquid template syntax in .liquid files
- **Hook script failures**: Debug Rhai scripts with print statements

### Debug Mode

```bash
# Enable verbose output
cargo generate --git <template> --name <project> --verbose

# Check template without generating
cargo generate --git <template> --name <project> --dry-run
```

## Schema and Type Definitions

Template configurations and validation schemas in `~/.claude/snippets/cargo-generate/schemas/`

## Linting and Formatting

Configuration templates and best practices in `~/.claude/snippets/cargo-generate/linting/`
