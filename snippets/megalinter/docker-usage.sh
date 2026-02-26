#!/bin/bash
# MegaLinter Docker Usage Examples

# === Basic Docker Commands ===

# Run MegaLinter with default configuration
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter:latest

# Run with specific flavor for better performance
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter-javascript:latest
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter-python:latest
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter-go:latest

# === Environment Variables ===

# Basic environment configuration
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e DEFAULT_BRANCH=main \
  -e APPLY_FIXES=all \
  -e SHOW_ELAPSED_TIME=true \
  -e PARALLEL=true \
  oxsecurity/megalinter:latest

# Enable specific linters only
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e ENABLE_LINTERS=JAVASCRIPT_ES,TYPESCRIPT_ES,JSON_JSONLINT \
  -e APPLY_FIXES=all \
  oxsecurity/megalinter-javascript:latest

# Disable problematic linters
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e DISABLE_LINTERS=SPELL_CSPELL,COPYPASTE_JSCPD \
  oxsecurity/megalinter:latest

# === File Filtering ===

# Include only specific directories
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e FILTER_REGEX_INCLUDE="(src/|lib/|scripts/)" \
  oxsecurity/megalinter:latest

# Exclude common directories
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e FILTER_REGEX_EXCLUDE="(node_modules/|\\.git/|dist/|build/)" \
  oxsecurity/megalinter:latest

# Language-specific filtering
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e JAVASCRIPT_FILTER_REGEX_EXCLUDE="(test/|spec/|__tests__/)" \
  -e PYTHON_FILTER_REGEX_EXCLUDE="(test_|tests/)" \
  oxsecurity/megalinter:latest

# === Reporter Configuration ===

# Enable multiple reporters
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e REPORTERS=console,json,sarif,html \
  -e FILEIO_REPORTER=true \
  -e REPORT_OUTPUT_FOLDER=reports \
  oxsecurity/megalinter:latest

# Custom report filenames
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e JSON_REPORTER=true \
  -e SARIF_REPORTER=true \
  -e JSON_REPORTER_FILE_NAME=megalinter-report.json \
  -e SARIF_REPORTER_FILE_NAME=megalinter-report.sarif \
  oxsecurity/megalinter:latest

# === Configuration File Mounting ===

# Mount custom configuration
docker run --rm \
  -v $(pwd):/tmp/lint \
  -v $(pwd)/.mega-linter.yml:/tmp/lint/.mega-linter.yml \
  oxsecurity/megalinter:latest

# Mount linter-specific configs
docker run --rm \
  -v $(pwd):/tmp/lint \
  -v $(pwd)/.eslintrc.json:/tmp/lint/.eslintrc.json \
  -v $(pwd)/.prettierrc.json:/tmp/lint/.prettierrc.json \
  -e JAVASCRIPT_ES_CONFIG_FILE=.eslintrc.json \
  -e JAVASCRIPT_PRETTIER_CONFIG_FILE=.prettierrc.json \
  oxsecurity/megalinter-javascript:latest

# === Auto-Fix Examples ===

# Apply all available fixes
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e APPLY_FIXES=all \
  oxsecurity/megalinter:latest

# Apply fixes for specific linters
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e APPLY_FIXES=JAVASCRIPT_PRETTIER,PYTHON_BLACK,GO_GOFMT \
  oxsecurity/megalinter:latest

# Conditional auto-fix (only for specific file types)
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e APPLY_FIXES=all \
  -e FILTER_REGEX_INCLUDE="\\.(js|ts|py|go)$" \
  oxsecurity/megalinter:latest

# === Security-Focused Usage ===

# Run security linters only
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e ENABLE_LINTERS=REPOSITORY_TRUFFLEHOG,REPOSITORY_SEMGREP,PYTHON_BANDIT \
  -e SARIF_REPORTER=true \
  oxsecurity/megalinter:latest

# Comprehensive security scan
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e ENABLE_LINTERS=REPOSITORY_TRUFFLEHOG,REPOSITORY_SEMGREP,DOCKERFILE_HADOLINT,PYTHON_BANDIT \
  -e REPOSITORY_TRUFFLEHOG_ARGUMENTS="--exclude-paths .trufflehogignore" \
  -e REPOSITORY_SEMGREP_ARGUMENTS="--config=auto" \
  -e SARIF_REPORTER=true \
  oxsecurity/megalinter:latest

# === Performance Optimization ===

# Parallel execution with timing
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e PARALLEL=true \
  -e SHOW_ELAPSED_TIME=true \
  -e LOG_LEVEL=INFO \
  oxsecurity/megalinter:latest

# Resource constraints
docker run --rm \
  --memory=4g \
  --cpus=2 \
  -v $(pwd):/tmp/lint \
  -e PARALLEL=true \
  oxsecurity/megalinter:latest

# === CI/CD Integration Examples ===

# Jenkins Pipeline
docker run --rm \
  -v ${WORKSPACE}:/tmp/lint \
  -e DEFAULT_BRANCH=${env.BRANCH_NAME} \
  -e BUILD_NUMBER=${BUILD_NUMBER} \
  -e FILEIO_REPORTER=true \
  -e JSON_REPORTER=true \
  oxsecurity/megalinter:latest

# GitLab CI
docker run --rm \
  -v ${CI_PROJECT_DIR}:/tmp/lint \
  -e DEFAULT_BRANCH=${CI_DEFAULT_BRANCH} \
  -e CI_PROJECT_NAME=${CI_PROJECT_NAME} \
  -e GITLAB_ACCESS_TOKEN=${GITLAB_ACCESS_TOKEN} \
  oxsecurity/megalinter:latest

# Azure DevOps
docker run --rm \
  -v $(Build.SourcesDirectory):/tmp/lint \
  -e DEFAULT_BRANCH=$(Build.SourceBranch) \
  -e BUILD_BUILDNUMBER=$(Build.BuildNumber) \
  -e SYSTEM_ACCESSTOKEN=$(System.AccessToken) \
  oxsecurity/megalinter:latest

# === Language-Specific Examples ===

# JavaScript/TypeScript project
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e JAVASCRIPT_ES_CONFIG_FILE=.eslintrc.json \
  -e TYPESCRIPT_ES_CONFIG_FILE=.eslintrc.json \
  -e JAVASCRIPT_PRETTIER_CONFIG_FILE=.prettierrc.json \
  -e APPLY_FIXES=JAVASCRIPT_PRETTIER,TYPESCRIPT_PRETTIER \
  oxsecurity/megalinter-javascript:latest

# Python project
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e PYTHON_BLACK_CONFIG_FILE=pyproject.toml \
  -e PYTHON_PYLINT_CONFIG_FILE=.pylintrc \
  -e PYTHON_FLAKE8_CONFIG_FILE=setup.cfg \
  -e APPLY_FIXES=PYTHON_BLACK \
  oxsecurity/megalinter-python:latest

# Go project
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e GO_GOLANGCI_LINT_CONFIG_FILE=.golangci.yml \
  -e APPLY_FIXES=GO_GOFMT \
  oxsecurity/megalinter-go:latest

# === Multi-Stage Pipeline ===

# Stage 1: Fast linting (syntax and basic issues)
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e ENABLE_LINTERS=JAVASCRIPT_ES,PYTHON_PYLINT,GO_GOLANGCI_LINT \
  -e PARALLEL=true \
  --name fast-lint \
  oxsecurity/megalinter:latest

# Stage 2: Security scan (if fast linting passes)
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e ENABLE_LINTERS=REPOSITORY_TRUFFLEHOG,REPOSITORY_SEMGREP \
  -e SARIF_REPORTER=true \
  --name security-scan \
  oxsecurity/megalinter:latest

# Stage 3: Full analysis (comprehensive linting)
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e APPLY_FIXES=all \
  -e REPORTERS=console,json,html \
  --name full-analysis \
  oxsecurity/megalinter:latest

# === Custom Wrapper Scripts ===

# Development script
cat > megalinter-dev.sh << 'EOF'
#!/bin/bash
set -e

echo "Running MegaLinter in development mode..."

docker run --rm \
  -v $(pwd):/tmp/lint \
  -e APPLY_FIXES=all \
  -e SHOW_ELAPSED_TIME=true \
  -e PARALLEL=true \
  -e LOG_LEVEL=INFO \
  -e FILTER_REGEX_EXCLUDE="(node_modules/|\\.git/|dist/|build/)" \
  oxsecurity/megalinter-javascript:latest

echo "MegaLinter completed!"
EOF

chmod +x megalinter-dev.sh

# Production script
cat > megalinter-prod.sh << 'EOF'
#!/bin/bash
set -e

echo "Running MegaLinter in production mode..."

docker run --rm \
  -v $(pwd):/tmp/lint \
  -e APPLY_FIXES=none \
  -e DISABLE_ERRORS=false \
  -e REPORTERS=console,json,sarif \
  -e FILEIO_REPORTER=true \
  -e PARALLEL=true \
  oxsecurity/megalinter:latest

if [ $? -eq 0 ]; then
  echo "✅ All checks passed!"
else
  echo "❌ Linting failed!"
  exit 1
fi
EOF

chmod +x megalinter-prod.sh

# === Debugging and Troubleshooting ===

# Debug mode with verbose output
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e LOG_LEVEL=DEBUG \
  -e SHOW_ELAPSED_TIME=true \
  -e SHOW_SKIPPED_LINTERS=true \
  oxsecurity/megalinter:latest

# Test specific linter
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e ENABLE_LINTERS=JAVASCRIPT_ES \
  -e LOG_LEVEL=DEBUG \
  -e JAVASCRIPT_ES_ARGUMENTS="--debug" \
  oxsecurity/megalinter-javascript:latest

# Interactive debugging (keep container running)
docker run -it \
  -v $(pwd):/tmp/lint \
  --entrypoint /bin/bash \
  oxsecurity/megalinter:latest

# === Docker Compose Integration ===

cat > docker-compose.megalinter.yml << 'EOF'
version: '3.8'

services:
  megalinter:
    image: oxsecurity/megalinter:latest
    volumes:
      - .:/tmp/lint
      - ./reports:/tmp/lint/megalinter-reports
    environment:
      - DEFAULT_BRANCH=main
      - APPLY_FIXES=all
      - PARALLEL=true
      - FILEIO_REPORTER=true
      - REPORTERS=console,json,html
    networks:
      - lint-network

  megalinter-js:
    image: oxsecurity/megalinter-javascript:latest
    volumes:
      - .:/tmp/lint
    environment:
      - APPLY_FIXES=all
      - JAVASCRIPT_ES_CONFIG_FILE=.eslintrc.json
    networks:
      - lint-network

networks:
  lint-network:
    driver: bridge
EOF

# Run with Docker Compose
docker-compose -f docker-compose.megalinter.yml run --rm megalinter