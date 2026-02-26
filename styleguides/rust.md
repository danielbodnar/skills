# Rust Style Guide

## Formatting

Use `cargo fmt` with default settings. No custom rustfmt.toml unless necessary.

## Linting

Run `cargo clippy` with all warnings:

```bash
cargo clippy -- -W clippy::all -W clippy::pedantic
```

## Naming

- `snake_case` for functions, variables, modules, files
- `PascalCase` for types, traits, enums
- `SCREAMING_SNAKE_CASE` for constants
- `snake_case` for crate names

## Error Handling

Use `thiserror` for library errors, `anyhow` for application errors:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("not found: {0}")]
    NotFound(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}
```

## Prefer

- `impl Trait` over `dyn Trait` where possible
- `?` operator for error propagation
- Iterators over manual loops
- `match` over `if let` chains
- `derive` macros for common traits

## Async

Use `tokio` as the async runtime. Prefer `async`/`await` over manual futures.

## Dependencies

- CLI: `clap` with derive
- Serialization: `serde` + `serde_json`
- HTTP: `reqwest` (client), `axum` (server)
- Logging: `tracing`

## Project Structure

```
src/
  main.rs           # Entry point
  lib.rs            # Library root
  config.rs         # Configuration
  error.rs          # Error types
  commands/         # CLI subcommands
  models/           # Data types
```
