# Bash Reference

Modern shell scripting with Bash for automation, system administration, and development workflows.

## Quick Reference

- Installation: Included with most Unix/Linux systems, available via package managers
- Version Check: `bash --version` (Bash 5.2+ recommended)
- Documentation: <https://www.gnu.org/software/bash/manual/bash.html>
- GitHub: <https://github.com/bats-core/bats-core> (for testing)
- Style Guide: <https://google.github.io/styleguide/shellguide.html>

## Default Usage Patterns

Use Bash for:

- **System Automation**: Scripts for deployment, backup, and maintenance
- **Development Workflows**: Build scripts, test runners, and CI/CD pipelines  
- **Data Processing**: Text manipulation and file operations
- **Environment Setup**: Development environment configuration
- **Glue Scripts**: Connecting different tools and services

Avoid Bash for:

- Complex business logic (use TypeScript/Effect-TS instead)
- Large applications (prefer compiled languages)
- Cross-platform compatibility requirements

## Installation and Setup

### Version Requirements

```bash
# Check Bash version (5.2+ recommended)
bash --version

# Install latest Bash (macOS)
brew install bash

# Install latest Bash (Linux)
sudo apt update && sudo apt install bash

# Install testing framework
npm install -g bats-core  # or via package manager
```

### Shebang and Permissions

```bash
#!/bin/bash
# Always use /bin/bash, not /bin/sh

# Make script executable
chmod +x script.sh
```

## Core Syntax and Patterns

### Script Structure

```bash
#!/bin/bash
set -euo pipefail  # Strict mode

# Script metadata
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Constants
readonly DEFAULT_TIMEOUT=30
readonly LOG_FILE="/tmp/${SCRIPT_NAME}.log"

# Global variables
declare -g verbose=false
declare -g dry_run=false

# Main function pattern
main() {
    parse_args "$@"
    setup_logging
    run_operations
}

# Error handling
err() {
    echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: ERROR: $*" >&2
}

# Cleanup trap
cleanup() {
    [[ -f "$temp_file" ]] && rm -f "$temp_file"
}
trap cleanup EXIT

# Call main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### Strict Mode Configuration

```bash
# Enable strict error handling
set -euo pipefail

# Explanation:
# -e: Exit on any command failure
# -u: Exit on undefined variable usage
# -o pipefail: Fail if any command in pipeline fails
```

### Variable Declaration and Quoting

```bash
# Always use quotes around variables
local user_name="${1:-default}"
local file_path="/home/${user_name}/config"

# Array usage (preferred over space-delimited strings)
declare -a files=("file1.txt" "file with spaces.txt" "file3.txt")
for file in "${files[@]}"; do
    echo "Processing: $file"
done

# Constants (readonly)
readonly API_URL="https://api.example.com"
readonly -a REQUIRED_TOOLS=("curl" "jq" "git")

# Environment variables (uppercase)
export DATABASE_URL="${DATABASE_URL:-sqlite:///tmp/app.db}"
```

## Modern Bash Patterns

### Parameter Expansion

```bash
# String manipulation without external commands
string="Hello World"

# Case conversion (Bash 4.0+)
echo "${string,,}"  # hello world (lowercase)
echo "${string^^}"  # HELLO WORLD (uppercase)
echo "${string~}"   # hello World (toggle first)
echo "${string~~}"  # hELLO wORLD (toggle all)

# Pattern substitution
filename="document.backup.txt"
echo "${filename/.backup/}"        # document.txt (remove .backup)
echo "${filename//backup/current}" # document.current.txt (replace all)

# Path manipulation
path="/home/user/documents/file.txt"
echo "${path##*/}"   # file.txt (basename)
echo "${path%/*}"    # /home/user/documents (dirname)
echo "${path##*.}"   # txt (extension)
echo "${path%.*}"    # /home/user/documents/file (without extension)

# Default values
echo "${VAR:-default}"        # Use default if VAR is unset/empty
echo "${VAR:=default}"        # Set VAR to default if unset/empty
echo "${VAR:?Error message}"  # Exit with error if VAR is unset/empty
```

### Conditional Expressions

```bash
# Modern test syntax (preferred over [ ])
if [[ -f "$file" && -r "$file" ]]; then
    echo "File exists and is readable"
fi

# String comparison
if [[ "$status" == "success" ]]; then
    echo "Operation completed successfully"
fi

# Pattern matching
if [[ "$filename" == *.log ]]; then
    echo "Log file detected"
fi

# Regex matching
if [[ "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo "Valid email format"
    domain="${BASH_REMATCH[1]}"  # Captured group
fi

# Numeric comparison
if (( count > 10 )); then
    echo "Count exceeds threshold"
fi
```

### Function Definitions

```bash
# Function with error handling and validation
process_file() {
    local file="${1:?File path required}"
    local output_dir="${2:-./output}"
    
    # Validate inputs
    [[ -f "$file" ]] || { err "File not found: $file"; return 1; }
    [[ -d "$output_dir" ]] || mkdir -p "$output_dir"
    
    # Local variables
    local filename basename extension
    filename="$(basename "$file")"
    basename="${filename%.*}"
    extension="${filename##*.}"
    
    # Process file
    echo "Processing $filename..."
    # ... processing logic ...
    
    return 0
}

# Function with multiple return values via array
get_system_info() {
    local -n result_ref=$1  # Name reference (Bash 4.3+)
    
    result_ref[0]="$(uname -s)"      # OS
    result_ref[1]="$(uname -r)"      # Kernel
    result_ref[2]="$(whoami)"        # User
    result_ref[3]="$(hostname)"      # Hostname
}

# Usage
declare -a system_info
get_system_info system_info
echo "OS: ${system_info[0]}, User: ${system_info[2]}"
```

### Error Handling and Logging

```bash
# Comprehensive error handling
handle_error() {
    local exit_code=$1
    local line_number=$2
    local command="$3"
    
    err "Command failed with exit code $exit_code at line $line_number: $command"
    cleanup
    exit "$exit_code"
}

# Set error trap
trap 'handle_error $? $LINENO "$BASH_COMMAND"' ERR

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp="$(date +'%Y-%m-%d %H:%M:%S')"
    
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Usage
log "INFO" "Starting backup process"
log "ERROR" "Failed to connect to database"
log "DEBUG" "Processing file: $filename"
```

## Security Best Practices

### Input Validation and Sanitization

```bash
# Validate command line arguments
validate_input() {
    local input="$1"
    local pattern="$2"
    
    if [[ ! "$input" =~ $pattern ]]; then
        err "Invalid input: $input (expected pattern: $pattern)"
        return 1
    fi
    
    return 0
}

# Sanitize filename
sanitize_filename() {
    local filename="$1"
    # Remove dangerous characters
    filename="${filename//[^a-zA-Z0-9._-]/}"
    # Limit length
    filename="${filename:0:255}"
    echo "$filename"
}

# Safe command execution with timeout
safe_execute() {
    local cmd="$1"
    local timeout="${2:-30}"
    
    if ! timeout "$timeout" bash -c "$cmd"; then
        err "Command timed out or failed: $cmd"
        return 1
    fi
}
```

### Secure File Operations

```bash
# Create temporary files securely
create_temp_file() {
    local template="${1:-/tmp/script.XXXXXX}"
    local temp_file
    
    temp_file="$(mktemp "$template")" || {
        err "Failed to create temporary file"
        return 1
    }
    
    # Set restrictive permissions
    chmod 600 "$temp_file"
    echo "$temp_file"
}

# Safe file writing with atomic operation
write_file_atomic() {
    local target_file="$1"
    local content="$2"
    local temp_file
    
    temp_file="$(create_temp_file)" || return 1
    
    # Write to temporary file first
    echo "$content" > "$temp_file" || {
        rm -f "$temp_file"
        err "Failed to write temporary file"
        return 1
    }
    
    # Atomic move
    mv "$temp_file" "$target_file" || {
        rm -f "$temp_file"
        err "Failed to move file to target location"
        return 1
    }
}
```

### Environment Security

```bash
# Secure environment setup
secure_environment() {
    # Clear sensitive environment variables
    unset HISTFILE
    
    # Set secure PATH
    export PATH="/usr/local/bin:/usr/bin:/bin"
    
    # Set secure umask
    umask 077
    
    # Disable history expansion
    set +H
}

# Validate required tools
check_dependencies() {
    local -a required_tools=("$@")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        err "Missing required tools: ${missing_tools[*]}"
        return 1
    fi
}
```

## Testing with BATS

### Installation and Setup

```bash
# Install BATS testing framework
npm install -g bats-core
# or
brew install bats-core
# or
git clone https://github.com/bats-core/bats-core.git
cd bats-core && ./install.sh /usr/local
```

### Basic Test Structure

```bash
#!/usr/bin/env bats

# Test file: test/my_script.bats
load test_helper  # Optional helper functions

setup() {
    # Run before each test
    export TEST_DIR="$(mktemp -d)"
    export PATH="$BATS_TEST_DIRNAME/..:$PATH"
}

teardown() {
    # Run after each test
    rm -rf "$TEST_DIR"
}

@test "script exists and is executable" {
    run which my_script.sh
    [ "$status" -eq 0 ]
    [ -x "$(which my_script.sh)" ]
}

@test "script handles missing arguments" {
    run my_script.sh
    [ "$status" -eq 1 ]
    [[ "$output" =~ "usage:" ]]
}

@test "script processes valid input" {
    echo "test content" > "$TEST_DIR/input.txt"
    run my_script.sh "$TEST_DIR/input.txt"
    [ "$status" -eq 0 ]
    [[ "$output" =~ "processed successfully" ]]
}

@test "script creates expected output file" {
    echo "test content" > "$TEST_DIR/input.txt"
    run my_script.sh "$TEST_DIR/input.txt" "$TEST_DIR/output.txt"
    [ "$status" -eq 0 ]
    [ -f "$TEST_DIR/output.txt" ]
    [ -s "$TEST_DIR/output.txt" ]  # File is not empty
}
```

### Advanced Testing Patterns

```bash
# Mock external commands
@test "handles curl failure gracefully" {
    # Create mock curl that fails
    cat > "$TEST_DIR/curl" << 'EOF'
#!/bin/bash
exit 1
EOF
    chmod +x "$TEST_DIR/curl"
    export PATH="$TEST_DIR:$PATH"
    
    run my_script.sh --download-data
    [ "$status" -eq 1 ]
    [[ "$output" =~ "download failed" ]]
}

# Test with different environments
@test "respects DEBUG environment variable" {
    DEBUG=1 run my_script.sh --verbose
    [ "$status" -eq 0 ]
    [[ "$output" =~ "DEBUG:" ]]
}

# Test file operations
@test "handles permission denied errors" {
    echo "test" > "$TEST_DIR/readonly.txt"
    chmod 444 "$TEST_DIR/readonly.txt"
    
    run my_script.sh --write "$TEST_DIR/readonly.txt"
    [ "$status" -eq 1 ]
    [[ "$output" =~ "permission denied" ]]
}
```

### Test Execution

```bash
# Run all tests
bats test/

# Run specific test file
bats test/my_script.bats

# Run with verbose output
bats --verbose test/

# Generate TAP output
bats --tap test/ > test_results.tap

# Parallel execution
bats --jobs 4 test/
```

## Performance and Optimization

### Efficient Patterns

```bash
# Use built-in parameter expansion instead of external commands
# Bad
filename="$(basename "$path")"
dirname="$(dirname "$path")"

# Good
filename="${path##*/}"
dirname="${path%/*}"

# Minimize subprocess calls
# Bad
for file in $(find . -name "*.txt"); do
    echo "Processing: $file"
done

# Good
while IFS= read -r -d '' file; do
    echo "Processing: $file"
done < <(find . -name "*.txt" -print0)

# Use arrays for complex data
# Bad
files="file1.txt file2.txt file3.txt"
for file in $files; do  # Breaks with spaces in filenames
    process "$file"
done

# Good
files=("file1.txt" "file2.txt" "file3.txt")
for file in "${files[@]}"; do
    process "$file"
done
```

### Memory Management

```bash
# Handle large files efficiently
process_large_file() {
    local file="$1"
    local buffer_size="${2:-8192}"
    
    # Process in chunks to avoid memory issues
    while IFS= read -r -n "$buffer_size" chunk; do
        process_chunk "$chunk"
    done < "$file"
}

# Stream processing instead of loading entire files
count_lines() {
    local file="$1"
    local count=0
    
    # Don't use: wc -l (loads entire file)
    # Instead, read line by line
    while IFS= read -r line; do
        ((count++))
    done < "$file"
    
    echo "$count"
}
```

## Integration with Development Stack

### CI/CD Integration

```bash
# GitHub Actions example
name: Test Bash Scripts
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install BATS
        run: npm install -g bats-core
      - name: Run ShellCheck
        run: shellcheck scripts/*.sh
      - name: Run BATS tests
        run: bats test/
```

### Development Workflow

```bash
# Pre-commit hook for Bash scripts
#!/bin/bash
# .git/hooks/pre-commit

set -euo pipefail

# Check Bash scripts with ShellCheck
echo "Running ShellCheck..."
find . -name "*.sh" -exec shellcheck {} +

# Run BATS tests
echo "Running tests..."
bats test/

# Format scripts (if using shfmt)
echo "Formatting scripts..."
find . -name "*.sh" -exec shfmt -w {} +

echo "All checks passed!"
```

### Project Structure

```
project/
├── scripts/
│   ├── setup.sh
│   ├── build.sh
│   └── deploy.sh
├── test/
│   ├── setup.bats
│   ├── build.bats
│   └── test_helper.bash
├── .shellcheckrc
└── README.md
```

## Common Pitfalls and Solutions

### Word Splitting and Globbing

```bash
# Problem: Unquoted variables cause word splitting
files="file1.txt file with spaces.txt file3.txt"
for file in $files; do  # Breaks! Creates 5 items instead of 3
    echo "$file"
done

# Solution: Use arrays
files=("file1.txt" "file with spaces.txt" "file3.txt")
for file in "${files[@]}"; do
    echo "$file"
done
```

### Path Handling

```bash
# Problem: Relative paths break when changing directories
script_dir="$(dirname "$0")"  # Relative path
cd /tmp
source "$script_dir/config.sh"  # Fails!

# Solution: Always use absolute paths
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd /tmp
source "$script_dir/config.sh"  # Works!
```

### Error Handling

```bash
# Problem: Silent failures
backup_file="$(mktemp)"
important_command > "$backup_file"
rm "$backup_file"  # Data lost if important_command failed!

# Solution: Check exit codes
backup_file="$(mktemp)"
if important_command > "$backup_file"; then
    echo "Command succeeded, cleaning up"
    rm "$backup_file"
else
    echo "Command failed, preserving output in $backup_file"
    exit 1
fi
```

## Code Quality Tools

### ShellCheck Integration

```bash
# .shellcheckrc configuration
disable=SC2034  # Unused variables (sometimes acceptable)
enable=all
external-sources=true
```

### Formatting with shfmt

```bash
# Install shfmt
go install mvdan.cc/sh/v3/cmd/shfmt@latest

# Format all shell scripts
shfmt -w -i 2 -ci scripts/

# Check formatting
shfmt -d scripts/
```

## Resources and Documentation

### Official Documentation

- [GNU Bash Manual](https://www.gnu.org/software/bash/manual/bash.html)
- [Bash FAQ](http://mywiki.wooledge.org/BashFAQ)
- [Advanced Bash-Scripting Guide](https://tldp.org/LDP/abs/html/)

### Best Practices

- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
- [Pure Bash Bible](https://github.com/dylanaraps/pure-bash-bible)
- [Shellharden](https://github.com/anordal/shellharden)

### Tools and Testing

- [BATS-core](https://github.com/bats-core/bats-core) - Testing framework
- [ShellCheck](https://www.shellcheck.net/) - Static analysis
- [shfmt](https://github.com/mvdan/sh) - Shell formatter
- [ShellSpec](https://shellspec.info/) - BDD testing framework

### Security Resources

- [Shell Script Security](https://dwheeler.com/secure-programs/Secure-Programs-HOWTO/shell.html)
- [Bash Pitfalls](http://mywiki.wooledge.org/BashPitfalls)
- [Safe Ways to Do Things in Bash](https://github.com/anordal/shellharden/blob/master/how_to_do_things_safely_in_bash.md)

## Version Information

- **Current Stable**: Bash 5.2 (recommended minimum: Bash 4.0)
- **Features by Version**:
  - Bash 4.0+: Associative arrays, case modification
  - Bash 4.3+: Name references (declare -n)
  - Bash 5.0+: Additional parameter expansion features
  - Bash 5.1+: Enhanced array handling

## Migration and Compatibility

### From sh to Bash

```bash
# Replace POSIX sh constructs with Bash equivalents
# sh style
if [ "$var" = "value" ]; then
    echo "match"
fi

# Bash style (preferred)
if [[ "$var" == "value" ]]; then
    echo "match"
fi
```

### Legacy Script Modernization

```bash
# Old style (avoid)
#!/bin/sh
result=`command substitution`
if [ $? -eq 0 ]; then
    echo $result
fi

# Modern style (preferred)
#!/bin/bash
set -euo pipefail
if result="$(command substitution)"; then
    echo "$result"
fi
```
