# Codemod Reference

**Always remember to reference @$HOME/.claude/references/codemod.md and look for snippets and examples in @$HOME/.claude/snippets/codemod/**

## Quick Reference

- Installation: `npx codemod@next`
- CLI: `npx codemod@next workflow run -w workflow.yaml`
- Configuration: `workflow.yaml` for workflow definitions
- Documentation: <https://docs.codemod.com/>
- GitHub: <https://github.com/codemod-com/codemod>
- Registry: <https://go.codemod.com/>

## Resources and Documentation

- [Codemod Documentation](https://docs.codemod.com/)
  - [Getting Started](https://docs.codemod.com/getting-started)
  - [CLI Reference](https://docs.codemod.com/cli/cli-reference)
  - [Workflows](https://docs.codemod.com/cli/workflows)
  - [JavaScript Transformations](https://docs.codemod.com/guides/javascript-transformations)
  - [TypeScript Support](https://docs.codemod.com/guides/typescript-support)
- [Community Resources](https://go.codemod.com/)
  - [Registry](https://go.codemod.com/registry)
  - [Examples](https://github.com/codemod-com/codemod/tree/main/examples)
  - [Discussions](https://github.com/codemod-com/codemod/discussions)

## Core Features

### Workflow Engine

- **YAML Configuration**: Define complex, multi-step transformations
- **State Management**: Schema-validated shared state across tasks
- **Dynamic Matrix**: Tasks appear/disappear as state arrays change
- **Manual Gates**: Pause workflows for human approval
- **Durable Execution**: State survives crashes and reboots
- **Parallel Processing**: Independent nodes run when dependencies allow

### Code Transformation

- **AST-Based**: Powered by ast-grep for accurate transformations
- **JavaScript/TypeScript**: First-class support for JS/TS ecosystems
- **Multi-Language**: Extensible to other programming languages
- **Batch Operations**: Apply changes across multiple files/projects
- **Interactive Mode**: Review and approve changes step-by-step

### Integration Platform

- **CI/CD Ready**: Designed for automation and continuous integration
- **Registry**: Share and discover codemods in the public registry
- **Version Control**: Built-in support for Git workflows
- **Validation**: Schema validation for workflow configurations
- **Dependency Management**: Handle complex transformation dependencies

## Default Usage Patterns

Default to using Codemod for large-scale code transformations and migrations:

- Use `npx codemod@next workflow run` for executing transformations
- Use `workflow.yaml` for defining complex, multi-step migrations
- Use ast-grep engine for JavaScript/TypeScript transformations
- Use the registry for discovering and sharing codemods
- Built-in integration with Git for version control workflows

## Key APIs

### CLI Commands

- `workflow run` - Execute a workflow from YAML configuration
- `init` - Create a new codemod project
- `publish` - Share codemod to public registry
- `jssg` - Run JavaScript/TypeScript transformations using ast-grep

### Workflow Configuration

- `version` - Workflow schema version
- `state` - Shared state schema definition
- `nodes` - Executable workflow steps
- `matrix` - Dynamic task generation
- `depends_on` - Task dependency management

### Transformation Types

- **Shell Commands**: Execute arbitrary shell commands
- **AST Transformations**: Use ast-grep for code changes
- **File Operations**: Copy, move, delete files and directories
- **Git Operations**: Commit, branch, merge operations
- **API Calls**: Integrate with external services

## Performance Characteristics

### Execution Model

- **Single Binary**: No server required, works anywhere with shell
- **Host Execution**: Commands run directly on your machine
- **Parallel Scheduling**: Independent tasks run concurrently
- **State Persistence**: Minimal overhead for state management
- **Resumable**: Continue from any point after interruption

### Scalability

- **Large Codebases**: Handle enterprise-scale transformations
- **Batch Processing**: Process multiple repositories simultaneously
- **Resource Management**: Efficient memory and CPU usage
- **Progress Tracking**: Real-time feedback on transformation progress

## Best Practices

### Workflow Design

1. **Atomic Steps**: Break complex transformations into smaller steps
2. **Error Handling**: Plan for failures and recovery scenarios
3. **State Management**: Use shared state for coordination
4. **Documentation**: Include clear descriptions and comments

### Transformation Strategy

1. **Test First**: Validate transformations on small samples
2. **Backup**: Ensure version control before major changes
3. **Incremental**: Apply changes gradually across codebase
4. **Validation**: Include verification steps in workflows

### CI/CD Integration

1. **Automated Triggers**: Set up workflows for code events
2. **Approval Gates**: Include manual review steps
3. **Rollback Plans**: Prepare for transformation failures
4. **Monitoring**: Track transformation success rates

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/codemod/`:

- Basic workflow configurations
- Complex transformation patterns
- CI/CD integration examples
- Error handling and recovery
- Registry publishing workflows
- Multi-repository transformations

## Schema and Type Definitions

Configuration schemas and validation patterns in `$HOME/.claude/snippets/codemod/schemas/`:

- `workflow.schema.json` - Workflow configuration schema
- `state.schema.json` - State management schema
- Matrix configuration patterns

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/codemod/linting/`:

- Workflow validation patterns
- Best practice configurations
- CI/CD integration templates

## Common Patterns

### Basic Workflow

```yaml
version: 1
state:
  files: !array
    items: !string
nodes:
  - id: transform
    name: "Transform JavaScript files"
    type: automatic
    steps:
      - run: |
          npx codemod@next jssg \
            --pattern 'console.log($MSG)' \
            --rewrite 'logger.log($MSG)' \
            src/
```

### Matrix Workflow

```yaml
version: 1
state:
  repositories: !array
    items: !string
nodes:
  - id: clone
    name: "Clone repository"
    type: automatic
    matrix:
      repository: !state repositories
    steps:
      - run: git clone ${repository}
  
  - id: transform
    name: "Apply transformation"
    type: automatic
    depends_on: [clone]
    matrix:
      repository: !state repositories
    steps:
      - run: |
          cd $(basename ${repository})
          npx codemod@next jssg \
            --pattern 'var $VAR = $VALUE' \
            --rewrite 'const $VAR = $VALUE' \
            src/
```

### Manual Approval Workflow

```yaml
version: 1
state:
  changes_approved: !boolean
nodes:
  - id: prepare
    name: "Prepare changes"
    type: automatic
    steps:
      - run: |
          # Generate transformation preview
          npx codemod@next jssg \
            --pattern 'function $NAME($ARGS) { $BODY }' \
            --rewrite 'const $NAME = ($ARGS) => { $BODY }' \
            --dry-run \
            src/
  
  - id: approve
    name: "Review and approve changes"
    type: manual
    depends_on: [prepare]
    steps:
      - run: echo "Please review the changes and approve"
  
  - id: apply
    name: "Apply approved changes"
    type: automatic
    depends_on: [approve]
    condition: !state changes_approved
    steps:
      - run: |
          npx codemod@next jssg \
            --pattern 'function $NAME($ARGS) { $BODY }' \
            --rewrite 'const $NAME = ($ARGS) => { $BODY }' \
            src/
```

## Integration Patterns

### Git Integration

```yaml
nodes:
  - id: commit
    name: "Commit changes"
    type: automatic
    steps:
      - run: |
          git add .
          git commit -m "refactor: modernize function syntax"
          git push origin feature/modernize-functions
```

### Multi-Repository Support

```yaml
state:
  repositories:
    - "https://github.com/org/repo1"
    - "https://github.com/org/repo2"
    - "https://github.com/org/repo3"
matrix:
  repository: !state repositories
```

### Error Recovery

```yaml
nodes:
  - id: transform
    name: "Apply transformation"
    type: automatic
    steps:
      - run: |
          if ! npx codemod@next jssg --pattern '$PATTERN' --rewrite '$FIX' src/; then
            echo "Transformation failed, creating issue"
            gh issue create --title "Transformation failed" --body "Details..."
            exit 1
          fi
```

## Migration Strategies

### From Manual Processes

1. **Document Current Process**: Map existing manual steps
2. **Automate Incrementally**: Convert steps to workflow nodes
3. **Add Validation**: Include verification and testing steps
4. **Rollout Gradually**: Test on small projects first

### From Other Tools

1. **Pattern Translation**: Convert existing transformation logic
2. **Workflow Mapping**: Adapt existing automation to Codemod workflows
3. **Integration**: Maintain compatibility with existing tools
4. **Migration Path**: Plan gradual adoption strategy

## Latest Standards Enforcement

### Code Modernization

- Migrate legacy JavaScript to modern ES6+ syntax
- Update deprecated API usage across codebases
- Standardize coding conventions and patterns
- Automate framework upgrades and migrations

### Security Improvements

- Replace insecure patterns with secure alternatives
- Update dependencies with known vulnerabilities
- Enforce security best practices
- Automate security patch application

### Performance Optimization

- Identify and fix performance anti-patterns
- Update inefficient code constructs
- Optimize bundle sizes and dependencies
- Automate performance improvements

## Community and Support

### Registry

- **Public Registry**: Share codemods with the community
- **Discovery**: Find existing codemods for common tasks
- **Versioning**: Manage codemod versions and dependencies
- **Documentation**: Include usage examples and descriptions

### Contributing

- **Open Source**: Contribute to the core platform
- **Codemod Development**: Create and share transformation patterns
- **Documentation**: Improve guides and examples
- **Testing**: Validate codemods across different scenarios

## See Also

- Complete reference: `@$HOME/.claude/references/codemod.md`
- Code examples: `@$HOME/.claude/snippets/codemod/`
- Schemas: `@$HOME/.claude/snippets/codemod/schemas/`
- Workflow templates: `@$HOME/.claude/snippets/codemod/workflows/`
