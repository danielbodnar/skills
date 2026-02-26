#!/bin/bash
# Lifecycle Hooks Examples for mise

# =============================================================================
# ENTER HOOK EXAMPLES
# =============================================================================

# Basic enter hook (mise.toml)
# [hooks]
# enter = "echo 'Welcome to {{ config_root | basename }}'"

# Advanced enter hook
enter_hook() {
    echo "🚀 Entering project: $(basename "$PWD")"
    
    # Check if tools are installed
    if ! mise install --quiet; then
        echo "⚠️  Some tools need to be installed. Run 'mise install'"
    fi
    
    # Show project status
    echo "📦 Tools:"
    mise ls --current
    
    # Show environment
    echo "🌍 Environment: ${NODE_ENV:-development}"
    
    # Check for updates
    if [[ -f package.json ]] && [[ ! -d node_modules ]]; then
        echo "💡 Run 'npm install' to install dependencies"
    fi
    
    # Show available tasks
    echo "🎯 Available tasks:"
    mise tasks --no-header | head -5
}

# =============================================================================
# LEAVE HOOK EXAMPLES
# =============================================================================

# Basic leave hook (mise.toml)
# [hooks]
# leave = "echo 'Goodbye from {{ config_root | basename }}'"

# Advanced leave hook
leave_hook() {
    echo "👋 Leaving project: $(basename "$PWD")"
    
    # Cleanup temporary files
    find . -name "*.tmp" -delete 2>/dev/null || true
    
    # Show resource usage
    if command -v ps >/dev/null; then
        local mem_usage=$(ps -o pid,rss,comm -p $$ | tail -1 | awk '{print $2}')
        echo "📊 Memory usage: ${mem_usage}KB"
    fi
}

# =============================================================================
# POSTINSTALL HOOK EXAMPLES
# =============================================================================

# Basic postinstall hook (mise.toml)
# [hooks]
# postinstall = "npm install"

# Advanced postinstall hook
postinstall_hook() {
    echo "📦 Post-install setup for $(basename "$PWD")"
    
    # Install dependencies based on project type
    if [[ -f package.json ]]; then
        echo "Installing Node.js dependencies..."
        if command -v bun >/dev/null; then
            bun install
        else
            npm install
        fi
    fi
    
    if [[ -f requirements.txt ]]; then
        echo "Installing Python dependencies..."
        pip install -r requirements.txt
    fi
    
    if [[ -f Cargo.toml ]]; then
        echo "Installing Rust dependencies..."
        cargo fetch
    fi
    
    if [[ -f go.mod ]]; then
        echo "Installing Go dependencies..."
        go mod download
    fi
    
    # Setup development environment
    if [[ -f .env.example ]] && [[ ! -f .env ]]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
    fi
    
    # Create necessary directories
    mkdir -p logs tmp cache
    
    echo "✅ Post-install setup complete"
}

# =============================================================================
# PREINSTALL HOOK EXAMPLES
# =============================================================================

preinstall_hook() {
    echo "🔧 Pre-install setup for $(basename "$PWD")"
    
    # Check system requirements
    if [[ -f .tool-versions ]] || [[ -f mise.toml ]]; then
        echo "Validating tool requirements..."
        
        # Check disk space
        local available_space=$(df . | tail -1 | awk '{print $4}')
        if [[ $available_space -lt 1000000 ]]; then
            echo "⚠️  Warning: Less than 1GB disk space available"
        fi
        
        # Check internet connectivity
        if ! ping -c 1 google.com >/dev/null 2>&1; then
            echo "⚠️  Warning: No internet connectivity detected"
        fi
    fi
}

# =============================================================================
# CONDITIONAL HOOKS
# =============================================================================

# Environment-specific hooks
development_enter_hook() {
    if [[ "${NODE_ENV:-development}" == "development" ]]; then
        echo "🔧 Development mode activated"
        echo "Debug mode: ${DEBUG:-false}"
        
        # Start development services
        if [[ -f docker-compose.dev.yml ]]; then
            echo "Starting development services..."
            docker-compose -f docker-compose.dev.yml up -d
        fi
    fi
}

production_enter_hook() {
    if [[ "${NODE_ENV}" == "production" ]]; then
        echo "🚀 Production mode - be careful!"
        echo "Ensure all tests pass before deploying"
        
        # Security checks
        if [[ -f .env ]] && grep -q "SECRET" .env; then
            echo "⚠️  Secrets detected in .env file"
        fi
    fi
}

# =============================================================================
# GIT HOOKS INTEGRATION
# =============================================================================

# Pre-commit hook integration
pre_commit_hook() {
    echo "🔍 Running pre-commit checks..."
    
    # Run linting
    if command -v mise >/dev/null && mise tasks --json | jq -r '.[].name' | grep -q "lint"; then
        mise run lint
    fi
    
    # Run tests
    if command -v mise >/dev/null && mise tasks --json | jq -r '.[].name' | grep -q "test"; then
        mise run test
    fi
    
    # Check for large files
    local large_files=$(find . -name "*.js" -o -name "*.ts" -o -name "*.py" | xargs wc -l | awk '$1 > 1000 {print $2}')
    if [[ -n "$large_files" ]]; then
        echo "⚠️  Large files detected: $large_files"
    fi
}

# =============================================================================
# NOTIFICATION HOOKS
# =============================================================================

# Desktop notification hook (macOS)
notify_macos() {
    local message="$1"
    local title="${2:-Mise Hook}"
    
    if command -v osascript >/dev/null; then
        osascript -e "display notification \"$message\" with title \"$title\""
    fi
}

# Desktop notification hook (Linux)
notify_linux() {
    local message="$1"
    local title="${2:-Mise Hook}"
    
    if command -v notify-send >/dev/null; then
        notify-send "$title" "$message"
    fi
}

# Slack notification hook
notify_slack() {
    local message="$1"
    local webhook_url="$SLACK_WEBHOOK_URL"
    
    if [[ -n "$webhook_url" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$webhook_url"
    fi
}

# =============================================================================
# ERROR HANDLING HOOKS
# =============================================================================

# Error handling in hooks
safe_hook() {
    local hook_name="$1"
    shift
    
    echo "Running $hook_name hook..."
    
    if "$@"; then
        echo "✅ $hook_name hook completed successfully"
    else
        echo "❌ $hook_name hook failed"
        return 1
    fi
}

# Timeout for long-running hooks
timeout_hook() {
    local timeout_seconds="$1"
    local hook_name="$2"
    shift 2
    
    if command -v timeout >/dev/null; then
        timeout "$timeout_seconds" "$@" || {
            echo "⏰ $hook_name hook timed out after ${timeout_seconds}s"
            return 1
        }
    else
        "$@"
    fi
}

# =============================================================================
# USAGE EXAMPLES IN MISE.TOML
# =============================================================================

# Example configuration for mise.toml:
cat << 'EOF'
[hooks]
enter = '''
echo "🚀 Welcome to $(basename "$PWD")"
if [[ ! -d node_modules ]] && [[ -f package.json ]]; then
  echo "💡 Run 'bun install' to install dependencies"
fi
mise ls --current
'''

leave = '''
echo "👋 Goodbye from $(basename "$PWD")"
# Cleanup temporary files
find . -name "*.tmp" -delete 2>/dev/null || true
'''

postinstall = '''
echo "📦 Setting up development environment..."
if [[ -f package.json ]]; then
  bun install
fi
if [[ -f .env.example ]] && [[ ! -f .env ]]; then
  cp .env.example .env
fi
mkdir -p logs tmp
echo "✅ Setup complete"
'''
EOF