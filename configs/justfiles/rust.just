# Rust project justfile
# Usage: Copy to project root as justfile
#
# Requires: cargo, nushell

set shell := ["nu", "-c"]

# Default recipe: list all available commands
default:
    @just --list

# Build in debug mode
build:
    cargo build

# Build in release mode with optimizations
release:
    cargo build --release

# Run the project
run *args:
    cargo run -- {{args}}

# Run in release mode
run-release *args:
    cargo run --release -- {{args}}

# Run all tests
test:
    cargo test

# Run tests with output
test-verbose:
    cargo test -- --nocapture

# Run a specific test
test-one name:
    cargo test {{name}} -- --nocapture

# Lint with clippy (strict)
clippy:
    cargo clippy -- -D warnings

# Lint with all targets
clippy-all:
    cargo clippy --all-targets --all-features -- -D warnings

# Format code
fmt:
    cargo fmt

# Check formatting without writing
fmt-check:
    cargo fmt -- --check

# Run all quality checks (CI mode)
quality:
    cargo fmt -- --check
    cargo clippy --all-targets --all-features -- -D warnings
    cargo test

# Check compilation without producing binary
check:
    cargo check

# Generate documentation
doc:
    cargo doc --no-deps --open

# Clean build artifacts
clean:
    cargo clean

# Update dependencies
update:
    cargo update

# Audit dependencies for security vulnerabilities
audit:
    cargo audit

# Show dependency tree
deps:
    cargo tree
