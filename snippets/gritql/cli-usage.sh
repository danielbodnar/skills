#!/bin/bash
# GritQL CLI Usage Examples and Common Commands

# Basic GritQL installation
echo "Installing GritQL..."
bun add -g @getgrit/launcher
# Alternative: npm install -g @getgrit/launcher

# Initialize GritQL in a project
echo "Initializing GritQL configuration..."
grit init

# Basic pattern application
echo "Applying patterns..."

# Remove console.log statements
grit apply --pattern "console.log(\$_) => ." --files "src/**/*.js"

# Convert var to const
grit apply --pattern "var \$name = \$value => const \$name = \$value" --dry-run

# Check patterns without applying changes
grit check --pattern no_console_log

# Apply multiple patterns from configuration
grit apply modernize_js --interactive

# Advanced CLI usage

# Apply pattern to specific files
grit apply no_console_log --files "src/components/*.jsx,src/utils/*.js"

# Exclude certain directories
grit apply prefer_const --exclude "node_modules/**,dist/**"

# Output as git patch for review
grit apply remove_unused_vars --format patch > changes.patch

# Generate workflow from natural language description
grit generate "Convert all React class components to functional components with hooks"

# List all available patterns
grit list

# List patterns by category
grit list --tag "security"
grit list --tag "performance" 
grit list --tag "react"

# Check pattern syntax
grit check --pattern custom_pattern.grit

# Profile pattern performance
grit apply complex_pattern --profile

# Verbose output for debugging
grit apply pattern_name --verbose

# Limit concurrent processing
grit apply pattern_name --threads 4

# Custom pattern files

# Apply pattern from file
grit apply --pattern-file .grit/patterns/custom.grit

# Apply multiple pattern files
grit apply --pattern-file ".grit/patterns/*.grit"

# Configuration management

# Update pattern library
grit update

# Install patterns from registry
grit install standard

# Install custom pattern collection
grit install "https://github.com/company/grit-patterns"

# CI/CD Integration examples

# Exit with error code if patterns fail
grit check --level error || exit 1

# Apply patterns and create commit
grit apply modernize_js --ci && git add . && git commit -m "feat: modernize JavaScript code"

# Generate report for CI
grit check all --format json > grit-report.json

# Interactive mode examples

# Review each change before applying
grit apply security_fixes --interactive

# Apply with confirmation prompts
grit apply large_refactor --confirm

# Advanced pattern development

# Test pattern against sample code
echo "var x = 5;" | grit apply "var \$name = \$value => const \$name = \$value"

# Validate pattern syntax
grit validate --pattern "invalid pattern syntax"

# Show AST for debugging
grit ast --language js "console.log('hello')"

# Performance monitoring

# Time pattern execution
time grit apply complex_pattern

# Monitor memory usage
grit apply memory_intensive_pattern --memory-limit 4GB

# Batch processing
grit apply pattern_suite --batch-size 100

# Integration with other tools

# Format code after applying patterns
grit apply prefer_const && npx prettier --write "src/**/*.js"

# Run linter after transformations
grit apply modernize_js && npx eslint --fix "src/**/*.js"

# Type check after TypeScript patterns
grit apply add_types && npx tsc --noEmit

# Testing patterns

# Test pattern against fixture files
grit test --pattern no_console_log --fixtures "test/fixtures/*.js"

# Run pattern test suite
grit test all

# Validate transformations
grit validate --before "test/before/*.js" --after "test/after/*.js"

# Specialized workflows

# Framework migration
grit migrate --from jquery --to vanilla --files "src/**/*.js"

# Security audit and fix
grit security-scan && grit apply security_fixes

# Performance optimization
grit analyze-performance && grit apply performance_optimizations

# Dependency updates
grit update-deps --framework react --target-version 18

# Code modernization pipeline
grit apply es6_modernization && \
grit apply typescript_migration && \
grit apply security_hardening && \
grit apply performance_optimization

# Custom workflow execution
grit workflow modernize_codebase --config .grit/workflows/modernize.yaml

# Pattern development helpers

# Generate pattern template
grit new-pattern --name "custom_rule" --language js

# Test pattern against codebase
grit dry-run custom_pattern --sample-size 10

# Benchmark pattern performance
grit benchmark custom_pattern --iterations 100

# Debug pattern matching
grit debug --pattern "complex_pattern" --file "src/example.js"

# Export and import patterns

# Export patterns to file
grit export --patterns "security/*" --output security-patterns.yaml

# Import patterns from file
grit import --file security-patterns.yaml

# Share patterns with team
grit publish --pattern-set "company-standards" --registry internal

# Reporting and analytics

# Generate transformation report
grit report --output html --file transformation-report.html

# Code quality metrics
grit metrics --before --after --compare

# Pattern usage statistics
grit stats --timeframe "last-month"

# Integration with version control

# Create feature branch for changes
git checkout -b "refactor/grit-modernization"
grit apply modernize_suite
git add .
git commit -m "refactor: modernize codebase with GritQL"

# Review changes before committing
grit apply pattern_name --dry-run --diff
# Review output, then apply for real
grit apply pattern_name

# Rollback patterns if needed
git checkout HEAD~1 -- .

# Configuration examples

# Set global preferences
grit config set editor.default "code"
grit config set parallel.enabled true
grit config set cache.enabled true

# Project-specific settings
grit config set --local exclude "legacy/**"
grit config set --local max-threads 8

# Pattern registry configuration
grit registry add company https://patterns.company.com
grit registry set-default company

# Environment-specific patterns
GRIT_ENV=production grit apply production_optimizations
GRIT_ENV=development grit apply development_helpers

# Monitoring and logging

# Enable detailed logging
GRIT_LOG_LEVEL=debug grit apply complex_pattern

# Log to file
grit apply pattern_name --log-file grit.log

# Monitor system resources
grit apply pattern_name --monitor-resources

# Error handling and recovery

# Continue on errors
grit apply pattern_suite --continue-on-error

# Timeout for long-running patterns  
grit apply slow_pattern --timeout 300

# Retry failed operations
grit apply network_dependent_pattern --retry 3

# Backup before applying changes
grit apply destructive_pattern --backup

echo "GritQL CLI examples completed!"