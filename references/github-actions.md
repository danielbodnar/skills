# GitHub Actions Reference

**Always remember to reference @$HOME/.claude/references/github-actions.md and look for snippets and examples in @$HOME/.claude/snippets/github-actions/**

## Quick Reference

- Workflow files: `.github/workflows/*.yml`
- Documentation: [GitHub Actions Docs](https://docs.github.com/en/actions)
- Marketplace: [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- Security: [GitHub Actions Security](https://docs.github.com/en/actions/security-for-github-actions)

## Default Usage Patterns

Default to using GitHub Actions for CI/CD automation and workflow management:

- Use latest action versions (e.g., `actions/checkout@v4`, `actions/setup-node@v4`)
- Use `actions/cache@v4` for dependency caching with proper cache keys
- Use OIDC authentication with cloud providers instead of static credentials
- Use environment protection rules for production deployments
- Use artifact attestations for build provenance and security

### Workflow Syntax

- `.github/workflows/*.yml` for workflow definitions
- `on:` for trigger events (push, pull_request, schedule, workflow_dispatch)
- `jobs:` for defining workflow jobs with dependencies
- `steps:` for individual workflow steps
- `uses:` for reusing actions from marketplace or local
- `run:` for executing shell commands

### Key Actions

- `actions/checkout@v4` for repository checkout. Use `fetch-depth: 0` for full history.
- `actions/setup-node@v4` for Node.js with cache support
- `oven-sh/setup-bun@v1` for Bun runtime
- `actions/cache@v4` for dependency and build caching
- `actions/upload-artifact@v4` and `actions/download-artifact@v4` for artifact management
- `docker/build-push-action@v5` for container builds with cache

### Security Best Practices

- Use `permissions:` to limit GITHUB_TOKEN scope
- Use OpenID Connect (OIDC) for cloud authentication
- Store sensitive data in GitHub Secrets
- Use environment protection rules for production
- Generate build attestations with `actions/attest-build-provenance@v1`

## Resources and Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
  - [Workflow Syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
  - [Events and Triggers](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs)
  - [Expressions and Contexts](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/expressions)
  - [Environment Variables](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/variables)
  - [Secrets Management](https://docs.github.com/en/actions/security-for-github-actions/using-secrets-in-github-actions)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-for-github-actions)
  - [Security Hardening](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-for-github-actions)
  - [OpenID Connect](https://docs.github.com/en/actions/security-for-github-actions/about-security-hardening-with-openid-connect)
  - [Permissions](https://docs.github.com/en/actions/security-for-github-actions/automatic-token-authentication)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
  - [Official Actions](https://github.com/actions)
  - [Community Actions](https://github.com/marketplace?type=actions&query=sort%3Apopularity)
- [GitHub CLI Integration](https://cli.github.com/manual/gh_workflow)

## Core Concepts

### Workflow Structure

```yaml
name: Workflow Name
on: [push, pull_request]  # Triggers
env:                      # Global environment variables
  NODE_VERSION: '20'
jobs:                     # Workflow jobs
  job-name:
    runs-on: ubuntu-latest
    steps:                # Job steps
    - name: Step name
      uses: action@version  # or run: command
```

### Event Triggers

- **push**: Code pushed to repository
- **pull_request**: PR opened, synchronized, reopened
- **schedule**: Cron-based scheduling
- **workflow_dispatch**: Manual trigger with inputs
- **release**: Release published/created
- **issues**: Issue opened, labeled, etc.
- **workflow_run**: Triggered by other workflow completion

### Contexts and Expressions

- `${{ github.* }}`: GitHub context (repository, actor, SHA, etc.)
- `${{ runner.* }}`: Runner context (OS, architecture, etc.)
- `${{ env.* }}`: Environment variables
- `${{ secrets.* }}`: Repository secrets
- `${{ steps.*.outputs.* }}`: Step outputs
- `${{ needs.*.outputs.* }}`: Job outputs

### Functions

- `contains(string, substring)`: String contains check
- `startsWith(string, prefix)`: String starts with check
- `endsWith(string, suffix)`: String ends with check
- `format(template, ...args)`: String formatting
- `hashFiles(pattern)`: Generate hash of matching files
- `toJSON(value)`: Convert to JSON
- `fromJSON(string)`: Parse JSON

## Essential Actions

### Repository Actions

- **actions/checkout@v4**: Clone repository
  - `fetch-depth: 0`: Full history
  - `token: ${{ secrets.PAT }}`: Custom token
  - `path: custom-path`: Clone to specific path
  - `sparse-checkout: |`: Partial checkout

### Runtime Setup

- **actions/setup-node@v4**: Node.js runtime
  - `node-version: '20'`: Specific version
  - `cache: 'npm'`: Cache package manager
  - `registry-url: 'https://registry.npmjs.org'`: Custom registry
- **oven-sh/setup-bun@v1**: Bun runtime
- **actions/setup-python@v5**: Python runtime
- **actions/setup-go@v5**: Go runtime
- **dtolnay/rust-toolchain@stable**: Rust toolchain

### Caching

- **actions/cache@v4**: General caching
  - `path: ~/.npm`: Cache directory
  - `key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}`: Cache key
  - `restore-keys: |`: Fallback keys
- **actions/cache/restore@v4**: Restore-only cache
- **actions/cache/save@v4**: Save-only cache

### Artifacts

- **actions/upload-artifact@v4**: Upload build artifacts
  - `name: artifact-name`: Artifact name
  - `path: dist/`: Files to upload
  - `retention-days: 30`: Retention period
- **actions/download-artifact@v4**: Download artifacts
  - `name: artifact-name`: Specific artifact
  - `path: ./artifacts`: Download location

### Container Operations

- **docker/setup-buildx-action@v4**: Docker Buildx
- **docker/login-action@v4**: Registry login
- **docker/build-push-action@v5**: Build and push containers
- **docker/metadata-action@v5**: Extract container metadata

### Security and Attestation

- **actions/attest-build-provenance@v1**: Generate build attestations
- **github/codeql-action/upload-sarif@v4**: Upload SARIF security results
- **step-security/harden-runner@v2**: Workflow hardening

## Caching Patterns

### Language-Specific Cache Paths

#### JavaScript/Node.js

```yaml
# npm
path: ~/.npm
key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# yarn
path: ~/.cache/yarn
key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}

# Bun (Linux/macOS)
path: ~/.bun/install/cache
key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}

# Bun (Windows)
path: ~/.bun
key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
```

#### Other Languages

```yaml
# Python pip
path: ~/.cache/pip
key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}

# Go
path: |
  ~/.cache/go-build
  ~/go/pkg/mod
key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}

# Rust
path: |
  ~/.cargo/registry
  ~/.cargo/git
  target/
key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}

# Java Maven
path: ~/.m2/repository
key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}

# Java Gradle
path: |
  ~/.gradle/caches
  ~/.gradle/wrapper
key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
```

## Security Best Practices

### Token Permissions

```yaml
permissions:
  contents: read          # Repository content
  packages: write        # Package registry
  security-events: write # Security scanning
  actions: read          # Workflow metadata
  deployments: write     # Environment deployments
  attestations: write    # Build attestations
  id-token: write        # OIDC tokens
```

### OIDC Authentication

```yaml
# AWS
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ vars.AWS_ROLE_ARN }}
    role-session-name: GitHubActions-${{ github.run_id }}
    aws-region: ${{ vars.AWS_REGION }}

# Azure
- name: Azure Login
  uses: azure/login@v1
  with:
    client-id: ${{ vars.AZURE_CLIENT_ID }}
    tenant-id: ${{ vars.AZURE_TENANT_ID }}
    subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}

# Google Cloud
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ vars.WIF_PROVIDER }}
    service_account: ${{ vars.WIF_SERVICE_ACCOUNT }}
```

### Environment Protection

```yaml
environment:
  name: production
  url: https://example.com
# Requires manual approval and protection rules in GitHub UI
```

### Secrets Management

- Use GitHub Secrets for sensitive data
- Environment-specific secrets: `${{ secrets.PROD_API_KEY }}`
- Organization secrets for shared resources
- Never echo secrets in logs
- Use OIDC instead of long-lived credentials

## Workflow Patterns

### Matrix Testing

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    version: [18, 20, 22]
    include:
      - os: ubuntu-latest
        cache-path: ~/.npm
    exclude:
      - os: windows-latest
        version: 18
  fail-fast: false
```

### Conditional Execution

```yaml
# Job-level conditions
if: github.ref == 'refs/heads/main'

# Step-level conditions
- name: Deploy
  if: success() && github.event_name == 'push'
  run: echo "Deploying..."

# Complex conditions
if: |
  github.event_name == 'push' &&
  github.ref == 'refs/heads/main' &&
  !contains(github.event.head_commit.message, '[skip ci]')
```

### Reusable Workflows

```yaml
# Caller workflow
jobs:
  call-reusable:
    uses: ./.github/workflows/reusable.yml
    with:
      node_version: '20'
      environment: 'staging'
    secrets:
      API_KEY: ${{ secrets.API_KEY }}

# Reusable workflow
on:
  workflow_call:
    inputs:
      node_version:
        required: false
        type: string
        default: '20'
    secrets:
      API_KEY:
        required: true
    outputs:
      build_version:
        value: ${{ jobs.build.outputs.version }}
```

### Custom Actions

```yaml
# JavaScript action
uses: ./.github/actions/custom-js-action
with:
  input1: value1

# Docker action
uses: ./.github/actions/docker-action
with:
  dockerfile_path: './Dockerfile'

# Composite action
uses: ./.github/actions/composite-action
with:
  setup_node: true
```

## Monitoring and Notifications

### Status Checks

```yaml
# Always run cleanup
- name: Cleanup
  if: always()
  run: echo "Cleaning up..."

# Run on failure
- name: Notify on failure
  if: failure()
  run: echo "Workflow failed!"

# Check job status
needs: build
if: needs.build.result == 'success'
```

### Notifications

```yaml
# Slack notification
- name: Slack Notification
  uses: slackapi/slack-github-action@v1.26.0
  with:
    channel-id: 'deployments'
    slack-message: 'Deployment completed!'
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}

# Email notification
- name: Send mail
  uses: dawidd6/action-send-mail@v4
  with:
    server_address: smtp.gmail.com
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: 'Build Status'
    to: team@example.com
    from: actions@example.com
```

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/github-actions/`:

- Basic workflow patterns and CI/CD
- Matrix testing strategies
- Advanced caching configurations
- Security and OIDC patterns
- Environment management
- Artifact handling
- Monitoring and notifications
- Reusable workflow patterns

## Performance Optimization

- Use caching for dependencies and build outputs
- Leverage matrix builds for parallel execution
- Use conditional execution to skip unnecessary steps
- Optimize Docker builds with multi-stage and cache
- Use artifact compression and retention policies
- Cache between workflow runs with restore keys

## Troubleshooting

- Check workflow run logs in GitHub Actions tab
- Use debug logging: `ACTIONS_RUNNER_DEBUG: true`
- Verify permissions for GITHUB_TOKEN
- Check cache hit/miss ratios
- Validate YAML syntax and expressions
- Test workflows with `act` for local development
