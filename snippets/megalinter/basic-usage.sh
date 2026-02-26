#!/bin/bash
# MegaLinter Basic Usage Examples

# === Installation ===

# Install globally with npm
npm install mega-linter-runner -g

# Install locally in project
npm install mega-linter-runner --save-dev

# Run with npx (no installation needed)
npx mega-linter-runner

# === Basic Execution ===

# Run MegaLinter on current directory
mega-linter-runner

# Run with specific flavor for faster execution
mega-linter-runner --flavor javascript
mega-linter-runner --flavor python
mega-linter-runner --flavor go

# Install MegaLinter configuration interactively
npx mega-linter-runner --install

# === Docker Usage ===

# Run MegaLinter with Docker (all linters)
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter:latest

# Run with JavaScript flavor
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter-javascript:latest

# Run with Python flavor
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter-python:latest

# Run with environment variables
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e DEFAULT_BRANCH=main \
  -e APPLY_FIXES=all \
  -e SHOW_ELAPSED_TIME=true \
  oxsecurity/megalinter:latest

# === Flavor-Specific Examples ===

# JavaScript/TypeScript projects
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e JAVASCRIPT_ES_CONFIG_FILE=.eslintrc.json \
  -e TYPESCRIPT_ES_CONFIG_FILE=.eslintrc.json \
  oxsecurity/megalinter-javascript:latest

# Python projects
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e PYTHON_BLACK_CONFIG_FILE=pyproject.toml \
  -e PYTHON_PYLINT_CONFIG_FILE=.pylintrc \
  oxsecurity/megalinter-python:latest

# Go projects
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e GO_GOLANGCI_LINT_CONFIG_FILE=.golangci.yml \
  oxsecurity/megalinter-go:latest

# === Output Control ===

# Save reports to specific directory
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e REPORT_OUTPUT_FOLDER=reports \
  -e FILEIO_REPORTER=true \
  oxsecurity/megalinter:latest

# Enable specific reporters
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e JSON_REPORTER=true \
  -e SARIF_REPORTER=true \
  -e HTML_REPORTER=true \
  oxsecurity/megalinter:latest

# === File Filtering ===

# Include only specific directories
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e FILTER_REGEX_INCLUDE="(src/|lib/)" \
  oxsecurity/megalinter:latest

# Exclude specific directories
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e FILTER_REGEX_EXCLUDE="(node_modules/|\.git/|dist/)" \
  oxsecurity/megalinter:latest

# === Auto-Fix Examples ===

# Apply all available fixes
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e APPLY_FIXES=all \
  oxsecurity/megalinter:latest

# Apply fixes for specific linters only
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e APPLY_FIXES=JAVASCRIPT_PRETTIER,PYTHON_BLACK \
  oxsecurity/megalinter:latest

# === Performance Optimization ===

# Run linters in parallel
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e PARALLEL=true \
  -e SHOW_ELAPSED_TIME=true \
  oxsecurity/megalinter:latest

# Use specific linters only
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e ENABLE_LINTERS=JAVASCRIPT_ES,TYPESCRIPT_ES,JSON_JSONLINT \
  oxsecurity/megalinter:latest

# === Local Development Workflow ===

# Create initial configuration
npx mega-linter-runner --install

# Run linting with fixes
mega-linter-runner --fix

# Run specific flavor
mega-linter-runner --flavor javascript --fix

# Validate configuration
mega-linter-runner --validate-config

# === Troubleshooting ===

# Run with debug output
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e LOG_LEVEL=DEBUG \
  -e SHOW_ELAPSED_TIME=true \
  oxsecurity/megalinter:latest

# Test specific linter
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e ENABLE_LINTERS=JAVASCRIPT_ES \
  -e LOG_LEVEL=DEBUG \
  oxsecurity/megalinter:latest

# Check linter versions
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e SHOW_SKIPPED_LINTERS=true \
  oxsecurity/megalinter:latest