#!/bin/bash
# TruffleHog Filtering and Configuration Examples
# Advanced filtering options and configuration patterns

# Create exclude patterns file
create_exclude_patterns() {
    local exclude_file="${1:-exclude-patterns.txt}"
    
    cat > "$exclude_file" << 'EOL'
# Exclude test files and directories
test/.*
tests/.*
.*test.*
.*spec.*

# Exclude documentation
docs/.*
documentation/.*
.*\.md$
.*\.txt$
README.*

# Exclude dependency directories
node_modules/.*
vendor/.*
venv/.*
.*\.git/.*

# Exclude log files
.*\.log$
logs/.*

# Exclude cache and temporary files
.*cache.*
.*tmp.*
.*temp.*
\.DS_Store
Thumbs\.db

# Exclude compiled and binary files
.*\.o$
.*\.so$
.*\.dll$
.*\.exe$
.*\.jar$
.*\.war$
.*\.class$

# Exclude image files
.*\.(jpg|jpeg|png|gif|bmp|ico|svg)$

# Exclude archive files
.*\.(zip|tar|gz|bz2|rar|7z)$

# Exclude configuration templates and examples
.*\.example$
.*\.template$
.*\.sample$
config/.*\.example\..*
EOL

    echo "Created exclude patterns file: $exclude_file"
}

# Create include patterns file
create_include_patterns() {
    local include_file="${1:-include-patterns.txt}"
    
    cat > "$include_file" << 'EOL'
# Include source code files
.*\.(js|ts|py|go|java|c|cpp|h|hpp|rb|php|cs)$

# Include configuration files
.*\.(json|yaml|yml|xml|ini|cfg|conf)$

# Include shell scripts
.*\.(sh|bash|zsh|fish)$

# Include environment and config files
\.env.*
.*config.*
.*settings.*

# Include Docker files
Dockerfile.*
docker-compose.*

# Include CI/CD files
\.github/.*
\.gitlab-ci\.yml
\.travis\.yml
\.circleci/.*
Jenkinsfile

# Include infrastructure as code
.*\.tf$
.*\.tfvars$
.*\.hcl$

# Include database migration files
.*migration.*
.*seed.*
EOL

    echo "Created include patterns file: $include_file"
}

# Scan with comprehensive filtering
scan_with_filtering() {
    local target="${1:-.}"
    local exclude_file="${2:-exclude-patterns.txt}"
    local include_file="${3:-include-patterns.txt}"
    
    echo "Scanning with comprehensive filtering..."
    
    # Create filter files if they don't exist
    [[ ! -f "$exclude_file" ]] && create_exclude_patterns "$exclude_file"
    [[ ! -f "$include_file" ]] && create_include_patterns "$include_file"
    
    trufflehog filesystem "$target" \
        --include-paths="$include_file" \
        --exclude-paths="$exclude_file" \
        --results=verified,unknown \
        --filter-entropy=3.5 \
        --json \
        --no-update
}

# Scan with entropy filtering
scan_with_entropy() {
    local target="${1:-.}"
    local entropy_threshold="${2:-3.0}"
    
    echo "Scanning with entropy filtering (threshold: $entropy_threshold)..."
    
    trufflehog filesystem "$target" \
        --filter-entropy="$entropy_threshold" \
        --results=verified,unknown \
        --json
}

# Scan with glob exclusions (faster)
scan_with_globs() {
    local target="${1}"
    
    echo "Scanning with glob exclusions..."
    
    trufflehog git "$target" \
        --exclude-globs="*.log,*.cache,*.tmp,node_modules/*,vendor/*,*.zip,*.tar.gz,*.jar" \
        --results=verified,unknown \
        --json
}

# Scan with detector filtering
scan_with_detector_filter() {
    local target="${1}"
    local include_detectors="${2:-aws,github,slack,jwt}"
    local exclude_detectors="${3:-generic}"
    
    echo "Scanning with detector filtering..."
    echo "Including: $include_detectors"
    echo "Excluding: $exclude_detectors"
    
    trufflehog git "$target" \
        --include-detectors="$include_detectors" \
        --exclude-detectors="$exclude_detectors" \
        --results=verified,unknown \
        --json
}

# Scan with archive limitations
scan_with_archive_limits() {
    local target="${1}"
    local max_size="${2:-50MB}"
    local max_depth="${3:-5}"
    local timeout="${4:-2m}"
    
    echo "Scanning with archive limitations..."
    echo "Max size: $max_size, Max depth: $max_depth, Timeout: $timeout"
    
    trufflehog filesystem "$target" \
        --archive-max-size="$max_size" \
        --archive-max-depth="$max_depth" \
        --archive-timeout="$timeout" \
        --results=verified,unknown \
        --json
}

# Scan with custom verification
scan_with_custom_verification() {
    local target="${1}"
    local verifier_endpoint="${2:-https://internal-verifier.company.com/verify}"
    
    echo "Scanning with custom verification endpoint..."
    
    trufflehog git "$target" \
        --verifier="$verifier_endpoint" \
        --custom-verifiers-only \
        --results=verified,unknown \
        --json
}

# Scan without verification (faster)
scan_without_verification() {
    local target="${1}"
    
    echo "Scanning without verification (faster scan)..."
    
    trufflehog git "$target" \
        --no-verification \
        --results=unverified \
        --filter-entropy=4.0 \
        --json
}

# Scan with performance optimization
scan_optimized() {
    local target="${1}"
    local concurrency="${2:-20}"
    
    echo "Scanning with performance optimization..."
    
    trufflehog git "$target" \
        --concurrency="$concurrency" \
        --exclude-globs="*.log,*.cache,node_modules/*,vendor/*" \
        --filter-entropy=3.5 \
        --archive-max-size=20MB \
        --results=verified,unknown \
        --json \
        --no-update
}

# Create comprehensive configuration file
create_comprehensive_config() {
    local config_file="${1:-comprehensive-config.yaml}"
    
    cat > "$config_file" << 'EOL'
# Comprehensive TruffleHog Configuration
detectors:
  # High-priority detectors
  - name: ProductionAWSDetector
    keywords:
      - aws
      - amazon
      - AKIA
    regex:
      access_key: 'AKIA[0-9A-Z]{16}'
      secret_key: '[A-Za-z0-9+/]{40}'
    verify:
      - endpoint: https://sts.amazonaws.com/
    entropy: 4.0
    exclude_words:
      - AKIAIOSFODNN7EXAMPLE
      - example
      - test
    exclude_regexes_match:
      - '.*test.*'
      - '.*example.*'

  # API Keys with high entropy requirement
  - name: HighEntropyAPIKeys
    keywords:
      - api_key
      - apikey
      - secret
      - token
    regex:
      key: '[A-Za-z0-9+/=]{32,}'
    entropy: 4.5
    exclude_words:
      - example
      - test
      - demo
      - placeholder
      - your_api_key_here
    exclude_regexes_capture:
      - '^[a-z]+$'
      - '^[0-9]+$'
      - '.*(test|example|demo).*'

  # Database credentials
  - name: DatabaseCredentials
    keywords:
      - database
      - db_
      - mysql
      - postgres
      - mongodb
    regex:
      connection: '(mysql|postgres|mongodb)://[^\\s]+'
      password: 'password["\']?\s*[:=]\s*["\']?([A-Za-z0-9!@#$%^&*()]{8,})["\']?'
    entropy: 3.8
    exclude_regexes_match:
      - '.*localhost.*'
      - '.*127\.0\.0\.1.*'
      - '.*example\.com.*'

# Global settings
global:
  entropy_threshold: 3.5
  verification_timeout: 30s
  max_archive_size: 50MB
  exclude_patterns:
    - "*.log"
    - "*.cache"
    - "node_modules/*"
    - "vendor/*"
    - "test/*"
    - "tests/*"
EOL

    echo "Created comprehensive configuration: $config_file"
}

# Scan with comprehensive configuration
scan_with_config() {
    local target="${1}"
    local config_file="${2:-comprehensive-config.yaml}"
    
    [[ ! -f "$config_file" ]] && create_comprehensive_config "$config_file"
    
    echo "Scanning with comprehensive configuration..."
    
    trufflehog filesystem "$target" \
        --config="$config_file" \
        --results=verified,unknown \
        --json
}

# Interactive filtering setup
interactive_filtering_setup() {
    echo "TruffleHog Interactive Filtering Setup"
    echo "======================================"
    
    read -p "Create exclude patterns file? (y/n): " create_exclude
    if [[ "$create_exclude" =~ ^[Yy]$ ]]; then
        read -p "Exclude patterns filename [exclude-patterns.txt]: " exclude_file
        create_exclude_patterns "${exclude_file:-exclude-patterns.txt}"
    fi
    
    read -p "Create include patterns file? (y/n): " create_include
    if [[ "$create_include" =~ ^[Yy]$ ]]; then
        read -p "Include patterns filename [include-patterns.txt]: " include_file
        create_include_patterns "${include_file:-include-patterns.txt}"
    fi
    
    read -p "Create comprehensive config file? (y/n): " create_config
    if [[ "$create_config" =~ ^[Yy]$ ]]; then
        read -p "Config filename [comprehensive-config.yaml]: " config_file
        create_comprehensive_config "${config_file:-comprehensive-config.yaml}"
    fi
    
    echo "Filtering setup complete!"
}

# Performance tuning recommendations
show_performance_tips() {
    cat << 'EOL'
TruffleHog Performance Tuning Tips:
==================================

1. Use glob exclusions for faster filtering:
   --exclude-globs="*.log,*.cache,node_modules/*,vendor/*"

2. Set appropriate entropy thresholds:
   --filter-entropy=3.5  # Higher = fewer false positives

3. Limit archive processing:
   --archive-max-size=50MB --archive-max-depth=5

4. Adjust concurrency based on resources:
   --concurrency=10  # Start with 10, adjust as needed

5. Skip verification for initial scans:
   --no-verification  # Much faster, use for discovery

6. Use include/exclude patterns for targeted scanning:
   --include-paths=patterns.txt --exclude-paths=exclude.txt

7. Filter result types:
   --results=verified,unknown  # Skip unverified for production

8. Disable update checks:
   --no-update  # Faster startup

Example optimized command:
trufflehog git https://github.com/example/repo \
  --exclude-globs="*.log,node_modules/*" \
  --filter-entropy=3.5 \
  --concurrency=15 \
  --results=verified,unknown \
  --no-update
EOL
}

# Help function
show_help() {
    cat << 'EOL'
TruffleHog Filtering and Configuration Examples:

Functions:
  create_exclude_patterns [file]     - Create exclude patterns file
  create_include_patterns [file]     - Create include patterns file
  scan_with_filtering [target]       - Scan with comprehensive filtering
  scan_with_entropy [target] [threshold] - Scan with entropy filtering
  scan_with_globs [target]           - Scan with glob exclusions
  scan_with_detector_filter [target] [include] [exclude] - Filter detectors
  scan_with_archive_limits [target]  - Limit archive processing
  scan_without_verification [target] - Skip verification for speed
  scan_optimized [target] [concurrency] - Performance optimized scan
  create_comprehensive_config [file] - Create detailed config
  scan_with_config [target] [config] - Scan with config file
  interactive_filtering_setup        - Interactive setup wizard
  show_performance_tips              - Performance tuning tips

Examples:
  scan_with_filtering ./myproject
  scan_with_entropy . 4.0
  scan_optimized https://github.com/example/repo 20
  interactive_filtering_setup
EOL
}

# Main function
main() {
    case "${1:-help}" in
        create-exclude)
            create_exclude_patterns "$2"
            ;;
        create-include)
            create_include_patterns "$2"
            ;;
        scan-filtered)
            scan_with_filtering "$2" "$3" "$4"
            ;;
        scan-entropy)
            scan_with_entropy "$2" "$3"
            ;;
        scan-optimized)
            scan_optimized "$2" "$3"
            ;;
        interactive)
            interactive_filtering_setup
            ;;
        performance)
            show_performance_tips
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "Unknown command: $1"
            show_help
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi