# GritQL Reference

**Always remember to reference @$HOME/.claude/references/gritql.md and look for snippets and examples in @$HOME/.claude/snippets/gritql/**

## Quick Reference

- Installation: `bun add -g @getgrit/launcher` or `npm install -g @getgrit/launcher`
- CLI: `grit apply <pattern>` or `grit check <pattern>`
- Documentation: <https://docs.grit.io/>
- GitHub: <https://github.com/getgrit/gritql>
- Standard Library: <https://github.com/getgrit/stdlib>

## Resources and Documentation

- [GritQL Documentation](https://docs.grit.io/)
  - [Language Syntax](https://docs.grit.io/language/syntax)
  - [Pattern Matching](https://docs.grit.io/language/patterns)
  - [Configuration Guide](https://docs.grit.io/guides/config)
  - [CLI Reference](https://docs.grit.io/cli)
  - [Standard Library](https://docs.grit.io/patterns)
- [GitHub Repositories](https://github.com/getgrit/)
  - [GritQL Core](https://github.com/getgrit/gritql)
  - [Standard Library](https://github.com/getgrit/stdlib)
  - [Honeycomb GritQL](https://github.com/honeycombio/gritql)
- [Community Resources](https://docs.grit.io/community)
  - [Pattern Gallery](https://docs.grit.io/patterns)
  - [Migration Patterns](https://docs.grit.io/patterns/migrations)
  - [Best Practices](https://docs.grit.io/guides/best-practices)

## Core Concepts

### What is GritQL?

GritQL is a powerful query language for searching, linting, and modifying code at scale. It combines:

- **Pattern Matching**: Find specific code patterns across files
- **Code Transformation**: Automatically refactor and modernize codebases
- **Multi-language Support**: Works with JavaScript, TypeScript, Python, Go, Rust, and more
- **AST-aware Processing**: Understands code structure beyond simple text replacement

### Key Features

- **Declarative Patterns**: Write transformation rules using intuitive syntax
- **Metavariables**: Capture and reuse parts of matched code
- **Conditional Logic**: Apply transformations based on context
- **Multi-file Operations**: Transform across entire codebases
- **Version Control Integration**: Generate clean commits with changes

## Language Syntax

### Basic Pattern Matching

```grit
# Match console.log statements
`console.log($message)`

# Match function declarations
`function $name($params) { $body }`

# Match import statements
`import $imports from $source`
```

### Metavariables

- `$variable` - Captures any AST node
- `$_` - Anonymous metavariable (captures but doesn't bind)
- `$...` - Spread metavariable (captures multiple nodes)

### Transformation Operators

```grit
# Basic replacement
`console.log($message)` => `console.warn($message)`

# Remove matched code
`debugger` => .

# Conditional replacement
`$old` => `$new` where { $condition }
```

### Advanced Pattern Matching

```grit
# Compound patterns
and { `$a`, `$b` }
or { `$a`, `$b` }
not `$pattern`

# Traversal operators
contains `$pattern`
within `$context`
after `$reference`

# Optional matching
maybe `$pattern`
```

### Conditional Logic

```grit
`$code` where {
  $code <: contains `dangerous_function($_)`,
  $code <: not within `try { $_ }`
}
```

### Scoping and Control

```grit
# Create isolated scope
bubble($var) { `$pattern` => `$replacement` }

# Sequential application
sequential {
  `$pattern1` => `$replacement1`,
  `$pattern2` => `$replacement2`
}

# Limit results
`$pattern` => `$replacement` limit 5
```

## Configuration (.grit/grit.yaml)

### Basic Structure

```yaml
version: 0.0.2
patterns:
  - name: pattern_name
    title: "Human Readable Title"
    body: |
      `$old_pattern` => `$new_pattern`
    level: error
    tags: ["style", "performance"]
    description: "Detailed explanation of the pattern"
```

### Pattern Levels

- `none` - Pattern is disabled
- `info` - Informational only
- `warn` - Warning level
- `error` - Error level (blocks CI/CD)

### Tags and Organization

```yaml
patterns:
  - name: no_console_log
    tags: ["debugging", "production"]
    body: `console.log($_)` => .
    
  - name: use_const
    tags: ["es6", "style"] 
    body: `var $name = $value` => `const $name = $value`
```

## Standard Library Patterns

### JavaScript/TypeScript Common Patterns

- **ES6 Modernization**: `var` to `const/let`, arrow functions
- **React Upgrades**: Class components to hooks, prop-types to TypeScript
- **Import Management**: CommonJS to ES modules, dependency updates
- **Framework Migrations**: jQuery to modern JS, moment.js to date-fns

### Python Patterns

- **Type Annotations**: Add type hints to functions
- **AsyncIO**: Convert sync to async patterns
- **F-strings**: Modernize string formatting
- **Imports**: Organize and update import statements

### Multi-language Patterns

- **Security**: Remove hardcoded secrets, fix SQL injection
- **Performance**: Optimize loops, remove dead code
- **Style**: Enforce coding standards, fix formatting
- **Dependencies**: Update deprecated APIs, migrate libraries

## CLI Commands

### Basic Usage

```bash
# Apply pattern to files
grit apply pattern_name

# Check without applying changes
grit check pattern_name

# Apply to specific files/directories
grit apply pattern_name --files "src/**/*.js"

# Generate workflow from AI description
grit generate "Convert all var to const"
```

### Advanced Options

```bash
# Dry run (show changes without applying)
grit apply pattern_name --dry-run

# Interactive mode (approve each change)
grit apply pattern_name --interactive

# Output as Git patch
grit apply pattern_name --format patch

# Use specific pattern file
grit apply --pattern custom_pattern.grit
```

### Configuration Management

```bash
# Initialize project configuration
grit init

# List available patterns
grit list

# Install patterns from registry
grit install standard

# Update pattern library
grit update
```

## Pattern Development

### Writing Custom Patterns

```grit
# Pattern file: .grit/patterns/no_var.grit
engine marzano(0.1)
language js

`var $name = $value` => `const $name = $value` where {
  $value <: not or {
    assignment_expression(),
    update_expression()
  }
}
```

### Testing Patterns

```grit
# Include test cases in pattern files
---
samples:
  - input: |
      var x = 5;
      var y = getValue();
    output: |
      const x = 5;
      var y = getValue();
---
```

### Markdown Patterns

```markdown
---
title: Convert var to const
tags: [es6, style]
level: warn
---

# Convert var to const

This pattern converts `var` declarations to `const` when the variable is not reassigned.

```grit
`var $name = $value` => `const $name = $value` where {
  $name <: not within contains `$name = $_`
}
```

## Example use case

### Before

```javascript
var userName = "alice";
var config = loadConfig();
```

### After  

```javascript
const userName = "alice";
var config = loadConfig(); // Not changed - may be reassigned
```

```

### AI-Powered Workflows
```typescript
// .grit/workflows/styled-to-tailwind.ts
import * as grit from '@getgrit/api';

export async function execute(options: grit.WorkflowOptions) {
  const transformResult = await grit.stdlib.transform({
    objective: `Migrate styled-components to Tailwind CSS`,
    principles: ['Use twMerge for conditional classes'],
    model: 'slow',
    query: 'or { js"styled.$_`$_`", js"styled($_)`$_`" }',
    examples: [
      {
        input: `styled.div\`color: red;\``,
        replacements: [`<div className="text-red-500" />`]
      }
    ]
  }, {});
  
  return transformResult;
}
```

## Integration Patterns

### CI/CD Integration

```yaml
# GitHub Actions
- name: Run Grit checks
  run: |
    grit check --level error
    grit apply --ci --format patch
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: grit-check
        name: Grit pattern checks
        entry: grit check
        language: system
        pass_filenames: false
```

### VS Code Integration

```json
{
  "grit.enableAutoFix": true,
  "grit.lintOnSave": true,
  "grit.patterns": ["standard", "custom"]
}
```

## Best Practices

### Pattern Design

1. **Start Simple**: Begin with basic find-replace, add complexity incrementally
2. **Test Thoroughly**: Include comprehensive test cases with edge cases
3. **Use Descriptive Names**: Clear pattern names and documentation
4. **Leverage Metavariables**: Capture reusable parts of code
5. **Consider Context**: Use `within` and `contains` for precise matching

### Performance Optimization

1. **Narrow Scope**: Use specific patterns rather than overly broad matches
2. **Limit Results**: Use `limit` clause for expensive operations
3. **Cache Patterns**: Reuse compiled patterns across runs
4. **Batch Operations**: Apply multiple related patterns together

### Team Collaboration

1. **Version Control**: Store patterns in repository with code
2. **Code Reviews**: Review pattern changes like code changes
3. **Documentation**: Maintain clear pattern documentation
4. **Standards**: Establish team conventions for pattern organization

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/gritql/`:

- Basic pattern matching and transformations
- Advanced metavariable usage
- Multi-language pattern examples
- CI/CD integration patterns
- Custom workflow development
- Performance optimization techniques
- Testing and validation patterns

## Schema and Type Definitions

Configuration schemas and type definitions in `$HOME/.claude/snippets/gritql/schemas/`:

- `grit.yaml.schema.json` - Configuration file schema
- `pattern.schema.json` - Pattern definition schema
- `workflow.schema.json` - Workflow definition schema

## Linting and Formatting

Configuration files in `$HOME/.claude/snippets/gritql/linting/`:

- `biome.json` - Biome configuration for JavaScript/TypeScript patterns
- `.gritignore` - Files to exclude from Grit processing
- `pre-commit-config.yaml` - Pre-commit hook configurations

## Common Use Cases

### Large-scale Refactoring

- **Framework Migrations**: React class to hooks, AngularJS to Angular
- **Language Modernization**: ES5 to ES6+, Python 2 to 3
- **Library Updates**: jQuery to vanilla JS, Moment.js to date-fns
- **API Migrations**: REST to GraphQL, v1 to v2 API calls

### Code Quality Improvements

- **Security Fixes**: Remove hardcoded secrets, fix vulnerabilities
- **Performance Optimization**: Eliminate redundant code, optimize loops
- **Style Consistency**: Enforce coding standards across teams
- **Dead Code Removal**: Remove unused imports, variables, functions

### Compliance and Standards

- **Accessibility**: Add ARIA attributes, semantic HTML
- **Type Safety**: Add TypeScript annotations, fix any types
- **Documentation**: Add JSDoc comments, update outdated docs
- **Testing**: Add missing test cases, update test frameworks

## Troubleshooting

### Common Issues

1. **Pattern Not Matching**: Check AST structure with `grit ast`
2. **Performance Issues**: Use `--verbose` to identify bottlenecks
3. **Syntax Errors**: Validate pattern syntax with `grit check --pattern`
4. **False Positives**: Add more specific conditions to patterns

### Debugging Commands

```bash
# Show AST for code
grit ast --language js "console.log('hello')"

# Validate pattern syntax
grit check --pattern custom_pattern.grit

# Verbose output for debugging
grit apply pattern_name --verbose

# Show what would change without applying
grit apply pattern_name --dry-run --diff
```

### Performance Monitoring

```bash
# Profile pattern execution
grit apply pattern_name --profile

# Limit concurrent processing
grit apply pattern_name --threads 4

# Process specific file types only
grit apply pattern_name --include "**/*.{js,ts}"
```

## Migration Strategies

### From ESLint/Prettier

1. **Analysis**: Identify fixable ESLint rules for conversion to Grit patterns
2. **Conversion**: Create equivalent Grit patterns with better context awareness
3. **Testing**: Validate patterns against existing codebase
4. **Integration**: Replace ESLint autofix with Grit patterns in CI/CD

### From Custom Scripts

1. **Pattern Extraction**: Convert regex-based scripts to AST-aware patterns
2. **Safety**: Add conditions to prevent false positives
3. **Scale**: Leverage Grit's parallel processing capabilities
4. **Maintenance**: Use version-controlled patterns instead of scattered scripts

### Large Codebase Adoption

1. **Pilot**: Start with non-critical files or specific teams
2. **Incremental**: Gradually expand pattern coverage
3. **Training**: Educate team on pattern development
4. **Automation**: Integrate into development workflow and CI/CD

## See Also

- Complete reference: `@$HOME/.claude/references/gritql.md`
- Code examples: `@$HOME/.claude/snippets/gritql/`
- Schemas: `@$HOME/.claude/snippets/gritql/schemas/`
- Linting configs: `@$HOME/.claude/snippets/gritql/linting/`
