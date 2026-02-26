# MegaLinter Reference

**Always remember to reference ./references/megalinter.md and look for snippets and examples in ./snippets/megalinter/**

## Quick Reference

- Installation: `npm install mega-linter-runner` or Docker/GitHub Actions
- Run: `npx mega-linter-runner` or `mega-linter-runner --flavor javascript`
- Configuration: `.mega-linter.yml` in project root
- Documentation: <https://megalinter.io/latest/>
- GitHub: <https://github.com/oxsecurity/megalinter>
- Docker Hub: <https://hub.docker.com/r/oxsecurity/megalinter>

## Overview

MegaLinter is a comprehensive code quality and consistency checking tool that analyzes 65 languages, 23 formats, and 20 tooling formats. It's designed for CI/CD workflows and integrates seamlessly with multiple platforms including GitHub Actions, GitLab CI, Azure Pipelines, and more.

## Key Features

- **Multi-Language Support**: Analyzes 65+ programming languages and formats
- **50+ Built-in Linters**: Including ESLint, Prettier, golangci-lint, RuboCop, Black, and more
- **Auto-Fix Capabilities**: Automatically fix linting issues where supported
- **CI/CD Integration**: Works with GitHub Actions, GitLab, Azure, Bitbucket, Jenkins
- **Customizable Flavors**: Pre-configured sets of linters for specific tech stacks
- **Multiple Reporters**: GitHub comments, console output, SARIF, JSON, HTML reports
- **Security Scanning**: Built-in security linters like TruffleHog, Semgrep
- **Infrastructure as Code**: Linting for Terraform, Kubernetes, Docker, CloudFormation

## Resources and Documentation

- [MegaLinter Documentation](https://megalinter.io/latest/)
  - [Installation Guide](https://megalinter.io/latest/installation/)
  - [Configuration](https://megalinter.io/latest/configuration/)
  - [Supported Linters](https://megalinter.io/latest/supported-linters/)
  - [Flavors](https://megalinter.io/latest/flavors/)
  - [Reporters](https://megalinter.io/latest/reporters/)
  - [CI/CD Integration](https://megalinter.io/latest/install-assisted/)
- [GitHub Repository](https://github.com/oxsecurity/megalinter)
  - [GitHub Actions Marketplace](https://github.com/marketplace/actions/megalinter)
  - [Issues and Discussions](https://github.com/oxsecurity/megalinter/issues)
  - [Release Notes](https://github.com/oxsecurity/megalinter/releases)
- [Docker Images](https://hub.docker.com/r/oxsecurity/megalinter)
  - [Available Flavors](https://hub.docker.com/r/oxsecurity/megalinter/tags)
  - [Multi-platform Support](https://hub.docker.com/r/oxsecurity/megalinter-javascript/tags)

## Installation Methods

### 1. NPM (Recommended for Local Development)

```bash
# Install globally
npm install mega-linter-runner -g

# Or run directly with npx
npx mega-linter-runner

# Install locally in project
npm install mega-linter-runner --save-dev
```

### 2. GitHub Actions

```yaml
# Use in .github/workflows/megalinter.yml
- name: MegaLinter
  uses: oxsecurity/megalinter@v8
  env:
    DEFAULT_BRANCH: main
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Docker

```bash
# Pull and run MegaLinter
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter:latest

# Use specific flavor
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter-javascript:latest
```

### 4. GitLab CI

```yaml
# Add to .gitlab-ci.yml
megalinter:
  stage: test
  image: oxsecurity/megalinter:latest
  script: [ "true" ]
  variables:
    DEFAULT_BRANCH: main
```

## Core Configuration

### Basic .mega-linter.yml Configuration

```yaml
# Apply linters to all files or specific directories
APPLY_FIXES: all              # Apply fixes automatically
DEFAULT_BRANCH: main          # Default branch name
FILEIO_REPORTER: true         # Enable file output
SHOW_ELAPSED_TIME: true       # Show execution time
PARALLEL: true                # Run linters in parallel

# Language and format activation
ENABLE_LINTERS:
  - JAVASCRIPT_ES
  - TYPESCRIPT_ES
  - JSON_JSONLINT
  - YAML_YAMLLINT
  - MARKDOWN_MARKDOWNLINT

# Disable specific linters
DISABLE_LINTERS:
  - SPELL_CSPELL
  - COPYPASTE_JSCPD

# Filter linted files
FILTER_REGEX_INCLUDE: "(src/|scripts/)"
FILTER_REGEX_EXCLUDE: "(node_modules/|\.git/)"

# Pre and post commands
PRE_COMMANDS:
  - command: npm install
    cwd: "workspace"

POST_COMMANDS:
  - command: npm run test
    cwd: "workspace"
```

### Advanced Configuration Options

```yaml
# Reporter configuration
REPORTERS:
  - console
  - github_comment
  - github_status
  - sarif
  - json

# Custom linter configurations
JAVASCRIPT_ES_CONFIG_FILE: .eslintrc.json
TYPESCRIPT_ES_CONFIG_FILE: .eslintrc.json
MARKDOWN_MARKDOWNLINT_CONFIG_FILE: .markdownlint.json

# Override linter rules
JAVASCRIPT_ES_RULES_PATH: .eslintrc.json
TYPESCRIPT_ES_DISABLE_ERRORS: true

# File exclusions per linter
JAVASCRIPT_FILTER_REGEX_EXCLUDE: "(test/|spec/)"
TYPESCRIPT_FILTER_REGEX_EXCLUDE: "(\\.d\\.ts$)"

# Custom Docker image
CONTAINER_IMAGE_ID: custom/megalinter:latest
```

## Available Flavors

MegaLinter provides pre-configured flavors for specific technology stacks:

### JavaScript/TypeScript Flavor

```bash
# Use JavaScript-focused linters
mega-linter-runner --flavor javascript

# Docker
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter-javascript:latest
```

### Python Flavor

```bash
mega-linter-runner --flavor python
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter-python:latest
```

### Go Flavor

```bash
mega-linter-runner --flavor go
docker run --rm -v $(pwd):/tmp/lint oxsecurity/megalinter-go:latest
```

### Complete Flavor List

- **Complete**: All linters (default)
- **CI/CD**: Jenkins, GitHub Actions, GitLab CI
- **Cupcake**: Basic linters for small projects
- **Documentation**: Markdown, RST, spelling
- **DotNet**: C#, VB.NET, F#
- **Go**: Go-specific linters
- **Java**: Java, Kotlin, Scala
- **JavaScript**: JS, TS, Node.js
- **PHP**: PHP, Composer
- **Python**: Python, Django, FastAPI
- **Ruby**: Ruby, Rails
- **Rust**: Rust, Cargo
- **Salesforce**: Apex, Lightning, Aura
- **Security**: Security-focused linters
- **Swift**: Swift, iOS development
- **Terraform**: Infrastructure as Code

## GitHub Actions Integration

### Basic Workflow

```yaml
name: MegaLinter

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  megalinter:
    name: MegaLinter
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      pull-requests: write
      statuses: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT || secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: MegaLinter
        id: ml
        uses: oxsecurity/megalinter@v8
        env:
          VALIDATE_ALL_CODEBASE: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          APPLY_FIXES: all
          ENABLE_LINTERS: JAVASCRIPT_ES,TYPESCRIPT_ES,JSON_JSONLINT,YAML_YAMLLINT

      - name: Archive production artifacts
        if: success() || failure()
        uses: actions/upload-artifact@v4
        with:
          name: MegaLinter reports
          path: |
            megalinter-reports
            mega-linter.log
```

### Auto-Fix Workflow

```yaml
name: MegaLinter with Auto-Fix

on:
  pull_request:
    branches: [main]

jobs:
  megalinter:
    name: MegaLinter
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT || secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: MegaLinter
        id: ml
        uses: oxsecurity/megalinter@v8
        env:
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          APPLY_FIXES: all
          ENABLE_LINTERS: JAVASCRIPT_PRETTIER,TYPESCRIPT_PRETTIER,YAML_PRETTIER

      - name: Create Pull Request with fixes
        id: cpr
        if: steps.ml.outputs.has_updated_sources == 1 && (env.APPLY_FIXES_EVENT == 'all' || env.APPLY_FIXES_EVENT == github.event_name) && env.APPLY_FIXES_MODE == 'pull_request'
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.PAT || secrets.GITHUB_TOKEN }}
          commit-message: "[MegaLinter] Apply linters automatic fixes"
          title: "[MegaLinter] Apply linters automatic fixes"
          labels: bot
```

## Docker Usage Patterns

### Local Development

```bash
# Run on current directory
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e DEFAULT_BRANCH=main \
  -e APPLY_FIXES=all \
  oxsecurity/megalinter:latest

# Use specific flavor for faster execution
docker run --rm \
  -v $(pwd):/tmp/lint \
  -e JAVASCRIPT_ES_CONFIG_FILE=.eslintrc.json \
  oxsecurity/megalinter-javascript:latest

# Custom configuration
docker run --rm \
  -v $(pwd):/tmp/lint \
  -v $(pwd)/.mega-linter.yml:/tmp/lint/.mega-linter.yml \
  oxsecurity/megalinter:latest
```

### CI/CD Pipeline Integration

```bash
# Jenkins Pipeline
docker run --rm \
  -v ${WORKSPACE}:/tmp/lint \
  -e DEFAULT_BRANCH=${env.BRANCH_NAME} \
  -e GITHUB_TOKEN=${GITHUB_TOKEN} \
  oxsecurity/megalinter:latest

# GitLab CI
docker run --rm \
  -v ${CI_PROJECT_DIR}:/tmp/lint \
  -e DEFAULT_BRANCH=${CI_DEFAULT_BRANCH} \
  -e GITLAB_ACCESS_TOKEN=${GITLAB_ACCESS_TOKEN} \
  oxsecurity/megalinter:latest
```

## Supported Linters by Category

### JavaScript/TypeScript

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **StandardJS**: JavaScript standard style
- **JSHint**: JavaScript linting alternative

### Python

- **Black**: Code formatting
- **Flake8**: Style guide enforcement
- **Pylint**: Code analysis
- **MyPy**: Static type checking
- **Bandit**: Security scanning

### Go

- **golangci-lint**: Go linters aggregator
- **gofmt**: Code formatting
- **revive**: Fast linter for Go

### Infrastructure/DevOps

- **Terraform**: terraform fmt, tflint, terrascan
- **Kubernetes**: kubeval, kube-score
- **Docker**: hadolint for Dockerfiles
- **Ansible**: ansible-lint
- **CloudFormation**: cfn-lint

### Security

- **TruffleHog**: Secrets detection
- **Semgrep**: Static analysis security
- **Bandit**: Python security linter
- **Safety**: Python dependency security

## Reporters and Output Formats

### Available Reporters

- **Console**: Terminal output (default)
- **GitHub**: Comments and status checks
- **GitLab**: Merge request comments
- **Azure**: Pull request comments
- **JSON**: Structured output
- **SARIF**: Static Analysis Results Interchange Format
- **JUnit**: XML test results format
- **HTML**: Detailed HTML reports
- **File**: Text file output
- **TAP**: Test Anything Protocol

### Reporter Configuration

```yaml
# Enable multiple reporters
REPORTERS:
  - console
  - github_comment
  - github_status
  - sarif
  - json
  - html

# Reporter-specific settings
SARIF_REPORTER: true
JSON_REPORTER: true
HTML_REPORTER: true
FILEIO_REPORTER: true

# Custom report paths
REPORT_OUTPUT_FOLDER: reports
SARIF_REPORTER_FILE_NAME: megalinter-report.sarif
JSON_REPORTER_FILE_NAME: megalinter-report.json
```

## Best Practices

### Project Setup

1. **Start with a Flavor**: Use language-specific flavors to reduce noise
2. **Incremental Adoption**: Enable linters gradually
3. **Configure Before Running**: Set up `.mega-linter.yml` before first run
4. **Use Auto-Fix**: Enable `APPLY_FIXES: all` for consistent formatting

### Configuration Strategy

```yaml
# Recommended starter configuration
APPLY_FIXES: all
DEFAULT_BRANCH: main
FILEIO_REPORTER: true
SHOW_ELAPSED_TIME: true
PARALLEL: true

# Enable core linters
ENABLE_LINTERS:
  - JAVASCRIPT_ES
  - TYPESCRIPT_ES
  - JSON_JSONLINT
  - YAML_YAMLLINT
  - MARKDOWN_MARKDOWNLINT
  - DOCKERFILE_HADOLINT

# Common exclusions
FILTER_REGEX_EXCLUDE: "(node_modules/|\\.git/|dist/|build/)"

# Disable noisy linters initially
DISABLE_LINTERS:
  - SPELL_CSPELL           # Can be noisy
  - COPYPASTE_JSCPD        # May need tuning
  - REPOSITORY_CHECKOV     # Can be overwhelming
```

### Performance Optimization

```yaml
# Faster execution
PARALLEL: true
SHOW_ELAPSED_TIME: true

# File filtering
FILTER_REGEX_INCLUDE: "(src/|lib/|scripts/)"
FILTER_REGEX_EXCLUDE: "(node_modules/|\\.git/|test/fixtures/)"

# Linter-specific filtering
JAVASCRIPT_FILTER_REGEX_EXCLUDE: "(test/|spec/|__tests__/)"

# Use flavors instead of full image
# oxsecurity/megalinter-javascript instead of oxsecurity/megalinter
```

### Security Configuration

```yaml
# Enable security linters
ENABLE_LINTERS:
  - REPOSITORY_TRUFFLEHOG    # Secrets detection
  - REPOSITORY_SEMGREP       # Security analysis
  - PYTHON_BANDIT           # Python security
  - DOCKERFILE_HADOLINT     # Docker security

# Security-specific settings
REPOSITORY_TRUFFLEHOG_ARGUMENTS: "--exclude-paths .trufflehogignore"
REPOSITORY_SEMGREP_ARGUMENTS: "--config=auto"
```

## Code Examples Location

Comprehensive examples available in `./snippets/megalinter/`:

- Basic configuration examples
- GitHub Actions workflow templates
- Docker usage patterns
- Linter-specific configurations
- CI/CD integration examples
- Auto-fix workflows
- Security scanning setups
- Multi-project configurations
- Custom reporter configurations
- Performance optimization examples

## Configuration Templates

Configuration templates and examples in `./snippets/megalinter/configs/`

## Workflow Templates

CI/CD workflow templates in `./snippets/megalinter/workflows/`

## Common Issues and Solutions

### Large Repositories

- Use flavors instead of complete image
- Enable parallel execution
- Filter files aggressively
- Disable heavy linters initially

### False Positives

- Configure linter-specific rules
- Use ignore files (.eslintignore, .prettierignore)
- Set custom rule parameters
- Exclude test files from certain linters

### CI/CD Performance

- Use caching where available
- Run only on changed files in PRs
- Use matrix builds for large projects
- Consider flavor-specific images

## Migration from Other Tools

### From ESLint/Prettier Only

```yaml
# Gradual migration
ENABLE_LINTERS:
  - JAVASCRIPT_ES        # Keep ESLint
  - JAVASCRIPT_PRETTIER  # Keep Prettier
  - JSON_JSONLINT       # Add JSON linting
  - YAML_YAMLLINT       # Add YAML linting

# Use existing configs
JAVASCRIPT_ES_CONFIG_FILE: .eslintrc.json
JAVASCRIPT_PRETTIER_CONFIG_FILE: .prettierrc.json
```

### From Super-Linter

```yaml
# Similar configuration structure
DEFAULT_BRANCH: main
VALIDATE_ALL_CODEBASE: false
APPLY_FIXES: all

# Enable similar linters
ENABLE_LINTERS:
  - JAVASCRIPT_ES
  - PYTHON_PYLINT
  - YAML_YAMLLINT
  - DOCKERFILE_HADOLINT
```
