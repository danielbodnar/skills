#!/bin/bash
# Debugging and Troubleshooting Guide for mise

# =============================================================================
# BASIC DEBUGGING COMMANDS
# =============================================================================

# Check mise installation and health
mise_health_check() {
    echo "🔍 Mise Health Check"
    echo "==================="
    
    # Check if mise is installed
    if ! command -v mise >/dev/null 2>&1; then
        echo "❌ mise is not installed or not in PATH"
        return 1
    fi
    
    # Show version
    echo "📦 Mise version: $(mise --version)"
    
    # Run doctor command
    echo -e "\n🩺 Running mise doctor..."
    mise doctor
    
    # Check configuration files
    echo -e "\n📋 Configuration files:"
    mise config ls
    
    # Check activated status
    echo -e "\n🔄 Shell activation status:"
    if [[ -n "$MISE_SHELL" ]]; then
        echo "✅ Mise is activated (shell: $MISE_SHELL)"
    else
        echo "⚠️  Mise may not be activated in current shell"
    fi
}

# Enable debug mode
enable_debug() {
    export MISE_DEBUG=1
    export MISE_VERBOSE=1
    export RUST_LOG=debug
    echo "🐛 Debug mode enabled"
    echo "Environment variables set:"
    echo "  MISE_DEBUG=$MISE_DEBUG"
    echo "  MISE_VERBOSE=$MISE_VERBOSE" 
    echo "  RUST_LOG=$RUST_LOG"
}

# Disable debug mode
disable_debug() {
    unset MISE_DEBUG
    unset MISE_VERBOSE
    unset RUST_LOG
    echo "✅ Debug mode disabled"
}

# =============================================================================
# TOOL INSTALLATION DEBUGGING
# =============================================================================

# Debug tool installation
debug_tool_install() {
    local tool="$1"
    local version="${2:-latest}"
    
    echo "🔧 Debugging installation of $tool@$version"
    echo "============================================"
    
    # Show available versions
    echo "📦 Available versions for $tool:"
    mise ls-remote "$tool" | head -10
    
    # Check if tool is already installed
    echo -e "\n📋 Currently installed versions:"
    mise ls "$tool" 2>/dev/null || echo "No versions installed"
    
    # Attempt installation with debug output
    echo -e "\n🚀 Installing $tool@$version with debug output..."
    MISE_DEBUG=1 mise install "$tool@$version"
    
    # Verify installation
    echo -e "\n✅ Verification:"
    if mise where "$tool@$version" >/dev/null 2>&1; then
        echo "Installation successful!"
        echo "Location: $(mise where "$tool@$version")"
        echo "Binary: $(mise where "$tool@$version")/bin/$tool"
    else
        echo "❌ Installation failed or not found"
    fi
}

# Check tool binary and environment
debug_tool_binary() {
    local tool="$1"
    
    echo "🔍 Debugging $tool binary"
    echo "========================="
    
    # Check if tool is installed via mise
    if mise ls "$tool" >/dev/null 2>&1; then
        echo "✅ $tool is installed via mise"
        echo "Installed versions:"
        mise ls "$tool"
        
        # Show current active version
        local active_version=$(mise current "$tool" 2>/dev/null || echo "none")
        echo "Active version: $active_version"
        
        # Show installation path
        if [[ "$active_version" != "none" ]]; then
            echo "Installation path: $(mise where "$tool")"
        fi
    else
        echo "❌ $tool is not installed via mise"
    fi
    
    # Check if binary is in PATH
    echo -e "\n🔍 Checking PATH..."
    if command -v "$tool" >/dev/null 2>&1; then
        echo "✅ $tool found in PATH"
        echo "Location: $(which "$tool")"
        echo "Version: $("$tool" --version 2>/dev/null || echo "Version command failed")"
    else
        echo "❌ $tool not found in PATH"
    fi
    
    # Show PATH entries from mise
    echo -e "\n📂 Mise PATH entries:"
    mise path
}

# =============================================================================
# ENVIRONMENT DEBUGGING
# =============================================================================

# Debug environment variables
debug_environment() {
    echo "🌍 Environment Debugging"
    echo "======================="
    
    # Show current environment from mise
    echo "📋 Current mise environment:"
    mise env
    
    # Show mise-managed environment variables
    echo -e "\n🔧 Mise-managed variables:"
    env | grep -E "^(MISE_|NODE_|PYTHON_|RUBY_|GO)" | sort
    
    # Show PATH
    echo -e "\n📂 Current PATH:"
    echo "$PATH" | tr ':' '\n' | nl
    
    # Show mise data directories
    echo -e "\n📁 Mise directories:"
    echo "Data dir: ${MISE_DATA_DIR:-$HOME/.local/share/mise}"
    echo "Config dir: ${MISE_CONFIG_DIR:-$HOME/.config/mise}"
    echo "Cache dir: ${MISE_CACHE_DIR:-$HOME/.cache/mise}"
    
    # Check directory permissions
    echo -e "\n🔐 Directory permissions:"
    for dir in "${MISE_DATA_DIR:-$HOME/.local/share/mise}" "${MISE_CONFIG_DIR:-$HOME/.config/mise}"; do
        if [[ -d "$dir" ]]; then
            echo "$dir: $(ls -ld "$dir" | awk '{print $1, $3, $4}')"
        else
            echo "$dir: does not exist"
        fi
    done
}

# Debug specific environment variable
debug_env_var() {
    local var_name="$1"
    
    echo "🔍 Debugging environment variable: $var_name"
    echo "============================================"
    
    # Show current value
    local current_value="${!var_name}"
    if [[ -n "$current_value" ]]; then
        echo "✅ Current value: $current_value"
    else
        echo "❌ Variable is not set or empty"
    fi
    
    # Check if set by mise
    if mise env | grep -q "^export $var_name="; then
        echo "✅ Variable is managed by mise"
        local mise_value=$(mise env | grep "^export $var_name=" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
        echo "Mise value: $mise_value"
    else
        echo "⚠️  Variable is not managed by mise"
    fi
    
    # Check configuration files
    echo -e "\n📋 Checking configuration files..."
    local config_files=(
        "$PWD/mise.toml"
        "$PWD/.mise.toml"
        "$HOME/.config/mise/config.toml"
        "/etc/mise/config.toml"
    )
    
    for config_file in "${config_files[@]}"; do
        if [[ -f "$config_file" ]] && grep -q "$var_name" "$config_file"; then
            echo "Found in $config_file:"
            grep -n "$var_name" "$config_file"
        fi
    done
}

# =============================================================================
# TASK DEBUGGING
# =============================================================================

# Debug task execution
debug_task() {
    local task_name="$1"
    
    echo "🎯 Debugging task: $task_name"
    echo "============================="
    
    # Check if task exists
    if ! mise tasks --json | jq -r '.[].name' | grep -q "^$task_name$"; then
        echo "❌ Task '$task_name' not found"
        echo -e "\n📋 Available tasks:"
        mise tasks
        return 1
    fi
    
    # Show task details
    echo "📋 Task details:"
    mise tasks --json | jq ".[] | select(.name == \"$task_name\")"
    
    # Show task dependencies
    echo -e "\n🔗 Task dependencies:"
    mise tasks deps "$task_name" 2>/dev/null || echo "No dependencies or deps command failed"
    
    # Run task with debug output
    echo -e "\n🚀 Running task with debug output..."
    MISE_DEBUG=1 mise run "$task_name" --verbose
}

# List all tasks with details
debug_all_tasks() {
    echo "🎯 All Tasks Debug Information"
    echo "============================="
    
    # Show raw task configuration
    echo "📋 Raw task configuration:"
    mise tasks --json | jq '.'
    
    # Show task dependency graph
    echo -e "\n🔗 Task dependency graph:"
    mise tasks deps 2>/dev/null || echo "Dependencies command failed"
    
    # Check for task files
    echo -e "\n📁 Task files:"
    local task_dirs=(
        "$PWD/.mise/tasks"
        "$PWD/mise/tasks"
        "$PWD/tasks"
    )
    
    for task_dir in "${task_dirs[@]}"; do
        if [[ -d "$task_dir" ]]; then
            echo "Found task directory: $task_dir"
            find "$task_dir" -type f -executable | head -10
        fi
    done
}

# =============================================================================
# CONFIGURATION DEBUGGING
# =============================================================================

# Debug configuration loading
debug_config() {
    echo "⚙️  Configuration Debugging"
    echo "=========================="
    
    # Show configuration hierarchy
    echo "📋 Configuration files (in order of precedence):"
    mise config ls
    
    # Show current working directory config
    echo -e "\n📄 Current directory configuration:"
    local config_files=("mise.toml" ".mise.toml" ".tool-versions")
    for config_file in "${config_files[@]}"; do
        if [[ -f "$config_file" ]]; then
            echo "Found: $config_file"
            echo "Content:"
            cat "$config_file" | head -20
            echo "---"
        fi
    done
    
    # Show global configuration
    echo -e "\n🌍 Global configuration:"
    local global_config="$HOME/.config/mise/config.toml"
    if [[ -f "$global_config" ]]; then
        echo "Found: $global_config"
        echo "Content:"
        cat "$global_config" | head -20
    else
        echo "No global configuration found"
    fi
    
    # Validate configuration
    echo -e "\n✅ Configuration validation:"
    mise config validate 2>&1 || echo "Validation failed or not supported"
}

# Debug specific configuration key
debug_config_key() {
    local key="$1"
    
    echo "🔍 Debugging configuration key: $key"
    echo "===================================="
    
    # Search in all config files
    local config_files=(
        "$PWD/mise.toml"
        "$PWD/.mise.toml"
        "$PWD/.tool-versions"
        "$HOME/.config/mise/config.toml"
        "/etc/mise/config.toml"
    )
    
    for config_file in "${config_files[@]}"; do
        if [[ -f "$config_file" ]]; then
            echo "Checking $config_file:"
            grep -n "$key" "$config_file" 2>/dev/null || echo "  Not found"
        fi
    done
}

# =============================================================================
# PERFORMANCE DEBUGGING
# =============================================================================

# Measure mise performance
debug_performance() {
    echo "⚡ Performance Debugging"
    echo "======================"
    
    # Measure mise activation time
    echo "🕐 Measuring mise activation time..."
    time mise env >/dev/null
    
    # Measure tool resolution time
    echo -e "\n🕐 Measuring tool resolution time..."
    time mise ls >/dev/null
    
    # Check for large directories
    echo -e "\n📁 Checking for large directories..."
    local mise_data_dir="${MISE_DATA_DIR:-$HOME/.local/share/mise}"
    if [[ -d "$mise_data_dir" ]]; then
        echo "Mise data directory size:"
        du -sh "$mise_data_dir"
        echo "Largest subdirectories:"
        du -sh "$mise_data_dir"/* 2>/dev/null | sort -hr | head -5
    fi
    
    # Check cache size
    local mise_cache_dir="${MISE_CACHE_DIR:-$HOME/.cache/mise}"
    if [[ -d "$mise_cache_dir" ]]; then
        echo -e "\nCache directory size:"
        du -sh "$mise_cache_dir"
    fi
}

# =============================================================================
# PLUGIN DEBUGGING
# =============================================================================

# Debug plugin issues
debug_plugins() {
    echo "🔌 Plugin Debugging"
    echo "=================="
    
    # List installed plugins
    echo "📋 Installed plugins:"
    mise plugins ls 2>/dev/null || echo "Plugin listing failed"
    
    # Check plugin directories
    echo -e "\n📁 Plugin directories:"
    local plugin_dir="${MISE_DATA_DIR:-$HOME/.local/share/mise}/plugins"
    if [[ -d "$plugin_dir" ]]; then
        ls -la "$plugin_dir"
    else
        echo "Plugin directory not found: $plugin_dir"
    fi
    
    # Update plugins
    echo -e "\n🔄 Updating plugins..."
    mise plugins update 2>&1 || echo "Plugin update failed"
}

# =============================================================================
# COMMON ISSUES AND SOLUTIONS
# =============================================================================

# Common issue: mise not found
fix_mise_not_found() {
    echo "🔧 Fixing 'mise not found' issue"
    echo "================================"
    
    # Check installation
    if [[ ! -f "$HOME/.local/bin/mise" ]]; then
        echo "❌ mise binary not found. Installing..."
        curl https://mise.run | sh
    else
        echo "✅ mise binary found at $HOME/.local/bin/mise"
    fi
    
    # Check PATH
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo "⚠️  $HOME/.local/bin not in PATH"
        echo "Add this to your shell config:"
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
    else
        echo "✅ $HOME/.local/bin is in PATH"
    fi
    
    # Check shell activation
    local shell_config=""
    case "$SHELL" in
        */bash) shell_config="$HOME/.bashrc" ;;
        */zsh) shell_config="$HOME/.zshrc" ;;
        */fish) shell_config="$HOME/.config/fish/config.fish" ;;
    esac
    
    if [[ -n "$shell_config" ]] && [[ -f "$shell_config" ]]; then
        if ! grep -q "mise activate" "$shell_config"; then
            echo "⚠️  mise activation not found in $shell_config"
            echo "Add this line:"
            case "$SHELL" in
                */fish) echo "mise activate fish | source" ;;
                *) echo "eval \"\$(mise activate \$(basename \$SHELL))\"" ;;
            esac
        else
            echo "✅ mise activation found in $shell_config"
        fi
    fi
}

# Common issue: tools not found
fix_tools_not_found() {
    echo "🔧 Fixing 'tools not found' issue"
    echo "================================="
    
    # Check if mise is activated
    if [[ -z "$MISE_SHELL" ]]; then
        echo "❌ mise is not activated in current shell"
        echo "Run: eval \"\$(mise activate \$(basename \$SHELL))\""
        return 1
    fi
    
    # Install missing tools
    echo "📦 Installing tools from configuration..."
    mise install
    
    # Check shims
    local shims_dir="${MISE_DATA_DIR:-$HOME/.local/share/mise}/shims"
    if [[ -d "$shims_dir" ]]; then
        echo "✅ Shims directory exists: $shims_dir"
        echo "Shims count: $(ls "$shims_dir" | wc -l)"
    else
        echo "❌ Shims directory not found"
        echo "Run: mise reshim"
    fi
}

# =============================================================================
# MAIN DEBUGGING FUNCTION
# =============================================================================

# Main debugging function
mise_debug() {
    local action="${1:-all}"
    
    case "$action" in
        "health"|"check")
            mise_health_check
            ;;
        "tool")
            debug_tool_install "$2" "$3"
            ;;
        "env"|"environment")
            debug_environment
            ;;
        "task")
            debug_task "$2"
            ;;
        "config"|"configuration")
            debug_config
            ;;
        "performance"|"perf")
            debug_performance
            ;;
        "plugins")
            debug_plugins
            ;;
        "fix-not-found")
            fix_mise_not_found
            ;;
        "fix-tools")
            fix_tools_not_found
            ;;
        "all"|*)
            echo "🔍 Complete Mise Debugging Report"
            echo "================================="
            mise_health_check
            echo -e "\n"
            debug_environment
            echo -e "\n"
            debug_config
            ;;
    esac
}

# Usage information
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Usage: $0 [action]"
    echo "Actions:"
    echo "  health          - Check mise health"
    echo "  tool <name>     - Debug tool installation"
    echo "  env             - Debug environment"
    echo "  task <name>     - Debug task execution"
    echo "  config          - Debug configuration"
    echo "  performance     - Check performance"
    echo "  plugins         - Debug plugins"
    echo "  fix-not-found   - Fix 'mise not found' issues"
    echo "  fix-tools       - Fix 'tools not found' issues"
    echo "  all             - Run all debugging checks"
fi