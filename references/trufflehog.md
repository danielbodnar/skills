# TruffleHog Reference

**Always reference this file for TruffleHog usage patterns and look for snippets in ~/.claude/snippets/trufflehog/**

## Quick Reference

- **Repository**: <https://github.com/trufflesecurity/trufflehog>
- **License**: AGPL-3.0 (since v3.0)
- **Language**: Go
- **Purpose**: Secrets detection and credential scanning across multiple sources

## Overview

TruffleHog is a powerful open-source secrets scanning tool designed to discover, classify, validate, and analyze credentials across various sources. It can detect over 800 types of secrets and verify their validity against live services.

### Key Capabilities

- **Multi-Source Scanning**: Git repositories, GitHub/GitLab, cloud storage, filesystems, Docker images
- **Secret Verification**: Validates discovered credentials against live APIs
- **Custom Detectors**: Support for custom regex patterns and verification endpoints
- **CI/CD Integration**: GitHub Actions, GitLab CI, pre-commit hooks
- **Advanced Analysis**: Permission analysis for discovered credentials
- **Cross-Fork Detection**: Scans deleted commits and cross-fork object references

## Installation

### Package Managers

```bash
# macOS with Homebrew
brew install trufflehog

# Install from script
curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin

# Verify signature (requires cosign)
curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -v -b /usr/local/bin
```

### Docker

```bash
# Basic usage
docker run --rm -it -v "$PWD:/pwd" trufflesecurity/trufflehog:latest

# Scan GitHub repository
docker run --rm -it -v "$PWD:/pwd" trufflesecurity/trufflehog:latest github --repo https://github.com/example/repo

# With SSH authentication
docker run --rm -v "$HOME/.ssh:/root/.ssh:ro" trufflesecurity/trufflehog:latest git ssh://github.com/example/repo
```

### From Source

```bash
git clone https://github.com/trufflesecurity/trufflehog.git
cd trufflehog
go install
```

## Core Usage Patterns

### Basic Scanning Commands

#### Git Repository Scanning

```bash
# Scan remote Git repository
trufflehog git https://github.com/example/repo

# Scan local Git repository
trufflehog git file://path/to/repo

# Scan with result filtering
trufflehog git https://github.com/example/repo --results=verified,unknown

# Scan specific branch
trufflehog git https://github.com/example/repo --branch=development

# Scan since specific commit
trufflehog git https://github.com/example/repo --since-commit=abc123

# Scan with maximum depth
trufflehog git https://github.com/example/repo --max-depth=50
```

#### GitHub/GitLab Scanning

```bash
# Scan GitHub organization
trufflehog github --org=organizationname

# Scan specific GitHub repository
trufflehog github --repo=https://github.com/example/repo

# Include issues and PR comments
trufflehog github --repo=https://github.com/example/repo --issue-comments --pr-comments

# Scan GitLab organization
trufflehog gitlab --org=organizationname
```

#### Filesystem Scanning

```bash
# Scan directories and files
trufflehog filesystem /path/to/directory

# Scan multiple paths
trufflehog filesystem file1.txt file2.txt /path/to/dir

# Scan with custom configuration
trufflehog filesystem /path/to/scan --config=config.yaml
```

#### Cloud Storage Scanning

```bash
# Scan S3 bucket
trufflehog s3 --bucket=mybucket --results=verified,unknown

# S3 with IAM role
trufflehog s3 --bucket=mybucket --role-arn=arn:aws:iam::123456789012:role/MyRole

# Scan all accessible S3 buckets
trufflehog s3 --role-arn=arn:aws:iam::123456789012:role/Role1 --role-arn=arn:aws:iam::123456789012:role/Role2

# Google Cloud Storage
trufflehog gcs --project-id=my-project --cloud-environment --results=verified,unknown
```

#### Container and Image Scanning

```bash
# Scan Docker image
trufflehog docker --image=myimage:latest --results=verified,unknown

# Scan multiple images
trufflehog docker --image=image1:latest --image=image2:latest
```

### Advanced Scanning Options

#### Output Formats and Filtering

```bash
# JSON output
trufflehog git https://github.com/example/repo --json

# GitHub Actions format
trufflehog git https://github.com/example/repo --github-actions

# Filter by result types
trufflehog git https://github.com/example/repo --results=verified,unknown,unverified

# Filter unverified results by entropy
trufflehog git https://github.com/example/repo --filter-entropy=3.0

# Exit with error code if secrets found
trufflehog git https://github.com/example/repo --fail
```

#### Detector Configuration

```bash
# Include specific detectors
trufflehog git https://github.com/example/repo --include-detectors=aws,github,slack

# Exclude specific detectors
trufflehog git https://github.com/example/repo --exclude-detectors=generic

# Disable verification
trufflehog git https://github.com/example/repo --no-verification

# Custom verification endpoints
trufflehog git https://github.com/example/repo --verifier=https://my-verifier.com/verify
```

#### Path and File Filtering

```bash
# Include paths (regex file)
trufflehog git https://github.com/example/repo --include-paths=include-patterns.txt

# Exclude paths (regex file)
trufflehog git https://github.com/example/repo --exclude-paths=exclude-patterns.txt

# Exclude globs (faster filtering)
trufflehog git https://github.com/example/repo --exclude-globs="*.log,*.tmp,node_modules/*"
```

## Custom Detectors

### Configuration File Structure

```yaml
# config.yaml
detectors:
  - name: MyAPIKeyDetector
    keywords:
      - myapi
      - apikey
    regex:
      token: 'myapi_[A-Za-z0-9]{32}'
    verify:
      - endpoint: https://api.example.com/validate
        unsafe: false
        headers:
          - "Authorization: Bearer validation-token"
    entropy: 3.0
    exclude_words:
      - example
      - test
      - dummy
```

### Advanced Custom Detector Options

```yaml
detectors:
  - name: ComplexDetector
    keywords:
      - secret
    regex:
      primary_key: 'sk_[A-Za-z0-9]{48}'
      secondary_key: 'sec_[A-Za-z0-9]{32}'
    primary_regex_name: primary_key
    exclude_regexes_capture:
      - 'test.*'
    exclude_regexes_match:
      - '.*example.*'
    verify:
      - endpoint: https://api.example.com/verify
        headers:
          - "Content-Type: application/json"
```

### Custom Verification Server

```python
# Python verification server example
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

class Verifier(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.headers['Authorization'] != 'expected-auth-header':
            self.send_response(401)
            self.end_headers()
            return

        length = int(self.headers['Content-Length'])
        request = json.loads(self.rfile.read(length))
        
        # Validate the token
        if validate_token(request['MyAPIKeyDetector']['token']):
            self.send_response(200)  # Valid
        else:
            self.send_response(403)  # Invalid
        self.end_headers()

def validate_token(token):
    # Implement validation logic
    return token.startswith('myapi_') and len(token) == 38

with HTTPServer(('', 8000), Verifier) as server:
    server.serve_forever()
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Secret Scanning
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  scan-secrets:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
        
    - name: TruffleHog Secret Scan
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: ${{ github.ref_name }}
        extra_args: --results=verified,unknown --fail
```

### GitLab CI

```yaml
stages:
  - security

secret-scan:
  stage: security
  image: alpine:latest
  variables:
    SCAN_PATH: "."
  before_script:
    - apk add --no-cache git curl jq
    - curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin
  script:
    - trufflehog filesystem "$SCAN_PATH" --results=verified,unknown --fail --json | jq
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

### Pre-commit Hooks

#### Using pre-commit framework

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: trufflehog
        name: TruffleHog Secret Scan
        description: Detect secrets in your data
        entry: bash -c 'trufflehog git file://. --since-commit HEAD --results=verified,unknown --fail'
        language: system
        stages: ["pre-commit", "pre-push"]
```

#### Global Git hooks

```bash
# Set up global pre-commit hook
mkdir -p ~/.git-hooks
chmod +x ~/.git-hooks/pre-commit

# ~/.git-hooks/pre-commit
#!/bin/sh
trufflehog git file://. --since-commit HEAD --results=verified,unknown --fail

# Configure Git to use global hooks
git config --global core.hooksPath ~/.git-hooks
```

#### Husky integration

```bash
# Install Husky
npm install husky --save-dev
npx husky init

# Add TruffleHog to pre-commit hook
echo "trufflehog git file://. --since-commit HEAD --results=verified,unknown --fail" > .husky/pre-commit
```

## Advanced Features

### Multi-Source Configuration

```yaml
# multi-scan-config.yaml
sources:
  - connection:
      '@type': type.googleapis.com/sources.GitHub
      repositories:
        - https://github.com/example/repo1.git
        - https://github.com/example/repo2.git
      unauthenticated: {}
    name: github-scan
    type: SOURCE_TYPE_GITHUB
    verify: true
    
  - connection:
      '@type': type.googleapis.com/sources.S3
      buckets:
        - bucket-name-1
        - bucket-name-2
    name: s3-scan
    type: SOURCE_TYPE_S3
    verify: true
```

### Cross-Fork Object Discovery

```bash
# Scan for deleted commits and cross-fork references (alpha feature)
trufflehog github-experimental --repo https://github.com/example/repo.git --object-discovery

# Clean up cached data
trufflehog github-experimental --repo https://github.com/example/repo.git --object-discovery --delete-cached-data
```

### Credential Analysis

```bash
# Analyze discovered credentials for permissions
trufflehog analyze
```

### Standard Input Scanning

```bash
# Pipe data to TruffleHog
aws s3 cp s3://bucket/file.gz - | gunzip -c | trufflehog stdin

# Scan data from other commands
cat sensitive-file.txt | trufflehog stdin --results=verified,unknown
```

## Output Formats

### JSON Output Structure

```json
{
  "SourceMetadata": {
    "Data": {
      "Git": {
        "commit": "abc123...",
        "file": "config/database.yml",
        "email": "user@example.com",
        "repository": "https://github.com/example/repo",
        "timestamp": "2023-01-01T00:00:00Z"
      }
    }
  },
  "SourceID": 1,
  "SourceType": 16,
  "SourceName": "trufflehog - git",
  "DetectorType": 2,
  "DetectorName": "AWS",
  "DecoderName": "PLAIN",
  "Verified": true,
  "Raw": "AKIAIOSFODNN7EXAMPLE",
  "RawV2": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "Redacted": "AKIA****************",
  "ExtraData": {
    "account": "123456789012",
    "arn": "arn:aws:iam::123456789012:user/example"
  }
}
```

### Filtering and Processing

```bash
# Filter JSON output with jq
trufflehog git https://github.com/example/repo --json | jq '.[] | select(.Verified == true)'

# Count secrets by type
trufflehog git https://github.com/example/repo --json | jq 'group_by(.DetectorName) | map({detector: .[0].DetectorName, count: length})'

# Extract only verified AWS secrets
trufflehog git https://github.com/example/repo --json | jq '.[] | select(.DetectorName == "AWS" and .Verified == true)'
```

## Security Best Practices

### Safe Scanning Practices

1. **Network Security**: Use VPNs and secure networks when scanning external repositories
2. **Access Control**: Limit scanner permissions and use read-only access where possible
3. **Output Security**: Secure storage and transmission of scan results
4. **Credential Handling**: Immediate rotation of discovered live credentials

### Verification Considerations

```bash
# Disable verification in sensitive environments
trufflehog git https://github.com/example/repo --no-verification

# Use custom verification endpoints for air-gapped environments
trufflehog git https://github.com/example/repo --verifier=https://internal-verifier.company.com/verify --custom-verifiers-only
```

### Rate Limiting and Performance

```bash
# Control concurrency for rate-limited APIs
trufflehog git https://github.com/example/repo --concurrency=5

# Set archive limits for performance
trufflehog filesystem /path --archive-max-size=100MB --archive-max-depth=5 --archive-timeout=5m

# Print detector performance metrics
trufflehog git https://github.com/example/repo --print-avg-detector-time
```

## Troubleshooting

### Common Issues and Solutions

#### Performance Issues

```bash
# Use exclude globs for faster scanning
trufflehog git https://github.com/example/repo --exclude-globs="*.log,*.cache,node_modules/*,vendor/*"

# Limit archive processing
trufflehog filesystem /path --archive-max-size=50MB --archive-timeout=2m
```

#### False Positives

```bash
# Use entropy filtering
trufflehog git https://github.com/example/repo --filter-entropy=3.5

# Exclude specific paths
echo "test/*" > exclude-patterns.txt
echo "*.example" >> exclude-patterns.txt
trufflehog git https://github.com/example/repo --exclude-paths=exclude-patterns.txt
```

#### Verification Issues

```bash
# Check verification overlap
trufflehog git https://github.com/example/repo --allow-verification-overlap

# Debug with increased verbosity
trufflehog git https://github.com/example/repo --log-level=3
```

### Debugging Commands

```bash
# Enable profiling
trufflehog git https://github.com/example/repo --profile

# Verbose logging levels (0-5)
trufflehog git https://github.com/example/repo --log-level=5
```

## Integration Examples

### Scanning Workflows

#### Daily Security Scan

```bash
#!/bin/bash
# daily-scan.sh

REPOS=(
  "https://github.com/company/repo1"
  "https://github.com/company/repo2"
  "https://github.com/company/repo3"
)

RESULTS_DIR="/var/log/trufflehog/$(date +%Y-%m-%d)"
mkdir -p "$RESULTS_DIR"

for repo in "${REPOS[@]}"; do
  repo_name=$(basename "$repo" .git)
  echo "Scanning $repo_name..."
  
  trufflehog git "$repo" \
    --results=verified,unknown \
    --json \
    --no-update \
    > "$RESULTS_DIR/${repo_name}.json" 2>&1
    
  if [ $? -eq 183 ]; then
    echo "⚠️  Secrets found in $repo_name"
    # Send alert
  fi
done
```

#### Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: trufflehog-scan
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: trufflehog
            image: trufflesecurity/trufflehog:latest
            command:
            - /bin/sh
            - -c
            - |
              trufflehog github --org=myorg --results=verified,unknown --json > /tmp/scan-results.json
              if [ $? -eq 183 ]; then
                echo "Secrets detected, sending alert..."
                # Add alerting logic here
              fi
            env:
            - name: GITHUB_TOKEN
              valueFrom:
                secretKeyRef:
                  name: github-token
                  key: token
          restartPolicy: OnFailure
```

### Monitoring and Alerting

```bash
# Slack notification on secret detection
#!/bin/bash
scan_result=$(trufflehog git https://github.com/example/repo --results=verified --json)
exit_code=$?

if [ $exit_code -eq 183 ]; then
  secret_count=$(echo "$scan_result" | jq length)
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 $secret_count verified secrets detected in repository\"}" \
    "$SLACK_WEBHOOK_URL"
fi
```

## Development and Testing

### Creating Custom Detectors

```bash
# Generate detector boilerplate
go run hack/generate/generate.go detector MyDetector

# Update protocol buffers
make protos

# Test detector
go test ./pkg/detectors/mydetector -tags=detectors
```

### Testing Environment Setup

```bash
# Set up test environment
export TEST_SECRET_FILE=".env"
echo "MY_SECRET=real_secret_value" > .env
echo "MY_SECRET_INACTIVE=fake_secret_value" >> .env

# Run detector tests
go test ./pkg/detectors/mysecret -tags=detectors
```

## Performance Tuning

### Optimization Strategies

```bash
# Concurrent processing tuning
trufflehog git https://github.com/example/repo --concurrency=10

# Memory-efficient scanning for large repositories
trufflehog git https://github.com/example/repo \
  --exclude-globs="*.zip,*.tar.gz,*.jar" \
  --archive-max-size=10MB \
  --filter-entropy=3.0

# Network optimization for remote repositories
trufflehog git https://github.com/example/repo \
  --max-depth=100 \
  --no-verification
```

### Resource Monitoring

```bash
# Monitor performance metrics
trufflehog git https://github.com/example/repo \
  --print-avg-detector-time \
  --profile \
  --log-level=2
```

## Code Examples Location

Comprehensive examples available in `~/.claude/snippets/trufflehog/`:

- Basic CLI usage patterns
- Custom detector configurations
- CI/CD integration examples
- Verification server implementations
- Performance optimization techniques
- Output processing scripts
- Security automation workflows

## Common Integration Patterns

### Enterprise Security Workflows

- Continuous security monitoring
- Incident response automation
- Compliance reporting
- Secret rotation workflows
- Developer education programs

### DevSecOps Integration

- Shift-left security practices
- Automated remediation workflows
- Security metrics and reporting
- Policy as code implementation
- Risk assessment automation

The TruffleHog tool provides comprehensive secret detection capabilities that can be integrated into various security workflows, from local development to enterprise-scale security operations.
