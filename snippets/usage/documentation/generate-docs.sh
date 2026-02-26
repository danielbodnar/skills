#!/bin/bash

# Script to generate comprehensive documentation for a Usage CLI
# Usage: ./generate-docs.sh <cli-name> <usage-file> [output-dir]

set -euo pipefail

CLI_NAME="${1:-mycli}"
USAGE_FILE="${2:-${CLI_NAME}.usage.kdl}"
OUTPUT_DIR="${3:-docs}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if usage CLI is installed
if ! command -v usage &> /dev/null; then
    error "Usage CLI not found. Install it with: mise use -g usage"
    exit 1
fi

# Check if usage file exists
if [[ ! -f "$USAGE_FILE" ]]; then
    error "Usage file not found: $USAGE_FILE"
    exit 1
fi

log "Generating documentation for CLI: $CLI_NAME"
log "Using usage file: $USAGE_FILE"
log "Output directory: $OUTPUT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate Markdown documentation
log "Generating Markdown documentation..."
usage generate markdown -f "$USAGE_FILE" > "$OUTPUT_DIR/${CLI_NAME}.md"
success "Markdown documentation saved to: $OUTPUT_DIR/${CLI_NAME}.md"

# Generate JSON schema
log "Generating JSON schema..."
usage generate json -f "$USAGE_FILE" > "$OUTPUT_DIR/${CLI_NAME}.schema.json"
success "JSON schema saved to: $OUTPUT_DIR/${CLI_NAME}.schema.json"

# Generate manpage
log "Generating manpage..."
usage generate manpage -f "$USAGE_FILE" > "$OUTPUT_DIR/${CLI_NAME}.1"
success "Manpage saved to: $OUTPUT_DIR/${CLI_NAME}.1"

# Create a comprehensive README
log "Creating comprehensive README..."
cat > "$OUTPUT_DIR/README.md" << EOF
# $CLI_NAME Documentation

This directory contains comprehensive documentation for the \`$CLI_NAME\` command-line tool.

## Files

- [\`${CLI_NAME}.md\`](./${CLI_NAME}.md) - Complete command reference (auto-generated)
- [\`${CLI_NAME}.schema.json\`](./${CLI_NAME}.schema.json) - JSON schema for validation
- [\`${CLI_NAME}.1\`](./${CLI_NAME}.1) - Manual page (man page)
- [\`examples/\`](./examples/) - Usage examples and tutorials
- [\`api/\`](./api/) - API documentation (if applicable)

## Quick Start

### Installation

\`\`\`bash
# Install via package manager
npm install -g $CLI_NAME

# Or download from releases
curl -L https://github.com/user/repo/releases/latest/download/$CLI_NAME > /usr/local/bin/$CLI_NAME
chmod +x /usr/local/bin/$CLI_NAME
\`\`\`

### Basic Usage

\`\`\`bash
# Show help
$CLI_NAME --help

# Show version
$CLI_NAME --version

# Basic command
$CLI_NAME command --option value
\`\`\`

## Documentation Sections

### Command Reference

See [\`${CLI_NAME}.md\`](./${CLI_NAME}.md) for the complete command reference with all available commands, options, and examples.

### Examples

The [\`examples/\`](./examples/) directory contains practical examples and tutorials:

- [Getting Started](./examples/getting-started.md)
- [Common Use Cases](./examples/common-use-cases.md)
- [Advanced Configuration](./examples/advanced-config.md)
- [Integration Examples](./examples/integration.md)

### Manual Page

View the manual page with:
\`\`\`bash
man ./${CLI_NAME}.1
\`\`\`

Or install system-wide:
\`\`\`bash
sudo cp ${CLI_NAME}.1 /usr/share/man/man1/
man $CLI_NAME
\`\`\`

## Development

### Building from Source

\`\`\`bash
git clone https://github.com/user/repo.git
cd repo
make build
\`\`\`

### Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## Support

- 📚 [Documentation](./${CLI_NAME}.md)
- 🐛 [Issue Tracker](https://github.com/user/repo/issues)
- 💬 [Discussions](https://github.com/user/repo/discussions)
- 📧 [Email Support](mailto:support@example.com)
EOF

success "README created: $OUTPUT_DIR/README.md"

# Create examples directory with sample content
log "Creating examples directory..."
mkdir -p "$OUTPUT_DIR/examples"

# Getting Started example
cat > "$OUTPUT_DIR/examples/getting-started.md" << 'EOF'
# Getting Started with CLI

This guide will help you get up and running with the CLI tool.

## Installation

### Using Package Manager

```bash
# npm
npm install -g mycli

# yarn
yarn global add mycli

# bun
bun install -g mycli
```

### Manual Installation

```bash
# Download and install
curl -L https://github.com/user/repo/releases/latest/download/mycli > /usr/local/bin/mycli
chmod +x /usr/local/bin/mycli
```

## First Steps

### 1. Verify Installation

```bash
mycli --version
```

### 2. Get Help

```bash
# General help
mycli --help

# Command-specific help
mycli command --help
```

### 3. Basic Commands

```bash
# Example commands (replace with actual CLI commands)
mycli init myproject
mycli build --watch
mycli deploy --env production
```

## Configuration

### Configuration File

Create a configuration file at `~/.mycli/config.toml`:

```toml
[settings]
default_env = "development"
timeout = 30

[auth]
api_key = "your-api-key"
```

### Environment Variables

```bash
export MYCLI_API_KEY="your-api-key"
export MYCLI_DEBUG=true
```

## Next Steps

- [Common Use Cases](./common-use-cases.md)
- [Advanced Configuration](./advanced-config.md)
- [Integration Examples](./integration.md)
EOF

# Common use cases example
cat > "$OUTPUT_DIR/examples/common-use-cases.md" << 'EOF'
# Common Use Cases

This document covers the most common use cases and workflows.

## Project Management

### Creating a New Project

```bash
# Create a new project
mycli project create myapp --template typescript

# Create with specific options
mycli project create myapp \
  --template vue \
  --language typescript \
  --features "router,pinia,testing"
```

### Building Projects

```bash
# Development build
mycli build --env development --watch

# Production build
mycli build --env production --optimize

# Build with custom config
mycli build --config build.prod.toml
```

## Configuration Management

### Managing Settings

```bash
# View current configuration
mycli config list

# Set a configuration value
mycli config set api.timeout 60

# Set global configuration
mycli config set --global user.name "John Doe"

# Remove a setting
mycli config unset api.debug
```

## Deployment Workflows

### Basic Deployment

```bash
# Deploy to staging
mycli deploy --env staging

# Deploy to production with confirmation
mycli deploy --env production --confirm

# Deploy specific version
mycli deploy --env production --version v1.2.3
```

### Advanced Deployment

```bash
# Deploy with custom configuration
mycli deploy \
  --env production \
  --config deploy.prod.toml \
  --replicas 5 \
  --health-check /health

# Blue-green deployment
mycli deploy --strategy blue-green --env production

# Rollback deployment
mycli deploy rollback --env production --to-version v1.2.2
```

## Monitoring and Debugging

### Logs and Status

```bash
# View application status
mycli status --env production

# View logs
mycli logs --env production --tail 100

# Debug mode
mycli --verbose debug --env staging
```

### Health Checks

```bash
# Check application health
mycli health-check --env production

# Run diagnostics
mycli diagnose --comprehensive
```

## Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup CLI
        run: npm install -g mycli
      - name: Deploy
        run: mycli deploy --env production
        env:
          MYCLI_API_KEY: ${{ secrets.API_KEY }}
```

### Docker Integration

```dockerfile
FROM node:18-alpine
RUN npm install -g mycli
COPY . .
CMD ["mycli", "start", "--env", "production"]
```

## Tips and Tricks

### Aliases and Shortcuts

```bash
# Create shell aliases for common commands
alias deploy-staging="mycli deploy --env staging"
alias deploy-prod="mycli deploy --env production --confirm"
alias logs-prod="mycli logs --env production --tail 100"
```

### Configuration Templates

```bash
# Generate configuration template
mycli config template > config.toml

# Validate configuration
mycli config validate config.toml
```

### Debugging

```bash
# Enable debug mode
export MYCLI_DEBUG=true
mycli command --verbose

# Dry run mode
mycli deploy --dry-run --env production
```
EOF

# Advanced configuration example
cat > "$OUTPUT_DIR/examples/advanced-config.md" << 'EOF'
# Advanced Configuration

This guide covers advanced configuration options and patterns.

## Configuration Files

### Hierarchical Configuration

The CLI supports multiple configuration files with inheritance:

1. Global config: `~/.mycli/config.toml`
2. Project config: `./mycli.toml`
3. Environment config: `./config/production.toml`
4. Local overrides: `./mycli.local.toml`

### Configuration File Format

```toml
# mycli.toml
[metadata]
name = "My Application"
version = "1.0.0"
description = "Sample application"

[settings]
timeout = 30
retry_attempts = 3
log_level = "info"

[auth]
provider = "oauth2"
client_id = "${CLIENT_ID}"
client_secret = "${CLIENT_SECRET}"

[database]
host = "localhost"
port = 5432
name = "myapp"
ssl = true

[features]
cache = true
compression = true
analytics = false

# Environment-specific overrides
[environments.development]
log_level = "debug"
database.host = "dev-db.example.com"
features.analytics = false

[environments.staging]
database.host = "staging-db.example.com"
features.analytics = true

[environments.production]
timeout = 60
retry_attempts = 5
database.host = "prod-db.example.com"
database.ssl = true
features.analytics = true
```

## Environment Variables

### Variable Interpolation

Configuration files support environment variable interpolation:

```toml
[auth]
api_key = "${API_KEY}"
secret = "${API_SECRET:-default-secret}"

[database]
url = "${DATABASE_URL}"
password = "${DB_PASSWORD}"
```

### Environment Variable Naming

The CLI follows consistent naming conventions:

```bash
# General pattern: MYCLI_SECTION_KEY
export MYCLI_AUTH_API_KEY="your-key"
export MYCLI_DATABASE_HOST="db.example.com"
export MYCLI_FEATURES_CACHE="true"

# Special variables
export MYCLI_CONFIG="./custom-config.toml"
export MYCLI_ENV="production"
export MYCLI_DEBUG="true"
```

## Advanced Features

### Conditional Configuration

```toml
# Load different configs based on conditions
[features]
analytics = true

# Override for specific environments
[environments.development.features]
analytics = false

# Override for CI environments
[ci.features]
analytics = false
compression = false
```

### Configuration Validation

```bash
# Validate configuration
mycli config validate

# Validate specific file
mycli config validate ./config/production.toml

# Show resolved configuration
mycli config show --env production
```

### Configuration Templates

```bash
# Generate configuration template
mycli config init

# Generate environment-specific template
mycli config init --env production

# Generate from existing project
mycli config generate --from-project
```

## Profiles and Contexts

### Multiple Profiles

```toml
# ~/.mycli/config.toml
[profiles.work]
auth.api_key = "${WORK_API_KEY}"
database.host = "work-db.example.com"

[profiles.personal]
auth.api_key = "${PERSONAL_API_KEY}"
database.host = "personal-db.example.com"
```

```bash
# Use specific profile
mycli --profile work deploy

# Set default profile
mycli config set-profile work

# List available profiles
mycli config profiles
```

### Context Switching

```bash
# Set context for environment
mycli context set production

# Switch context
mycli context use staging

# List contexts
mycli context list

# Show current context
mycli context current
```

## Security Considerations

### Secrets Management

```toml
# Don't store secrets in config files
[auth]
api_key = "${API_KEY}"  # Load from environment
secret_file = "/etc/secrets/api-secret"  # Load from file

[ssl]
cert_file = "/path/to/cert.pem"
key_file = "/path/to/key.pem"
```

### File Permissions

```bash
# Secure configuration directory
chmod 700 ~/.mycli
chmod 600 ~/.mycli/config.toml

# Secure project configuration
chmod 600 mycli.local.toml
```

### Configuration Encryption

```bash
# Encrypt sensitive configuration
mycli config encrypt config.toml > config.encrypted

# Decrypt configuration
mycli config decrypt config.encrypted > config.toml

# Use encrypted config
mycli --config config.encrypted deploy
```

## Performance Tuning

### Configuration Caching

```toml
[performance]
config_cache = true
cache_ttl = 300  # 5 minutes

[features]
lazy_loading = true
parallel_processing = true
```

### Resource Limits

```toml
[limits]
max_concurrent_requests = 10
timeout = 30
memory_limit = "512MB"
cpu_limit = "1000m"
```

## Debugging Configuration

### Configuration Debugging

```bash
# Show resolved configuration
mycli config debug

# Show configuration sources
mycli config debug --sources

# Validate and show errors
mycli config validate --verbose

# Trace configuration resolution
mycli --debug config show
```

### Environment Debugging

```bash
# Show all environment variables
mycli env

# Show CLI-specific variables
mycli env --filter MYCLI_

# Test configuration with different environment
MYCLI_ENV=staging mycli config show
```
EOF

success "Examples created in: $OUTPUT_DIR/examples/"

# Create API documentation directory if needed
mkdir -p "$OUTPUT_DIR/api"

cat > "$OUTPUT_DIR/api/README.md" << 'EOF'
# API Documentation

This directory contains API documentation for programmatic usage.

## JSON Schema

The [`../cli.schema.json`](../cli.schema.json) file contains the complete JSON schema for the CLI configuration and command structure.

## TypeScript Types

Generate TypeScript types from the schema:

```bash
# Using json-schema-to-typescript
npx json-schema-to-typescript cli.schema.json > types.ts

# Using quicktype
npx quicktype cli.schema.json -o types.ts --lang typescript
```

## Integration Examples

### Node.js Integration

```javascript
const { spawn } = require('child_process');
const { promisify } = require('util');

class CLIWrapper {
  async run(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('mycli', [command, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: code });
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
        }
      });
    });
  }
  
  async deploy(env, options = {}) {
    const args = ['deploy', '--env', env];
    if (options.dryRun) args.push('--dry-run');
    if (options.version) args.push('--version', options.version);
    
    return this.run('deploy', args);
  }
}

// Usage
const cli = new CLIWrapper();
cli.deploy('production', { version: 'v1.2.3' })
  .then(result => console.log('Deploy successful:', result.stdout))
  .catch(error => console.error('Deploy failed:', error));
```

### Python Integration

```python
import subprocess
import json
from typing import Dict, List, Optional

class CLIWrapper:
    def __init__(self, binary_path: str = 'mycli'):
        self.binary_path = binary_path
    
    def run(self, command: str, args: List[str] = None, **kwargs) -> Dict:
        """Run CLI command and return result"""
        args = args or []
        cmd = [self.binary_path, command] + args
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            **kwargs
        )
        
        return {
            'stdout': result.stdout,
            'stderr': result.stderr,
            'exit_code': result.returncode,
            'success': result.returncode == 0
        }
    
    def deploy(self, env: str, dry_run: bool = False, version: Optional[str] = None) -> Dict:
        """Deploy to environment"""
        args = ['--env', env]
        if dry_run:
            args.append('--dry-run')
        if version:
            args.extend(['--version', version])
        
        return self.run('deploy', args)
    
    def get_status(self, env: str) -> Dict:
        """Get deployment status"""
        result = self.run('status', ['--env', env, '--format', 'json'])
        if result['success']:
            return json.loads(result['stdout'])
        return result

# Usage
cli = CLIWrapper()
result = cli.deploy('production', version='v1.2.3')
if result['success']:
    print('Deploy successful')
else:
    print(f'Deploy failed: {result["stderr"]}')
```

### REST API Wrapper

```javascript
// If the CLI has an API mode
class CLIAPIClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  async request(endpoint, method = 'GET', body = null) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : null,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async deploy(env, config) {
    return this.request('/deploy', 'POST', { env, config });
  }
  
  async getStatus(env) {
    return this.request(`/status/${env}`);
  }
}
```
EOF

success "API documentation created: $OUTPUT_DIR/api/"

# Create a documentation build script
cat > "$OUTPUT_DIR/build-docs.sh" << EOF
#!/bin/bash
# Build script for documentation

set -e

echo "Building documentation..."

# Regenerate docs from usage file
if [[ -f "../$USAGE_FILE" ]]; then
    echo "Regenerating from usage file..."
    usage generate markdown -f "../$USAGE_FILE" > "${CLI_NAME}.md"
    usage generate json -f "../$USAGE_FILE" > "${CLI_NAME}.schema.json"
    usage generate manpage -f "../$USAGE_FILE" > "${CLI_NAME}.1"
fi

# Build static site (if using a static site generator)
if command -v mkdocs &> /dev/null && [[ -f "mkdocs.yml" ]]; then
    echo "Building with MkDocs..."
    mkdocs build
elif command -v hugo &> /dev/null && [[ -f "config.yaml" ]]; then
    echo "Building with Hugo..."
    hugo
elif command -v vitepress &> /dev/null && [[ -f ".vitepress/config.js" ]]; then
    echo "Building with VitePress..."
    vitepress build
fi

echo "Documentation build complete!"
EOF

chmod +x "$OUTPUT_DIR/build-docs.sh"
success "Build script created: $OUTPUT_DIR/build-docs.sh"

# Summary
echo
log "Documentation generation complete!"
echo
log "Generated files:"
echo "  📁 $OUTPUT_DIR/"
echo "    ├── ${CLI_NAME}.md (Command reference)"
echo "    ├── ${CLI_NAME}.schema.json (JSON schema)"
echo "    ├── ${CLI_NAME}.1 (Manual page)"
echo "    ├── README.md (Documentation index)"
echo "    ├── build-docs.sh (Build script)"
echo "    ├── examples/"
echo "    │   ├── getting-started.md"
echo "    │   ├── common-use-cases.md"
echo "    │   └── advanced-config.md"
echo "    └── api/"
echo "        └── README.md (API documentation)"
echo
log "To view the manual page:"
echo "  man $OUTPUT_DIR/${CLI_NAME}.1"
echo
log "To build the documentation:"
echo "  cd $OUTPUT_DIR && ./build-docs.sh"