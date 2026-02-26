#!/bin/bash

# Block Goose Installation Examples

# === Basic Installation ===

# Install via mise (recommended)
mise install python@latest
mise use python@latest
mise exec python -- -m pip install --user pipx
mise exec python -- -m pipx ensurepath
mise exec python -- -m pipx install goose-ai

# Or install via paru (Arch Linux)
paru -S goose-ai

# === Native Installation ===

# Install CLI via download script (interactive)
curl -fsSL https://github.com/block/goose/releases/download/stable/download_cli.sh | bash

# Install CLI via download script (non-interactive)
curl -fsSL https://github.com/block/goose/releases/download/stable/download_cli.sh | CONFIGURE=false bash

# Install within WSL without interactive configuration
curl -fsSL https://github.com/block/goose/releases/download/stable/download_cli.sh | CONFIGURE=false bash

# === Configuration ===

# Configure LLM provider and API key
goose configure

# Set environment variables for various providers
export OPENAI_API_KEY=your_api_key
export ANTHROPIC_API_KEY=your_api_key
export GOOGLE_API_KEY=your_api_key

# === Verify Installation ===

# Check goose version
goose --version

# Run initial configuration
goose configure