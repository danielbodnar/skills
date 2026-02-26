#!/bin/bash
# TruffleHog Pre-commit Hooks Configuration
# Various methods to set up TruffleHog as pre-commit hooks

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if TruffleHog is installed
check_trufflehog() {
    if ! command -v trufflehog &> /dev/null; then
        echo -e "${RED}TruffleHog is not installed. Please install it first.${NC}"
        echo "Installation options:"
        echo "  - macOS: brew install trufflehog"
        echo "  - Script: curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin"
        return 1
    fi
    echo -e "${GREEN}✓ TruffleHog is installed: $(trufflehog --version)${NC}"
    return 0
}

# Method 1: Global Git hooks using core.hooksPath
setup_global_git_hooks() {
    echo -e "${BLUE}Setting up global Git hooks...${NC}"
    
    local hooks_dir="$HOME/.git-hooks"
    local pre_commit_hook="$hooks_dir/pre-commit"
    
    # Create hooks directory
    mkdir -p "$hooks_dir"
    
    # Create pre-commit hook
    cat > "$pre_commit_hook" << 'EOF'
#!/bin/sh
# TruffleHog pre-commit hook for secret detection

echo "🔍 Running TruffleHog secret scan..."

# Run TruffleHog on staged changes
trufflehog git file://. --since-commit HEAD --results=verified,unknown --fail

if [ $? -eq 183 ]; then
    echo "🚨 Secrets detected! Commit blocked."
    echo "Please remove the secrets and try again."
    echo "To skip this check (NOT RECOMMENDED): git commit --no-verify"
    exit 1
fi

echo "✅ No secrets detected. Proceeding with commit."
EOF
    
    # Make hook executable
    chmod +x "$pre_commit_hook"
    
    # Configure Git to use global hooks
    git config --global core.hooksPath "$hooks_dir"
    
    echo -e "${GREEN}✓ Global Git hooks configured at $hooks_dir${NC}"
    echo -e "${YELLOW}This will apply to all Git repositories on your system${NC}"
}

# Method 2: Repository-specific Git hook
setup_repo_git_hook() {
    echo -e "${BLUE}Setting up repository-specific Git hook...${NC}"
    
    if [ ! -d ".git" ]; then
        echo -e "${RED}Error: Not in a Git repository${NC}"
        return 1
    fi
    
    local pre_commit_hook=".git/hooks/pre-commit"
    
    # Create pre-commit hook
    cat > "$pre_commit_hook" << 'EOF'
#!/bin/sh
# TruffleHog pre-commit hook for this repository

echo "🔍 Running TruffleHog secret scan on repository..."

# Run TruffleHog on staged changes
trufflehog git file://. --since-commit HEAD --results=verified,unknown --fail

exit_code=$?

if [ $exit_code -eq 183 ]; then
    echo "🚨 Secrets detected in staged changes!"
    echo "Please remove the secrets before committing."
    echo ""
    echo "To see what was detected, run:"
    echo "  trufflehog git file://. --since-commit HEAD --results=verified,unknown --json"
    echo ""
    echo "To skip this check (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    exit 1
elif [ $exit_code -ne 0 ]; then
    echo "⚠️  TruffleHog scan failed with exit code $exit_code"
    echo "Please check your TruffleHog installation and try again."
    exit 1
fi

echo "✅ No secrets detected. Proceeding with commit."
EOF
    
    # Make hook executable
    chmod +x "$pre_commit_hook"
    
    echo -e "${GREEN}✓ Repository-specific Git hook created${NC}"
    echo -e "${YELLOW}This hook only applies to the current repository${NC}"
}

# Method 3: Docker-based Git hook
setup_docker_git_hook() {
    echo -e "${BLUE}Setting up Docker-based Git hook...${NC}"
    
    if [ ! -d ".git" ]; then
        echo -e "${RED}Error: Not in a Git repository${NC}"
        return 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        return 1
    fi
    
    local pre_commit_hook=".git/hooks/pre-commit"
    
    # Create Docker-based pre-commit hook
    cat > "$pre_commit_hook" << 'EOF'
#!/bin/sh
# TruffleHog pre-commit hook using Docker

echo "🔍 Running TruffleHog secret scan using Docker..."

# Run TruffleHog in Docker container
docker run --rm -v "$(pwd):/workdir" -i trufflesecurity/trufflehog:latest \
    git file:///workdir --since-commit HEAD --results=verified,unknown --fail

exit_code=$?

if [ $exit_code -eq 183 ]; then
    echo "🚨 Secrets detected in staged changes!"
    echo "Please remove the secrets before committing."
    echo ""
    echo "To see detailed results, run:"
    echo "  docker run --rm -v \"\$(pwd):/workdir\" trufflesecurity/trufflehog:latest git file:///workdir --since-commit HEAD --results=verified,unknown --json"
    echo ""
    echo "To skip this check (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    exit 1
elif [ $exit_code -ne 0 ]; then
    echo "⚠️  TruffleHog Docker scan failed with exit code $exit_code"
    exit 1
fi

echo "✅ No secrets detected. Proceeding with commit."
EOF
    
    # Make hook executable
    chmod +x "$pre_commit_hook"
    
    echo -e "${GREEN}✓ Docker-based Git hook created${NC}"
    echo -e "${YELLOW}This hook uses Docker and doesn't require local TruffleHog installation${NC}"
}

# Method 4: pre-commit framework
setup_precommit_framework() {
    echo -e "${BLUE}Setting up pre-commit framework integration...${NC}"
    
    if [ ! -d ".git" ]; then
        echo -e "${RED}Error: Not in a Git repository${NC}"
        return 1
    fi
    
    # Check if pre-commit is installed
    if ! command -v pre-commit &> /dev/null; then
        echo -e "${YELLOW}pre-commit framework not found. Installation options:${NC}"
        echo "  - pip install pre-commit"
        echo "  - brew install pre-commit"
        echo "  - conda install -c conda-forge pre-commit"
        read -p "Continue anyway? (y/n): " continue_setup
        if [[ ! "$continue_setup" =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    # Create .pre-commit-config.yaml
    cat > ".pre-commit-config.yaml" << 'EOF'
# Pre-commit configuration with TruffleHog
repos:
  - repo: local
    hooks:
      - id: trufflehog
        name: TruffleHog Secret Scanner
        description: Detect secrets in your data
        entry: bash -c 'trufflehog git file://. --since-commit HEAD --results=verified,unknown --fail'
        language: system
        stages: ["pre-commit", "pre-push"]
      
      - id: trufflehog-docker
        name: TruffleHog Docker Scanner
        description: Detect secrets using Docker
        entry: bash -c 'docker run --rm -v "$(pwd):/workdir" trufflesecurity/trufflehog:latest git file:///workdir --since-commit HEAD --results=verified,unknown --fail'
        language: system
        stages: ["pre-commit"]
        # Only run if Docker is available
        pass_filenames: false

  # Optional: Add other security tools
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
EOF
    
    echo -e "${GREEN}✓ .pre-commit-config.yaml created${NC}"
    echo -e "${YELLOW}Run 'pre-commit install' to activate the hooks${NC}"
    
    # Try to install if pre-commit is available
    if command -v pre-commit &> /dev/null; then
        echo -e "${BLUE}Installing pre-commit hooks...${NC}"
        pre-commit install
        echo -e "${GREEN}✓ Pre-commit hooks installed${NC}"
    fi
}

# Method 5: Husky integration (for Node.js projects)
setup_husky_integration() {
    echo -e "${BLUE}Setting up Husky integration...${NC}"
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: No package.json found. This is not a Node.js project.${NC}"
        return 1
    fi
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Warning: node_modules not found. Run 'npm install' first.${NC}"
    fi
    
    # Check if Husky is installed
    if [ ! -d "node_modules/husky" ] && [ ! -d "node_modules/.bin/husky" ]; then
        echo -e "${YELLOW}Husky not found. Install with:${NC}"
        echo "  npm install husky --save-dev"
        echo "  yarn add husky --dev"
        read -p "Continue anyway? (y/n): " continue_setup
        if [[ ! "$continue_setup" =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    # Initialize Husky if not already done
    if [ ! -d ".husky" ]; then
        echo -e "${BLUE}Initializing Husky...${NC}"
        npx husky init 2>/dev/null || echo "Husky init failed, continuing..."
        mkdir -p .husky
    fi
    
    # Create pre-commit hook for Husky
    cat > ".husky/pre-commit" << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running TruffleHog secret scan..."

# TruffleHog scan
trufflehog git file://. --since-commit HEAD --results=verified,unknown --fail

if [ $? -eq 183 ]; then
    echo "🚨 Secrets detected! Commit blocked."
    echo "Please remove the secrets and try again."
    exit 1
fi

echo "✅ No secrets detected."
EOF
    
    # Make executable
    chmod +x ".husky/pre-commit"
    
    # Alternative Docker version
    cat > ".husky/pre-commit-docker" << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running TruffleHog secret scan with Docker..."

# TruffleHog Docker scan
docker run --rm -v "$(pwd):/workdir" -i trufflesecurity/trufflehog:latest \
    git file:///workdir --since-commit HEAD --results=verified,unknown --fail

if [ $? -eq 183 ]; then
    echo "🚨 Secrets detected! Commit blocked."
    exit 1
fi

echo "✅ No secrets detected."
EOF
    
    chmod +x ".husky/pre-commit-docker"
    
    echo -e "${GREEN}✓ Husky pre-commit hooks created${NC}"
    echo -e "${YELLOW}Two versions created:${NC}"
    echo "  - .husky/pre-commit (uses local TruffleHog)"
    echo "  - .husky/pre-commit-docker (uses Docker)"
}

# Advanced configuration with custom rules
create_advanced_hook() {
    echo -e "${BLUE}Creating advanced TruffleHog pre-commit hook...${NC}"
    
    local hooks_dir="${1:-.git/hooks}"
    local config_file="${2:-trufflehog-config.yaml}"
    
    # Create advanced configuration
    cat > "$config_file" << 'EOF'
# Advanced TruffleHog configuration for pre-commit
detectors:
  - name: HighPrioritySecrets
    keywords:
      - password
      - secret
      - key
      - token
      - credential
      - api_key
    regex:
      secret: '[A-Za-z0-9+/=]{20,}'
    entropy: 4.0
    exclude_words:
      - example
      - test
      - demo
      - placeholder
      - your_secret_here
    exclude_regexes_match:
      - '.*test.*'
      - '.*example.*'
      - '.*demo.*'

  - name: AWSCredentials
    keywords:
      - aws
      - amazon
      - AKIA
    regex:
      access_key: 'AKIA[0-9A-Z]{16}'
      secret_key: '[A-Za-z0-9+/]{40}'
    entropy: 4.5
    exclude_words:
      - AKIAIOSFODNN7EXAMPLE

  - name: GitHubTokens
    keywords:
      - github
      - ghp_
      - gho_
    regex:
      token: 'gh[pso]_[A-Za-z0-9]{36}'
    entropy: 3.8
EOF
    
    # Create advanced pre-commit hook
    cat > "$hooks_dir/pre-commit" << EOF
#!/bin/sh
# Advanced TruffleHog pre-commit hook

echo "🔍 Running advanced TruffleHog secret scan..."

# Configuration file path
CONFIG_FILE="$config_file"

# Create temporary results file
RESULTS_FILE=\$(mktemp)

# Run TruffleHog with custom configuration
if [ -f "\$CONFIG_FILE" ]; then
    trufflehog git file://. \\
        --since-commit HEAD \\
        --config="\$CONFIG_FILE" \\
        --results=verified,unknown \\
        --json \\
        --no-update > "\$RESULTS_FILE"
else
    # Fallback to default scan
    trufflehog git file://. \\
        --since-commit HEAD \\
        --results=verified,unknown \\
        --json \\
        --no-update > "\$RESULTS_FILE"
fi

exit_code=\$?

# Process results
if [ -s "\$RESULTS_FILE" ]; then
    echo "🚨 Secrets detected in staged changes!"
    echo ""
    echo "Summary:"
    
    # Count secrets by type if jq is available
    if command -v jq &> /dev/null; then
        echo "$(jq -r 'group_by(.DetectorName) | map("  - \\(.[0].DetectorName): \\(length) secret(s)") | .[]' "\$RESULTS_FILE")"
        echo ""
        echo "First few detections:"
        jq -r '.[:3] | .[] | "  🔑 \\(.DetectorName) in \\(.SourceMetadata.Data.Git.file // "unknown")"' "\$RESULTS_FILE"
    else
        echo "  Use 'jq' for detailed analysis: jq . \$RESULTS_FILE"
    fi
    
    echo ""
    echo "To see full results:"
    echo "  trufflehog git file://. --since-commit HEAD --results=verified,unknown --json"
    echo ""
    echo "To skip this check (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    
    # Cleanup
    rm -f "\$RESULTS_FILE"
    exit 1
elif [ \$exit_code -ne 0 ]; then
    echo "⚠️  TruffleHog scan failed with exit code \$exit_code"
    rm -f "\$RESULTS_FILE"
    exit 1
fi

echo "✅ No secrets detected. Your commit is clean!"

# Cleanup
rm -f "\$RESULTS_FILE"
exit 0
EOF
    
    # Make executable
    chmod +x "$hooks_dir/pre-commit"
    
    echo -e "${GREEN}✓ Advanced pre-commit hook created${NC}"
    echo -e "${YELLOW}Configuration file: $config_file${NC}"
}

# Test hook functionality
test_hook() {
    echo -e "${BLUE}Testing TruffleHog hook functionality...${NC}"
    
    # Create a test file with a fake secret
    local test_file="test-secret-file.tmp"
    echo "fake_api_key=sk_test_1234567890abcdef1234567890abcdef" > "$test_file"
    
    # Add to git
    git add "$test_file" 2>/dev/null || true
    
    echo -e "${YELLOW}Testing with fake secret in staged changes...${NC}"
    
    # Run TruffleHog manually to test
    if trufflehog git file://. --since-commit HEAD --results=verified,unknown >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Hook would allow commit (no secrets detected)${NC}"
    else
        echo -e "${RED}✗ Hook would block commit (secrets detected)${NC}"
        echo -e "${YELLOW}This is expected behavior for the test${NC}"
    fi
    
    # Cleanup
    git reset HEAD "$test_file" 2>/dev/null || true
    rm -f "$test_file"
    
    echo -e "${BLUE}Test completed${NC}"
}

# Troubleshooting function
troubleshoot_hooks() {
    echo -e "${BLUE}TruffleHog Hook Troubleshooting${NC}"
    echo "=================================="
    
    # Check TruffleHog installation
    if command -v trufflehog &> /dev/null; then
        echo -e "${GREEN}✓ TruffleHog is installed: $(trufflehog --version)${NC}"
    else
        echo -e "${RED}✗ TruffleHog is not installed${NC}"
    fi
    
    # Check Git repository
    if [ -d ".git" ]; then
        echo -e "${GREEN}✓ In a Git repository${NC}"
    else
        echo -e "${RED}✗ Not in a Git repository${NC}"
    fi
    
    # Check hook files
    if [ -f ".git/hooks/pre-commit" ]; then
        echo -e "${GREEN}✓ Pre-commit hook exists${NC}"
        if [ -x ".git/hooks/pre-commit" ]; then
            echo -e "${GREEN}✓ Pre-commit hook is executable${NC}"
        else
            echo -e "${RED}✗ Pre-commit hook is not executable${NC}"
            echo "  Fix: chmod +x .git/hooks/pre-commit"
        fi
    else
        echo -e "${YELLOW}? No repository-specific pre-commit hook found${NC}"
    fi
    
    # Check global hooks
    local global_hooks_path=$(git config --get core.hooksPath)
    if [ -n "$global_hooks_path" ]; then
        echo -e "${GREEN}✓ Global hooks path configured: $global_hooks_path${NC}"
        if [ -f "$global_hooks_path/pre-commit" ]; then
            echo -e "${GREEN}✓ Global pre-commit hook exists${NC}"
        else
            echo -e "${RED}✗ Global pre-commit hook not found${NC}"
        fi
    else
        echo -e "${YELLOW}? No global hooks path configured${NC}"
    fi
    
    # Check pre-commit framework
    if [ -f ".pre-commit-config.yaml" ]; then
        echo -e "${GREEN}✓ Pre-commit framework config found${NC}"
        if command -v pre-commit &> /dev/null; then
            echo -e "${GREEN}✓ Pre-commit framework is installed${NC}"
        else
            echo -e "${RED}✗ Pre-commit framework is not installed${NC}"
        fi
    fi
    
    # Check Husky
    if [ -f ".husky/pre-commit" ]; then
        echo -e "${GREEN}✓ Husky pre-commit hook found${NC}"
    fi
    
    echo ""
    echo "Common fixes:"
    echo "  - Make hook executable: chmod +x .git/hooks/pre-commit"
    echo "  - Check hook path: git config --get core.hooksPath"
    echo "  - Skip hook once: git commit --no-verify"
    echo "  - Test manually: trufflehog git file://. --since-commit HEAD"
}

# Interactive menu
interactive_menu() {
    echo -e "${GREEN}TruffleHog Pre-commit Hook Setup${NC}"
    echo "=================================="
    echo "Choose a setup method:"
    echo "1. Global Git hooks (affects all repositories)"
    echo "2. Repository-specific Git hook"
    echo "3. Docker-based Git hook"
    echo "4. Pre-commit framework"
    echo "5. Husky integration (Node.js projects)"
    echo "6. Advanced hook with custom configuration"
    echo "7. Test hook functionality"
    echo "8. Troubleshoot hooks"
    echo "9. Exit"
    
    read -p "Enter your choice (1-9): " choice
    
    case $choice in
        1)
            check_trufflehog && setup_global_git_hooks
            ;;
        2)
            check_trufflehog && setup_repo_git_hook
            ;;
        3)
            setup_docker_git_hook
            ;;
        4)
            setup_precommit_framework
            ;;
        5)
            setup_husky_integration
            ;;
        6)
            check_trufflehog && create_advanced_hook
            ;;
        7)
            test_hook
            ;;
        8)
            troubleshoot_hooks
            ;;
        9)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
}

# Show help
show_help() {
    cat << 'EOF'
TruffleHog Pre-commit Hooks Setup

Usage:
  ./pre-commit-hooks.sh [COMMAND]

Commands:
  global              Set up global Git hooks
  repo                Set up repository-specific Git hook
  docker              Set up Docker-based Git hook
  precommit           Set up pre-commit framework
  husky               Set up Husky integration
  advanced            Create advanced hook with custom config
  test                Test hook functionality
  troubleshoot        Troubleshoot hook issues
  interactive         Interactive setup menu
  help                Show this help message

Examples:
  ./pre-commit-hooks.sh global
  ./pre-commit-hooks.sh repo
  ./pre-commit-hooks.sh interactive
EOF
}

# Main function
main() {
    case "${1:-interactive}" in
        global)
            check_trufflehog && setup_global_git_hooks
            ;;
        repo)
            check_trufflehog && setup_repo_git_hook
            ;;
        docker)
            setup_docker_git_hook
            ;;
        precommit)
            setup_precommit_framework
            ;;
        husky)
            setup_husky_integration
            ;;
        advanced)
            check_trufflehog && create_advanced_hook
            ;;
        test)
            test_hook
            ;;
        troubleshoot)
            troubleshoot_hooks
            ;;
        interactive)
            interactive_menu
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi