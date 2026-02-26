#!/bin/bash

# Block Goose Basic Usage Examples

# === Basic Commands ===

# Start a new goose session
goose

# Configure goose settings
goose configure

# Run benchmarks
goose bench

# === Configuration Examples ===

# Interactive configuration for LLM provider
goose configure
# Follow prompts to:
# - Select provider (OpenAI, Anthropic, Google, etc.)
# - Enter API key
# - Select model

# === Environment Variables ===

# OpenAI Configuration
export OPENAI_API_KEY="sk-..."
export OPENAI_HOST="https://api.openai.com/v1"

# Anthropic Configuration
export ANTHROPIC_API_KEY="sk-ant-..."

# Google Gemini Configuration
export GOOGLE_API_KEY="your-key"

# Custom OpenAI-compatible endpoints
export OPENAI_HOST="https://your-vllm-endpoint.internal"
export OPENAI_API_KEY="your-internal-api-key"

# Disable keyring for secret storage
export GOOSE_DISABLE_KEYRING=1

# === Model Configuration ===

# Configure different models for different modes
export GOOSE_PROVIDER="openai"
export GOOSE_MODEL="gpt-4o-mini"        # Main conversational model
export GOOSE_LEAD_MODEL="o1-preview"    # Lead model for complex tasks
export GOOSE_PLANNER_MODEL="gpt-4o"     # Planning model

# === AI Editor Configuration ===

# OpenAI as editor provider
export GOOSE_EDITOR_API_KEY="sk-..."
export GOOSE_EDITOR_HOST="https://api.openai.com/v1"
export GOOSE_EDITOR_MODEL="gpt-4o"

# Anthropic as editor provider (via proxy)
export GOOSE_EDITOR_API_KEY="sk-ant-..."
export GOOSE_EDITOR_HOST="https://api.anthropic.com/v1"
export GOOSE_EDITOR_MODEL="claude-3-5-sonnet-20241022"

# Local/custom endpoint
export GOOSE_EDITOR_API_KEY="your-key"
export GOOSE_EDITOR_HOST="http://localhost:8000/v1"
export GOOSE_EDITOR_MODEL="your-model"