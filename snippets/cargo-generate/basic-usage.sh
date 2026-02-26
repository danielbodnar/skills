# cargo-generate Basic Usage Examples

# Install cargo-generate
cargo install cargo-generate

# Basic project generation from GitHub template
cargo generate --git https://github.com/rustwasm/wasm-pack-template --name my-wasm-project

# Generate from local template
cargo generate --path ./my-template --name new-project

# Generate with custom values
cargo generate --git https://github.com/your/template --name my-project --define author="John Doe" --define license="MIT"

# Generate in current directory
cargo generate --git https://github.com/your/template --init

# Generate with specific branch or tag
cargo generate --git https://github.com/your/template --branch develop --name my-project
cargo generate --git https://github.com/your/template --tag v1.0.0 --name my-project

# Skip Git initialization
cargo generate --git https://github.com/your/template --name my-project --vcs none

# Force overwrite existing files
cargo generate --git https://github.com/your/template --name my-project --force

# Dry run to see what would be generated
cargo generate --git https://github.com/your/template --name my-project --dry-run

# Verbose output for debugging
cargo generate --git https://github.com/your/template --name my-project --verbose

# Use favorite templates (configured in ~/.cargo/config.toml)
cargo generate wasm --name my-wasm-project

# Generate CLI application from template
cargo generate --git https://github.com/clap-rs/clap-derive-template --name my-cli-tool

# Generate library template
cargo generate --git https://github.com/rust-lang/library-template --name my-library

# Generate with multiple custom values
cargo generate --git https://github.com/your/template \
  --name my-project \
  --define author="Jane Smith" \
  --define email="jane@example.com" \
  --define license="Apache-2.0" \
  --define description="My awesome Rust project"

# Generate WebAssembly project for npm publishing
cargo generate --git https://github.com/rustwasm/wasm-pack-template \
  --name wasm-game-of-life \
  --define description="Conway's Game of Life in Rust and WebAssembly"

# Generate with interactive prompts (default behavior)
cargo generate --git https://github.com/your/template --name my-project
# Will prompt for any undefined placeholders

# Generate from subdirectory of a repository
cargo generate --git https://github.com/your/mono-repo --subfolder templates/rust-lib --name my-lib

# Generate using SSH URL
cargo generate --git git@github.com:your-org/private-template.git --name private-project

# List available templates from a multi-template repository
cargo generate --git https://github.com/your/templates --list-templates