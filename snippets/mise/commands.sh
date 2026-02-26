#!/bin/bash
# Comprehensive mise commands reference

# =============================================================================
# INSTALLATION AND SETUP
# =============================================================================

# Install mise
curl https://mise.run | sh

# Install via package manager (alternative)
# brew install mise
# apt install mise
# pacman -S mise

# Activate mise in shell
echo 'eval "$(mise activate bash)"' >> ~/.bashrc  # bash
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc    # zsh
echo 'mise activate fish | source' >> ~/.config/fish/config.fish  # fish

# Install usage for autocompletion
mise use -g usage

# =============================================================================
# TOOL MANAGEMENT
# =============================================================================

# Install specific tool versions
mise use node@22
mise use python@3.11
mise use ruby@latest
mise use go@1.21

# Install multiple tools at once
mise use node@22 python@3.11 ruby@3.3

# Install tools globally
mise use -g terraform@latest kubectl@latest jq@latest

# Install all tools from config
mise install

# Install specific tool
mise install node@22

# List installed tools
mise ls

# List available versions
mise ls-remote node

# Show tool information
mise tool node

# Find tool installation path
mise where node
mise where node@20

# Uninstall tool
mise uninstall node@20

# Link external installation
mise link node@brew $(brew --prefix node)

# =============================================================================
# CONFIGURATION MANAGEMENT
# =============================================================================

# Set tool versions
mise config set tools.node 22
mise config set tools.python 3.11

# Set environment variables
mise set NODE_ENV=development
mise set DATABASE_URL=postgresql://localhost/mydb

# Unset environment variables
mise unset NODE_ENV

# List current settings
mise set

# Show all config files
mise config ls

# Trust project configuration
mise trust

# Generate shell completion
mise completion bash > /etc/bash_completion.d/mise

# =============================================================================
# TASK MANAGEMENT
# =============================================================================

# Run tasks
mise run dev
mise run test
mise run build

# Run task with arguments
mise run test --watch
mise run deploy --env staging

# Run task in raw mode (direct I/O)
mise run dev --raw

# Force task execution (ignore up-to-date checks)
mise run build --force

# Run multiple tasks in parallel
mise run lint ::: test ::: build

# List available tasks
mise tasks
mise tasks --json

# Show task dependencies
mise tasks deps
mise tasks deps --dot  # graphviz format

# Add new task
mise task add deploy -- echo "Deploying..."

# =============================================================================
# ENVIRONMENT MANAGEMENT
# =============================================================================

# Show environment variables
mise env
mise env -s bash  # shell-specific format

# Execute command with mise environment
mise exec -- node --version
mise exec node@22 -- node --version

# Start new shell with mise environment
mise shell
mise shell node@22

# Export environment for current shell
eval "$(mise env)"

# =============================================================================
# PROJECT WORKFLOWS
# =============================================================================

# Initialize new project
cd my-project
mise use node@22 python@3.11
echo '[tasks.dev]
run = "npm run dev"' >> mise.toml

# Quick development setup
mise install
mise run dev

# Production deployment
mise set NODE_ENV=production
mise run build
mise run deploy

# Testing workflow
mise run lint
mise run test
mise run build

# =============================================================================
# ADVANCED USAGE
# =============================================================================

# Watch for file changes
mise watch dev
mise watch build --glob src/**/*.ts

# Upgrade all tools
mise upgrade
mise upgrade --bump  # update config files

# Sync with other version managers
mise sync python --pyenv
mise sync node --nvm

# Doctor (troubleshooting)
mise doctor
mise doctor --path

# Search for tools
mise search jq
mise search --interactive

# =============================================================================
# CI/CD INTEGRATION
# =============================================================================

# GitHub Actions
# - uses: jdx/mise-action@v2
# - run: mise install && mise run test

# Generic CI
curl https://mise.run | sh
mise install
mise run test

# Docker integration
FROM node:22
RUN curl https://mise.run | sh
COPY mise.toml .
RUN mise install

# =============================================================================
# PLUGIN MANAGEMENT
# =============================================================================

# Install plugin
mise plugins install poetry
mise plugins install https://github.com/mise-plugins/mise-poetry.git

# List plugins
mise plugins ls

# Update plugins
mise plugins update
mise plugins update node

# =============================================================================
# DEBUGGING AND TROUBLESHOOTING
# =============================================================================

# Enable debug mode
export MISE_DEBUG=1
mise install node@22

# Check mise status
mise doctor

# Verify tool installation
mise ls node
which node
node --version

# Check PATH
mise path

# Validate configuration
mise config validate