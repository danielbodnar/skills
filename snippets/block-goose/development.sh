#!/bin/bash

# Block Goose Development Examples

# === Development Setup ===

# Install dependencies for local development
apt update
apt install libxcb1 libxcb1-dev libdbus-1-3 nvi
mkdir -p ~/.config/goose

# === Build and Development ===

# Build Rust FFI library
cargo build --release --package goose-ffi

# Generate Python bindings
cargo run --features=uniffi/cli --bin uniffi-bindgen generate --library ./target/debug/libgoose_llm.dylib --language python --out-dir bindings/python

# Run Python FFI example
DYLD_LIBRARY_PATH=./target/debug python bindings/python/usage.py

# Run FFI example with environment variables
DATABRICKS_HOST=... DATABRICKS_API_KEY=... python crates/goose-ffi/examples/goose_agent.py

# === Local Development with MCP ===

# Create Python virtual environment
python -m venv .venv
source .venv/bin/activate

# Install MCP dependencies
pip install mcp

# Run MCP server locally
uv run /full/path/to/mcp-wiki/.venv/bin/mcp-wiki

# === Testing and Debugging ===

# Run cross-platform tests
./run_cross_local.md

# Configure test environment
mkdir -p ~/.config/goose
# create goose config file
# set api key env variable

# === Ollama Integration ===

# Install custom DeepSeek-R1 model
ollama run michaelneale/deepseek-r1-goose

# === Project Documentation ===

# Install documentation dependencies
yarn

# Build documentation
yarn build

# === Configuration Files ===

# Goose configuration location
~/.config/goose/config.yaml

# Secrets storage (when keyring disabled)
# macOS/Linux: ~/.config/goose/secrets.yaml
# Windows: %APPDATA%\Block\goose\config\secrets.yaml