# ast-grep Reference

**Always remember to reference @$HOME/.claude/references/ast-grep.md and look for snippets and examples in @$HOME/.claude/snippets/ast-grep/**

## Quick Reference

- Installation: `cargo install ast-grep`
- CLI: `ast-grep --pattern '$PATTERN' --rewrite '$FIX' file.js`
- YAML Config: `sgconfig.yml` for project configuration
- Documentation: <https://ast-grep.github.io/>
- GitHub: <https://github.com/ast-grep/ast-grep>
- Package: <https://crates.io/crates/ast-grep>

## Resources and Documentation

- [ast-grep Documentation](https://ast-grep.github.io/)
  - [Getting Started](https://ast-grep.github.io/guide/introduction.html)
  - [Pattern Syntax](https://ast-grep.github.io/guide/pattern-syntax.html)
  - [Rule Configuration](https://ast-grep.github.io/guide/rule-config.html)
    - [Atomic Rules](https://ast-grep.github.io/guide/rule-config/atomic-rule.html)
    - [Relational Rules](https://ast-grep.github.io/guide/rule-config/relational-rule.html)
    - [Composite Rules](https://ast-grep.github.io/guide/rule-config/composite-rule.html)
  - [CLI Reference](https://ast-grep.github.io/reference/cli.html)
  - [YAML Reference](https://ast-grep.github.io/reference/yaml.html)
  - [API Reference](https://ast-grep.github.io/reference/api.html)
  - [Language Support](https://ast-grep.github.io/reference/languages.html)
- [Community Resources](https://ast-grep.github.io/catalog/)
  - [Rule Catalog](https://ast-grep.github.io/catalog/)
  - [Examples Repository](https://github.com/ast-grep/ast-grep/tree/main/crates/cli/examples)
  - [Playground](https://ast-grep.github.io/playground.html)
  - [Cheat Sheets](https://ast-grep.github.io/cheatsheet/)

## Core Features

### Pattern-Based Code Search

- **Structural Search**: Find code based on AST patterns rather than text
- **Meta Variables**: Use `$VAR` to capture and match code elements
- **Multi Meta Variables**: Use `$$$ARGS` to match multiple elements
- **Language-Agnostic**: Support for 20+ programming languages
- **Tree-sitter Powered**: Built on tree-sitter for accurate parsing

### Code Transformation

- **Find & Replace**: Transform code using patterns and fixes
- **Rewriters**: Complex transformations with recursive rules
- **Batch Operations**: Apply changes across entire codebases
- **Interactive Mode**: Review changes before applying
- **Dry Run**: Preview changes without modifying files

### Rule Engine

- **YAML Configuration**: Define reusable linting and transformation rules
- **Atomic Rules**: Basic pattern matching
- **Relational Rules**: Match based on code relationships
- **Composite Rules**: Complex logic with `all`, `any`, `not`
- **Utility Rules**: Reusable rule components

## Default Usage Patterns

Default to using ast-grep for structural code analysis and transformation:

- Use `ast-grep --pattern '$PATTERN'` for code search
- Use `ast-grep --pattern '$PATTERN' --rewrite '$FIX'` for transformations
- Use `sgconfig.yml` for project-level rule configuration
- Use `ast-grep scan` for linting with custom rules
- Use `ast-grep test` for rule testing and validation
- Built-in support for JavaScript, TypeScript, Python, Rust, Go, and more

## Key APIs

### CLI Commands

- `ast-grep scan` - Run linting rules on codebase
- `ast-grep run` - Execute single pattern/rewrite operation
- `ast-grep new` - Create new rule files
- `ast-grep test` - Test rule configurations
- `ast-grep lsp` - Language server for editor integration

### Pattern Syntax

- `$VAR` - Single node meta-variable (uppercase required)
- `$$$ARGS` - Multiple node meta-variable
- `$_` - Anonymous single node variable
- `$_123` - Anonymous numbered variable
- Pattern must be valid, parseable code

### Rule Configuration

- `rule.pattern` - Basic pattern matching
- `rule.kind` - AST node type matching
- `rule.regex` - Text-based matching
- `rule.inside` - Relational containment
- `rule.has` - Relational descendant
- `rule.follows` - Sequential relationship
- `rule.precedes` - Preceding relationship

## Performance Characteristics

### Speed Comparisons

- **Search**: ~100x faster than grep for structural queries
- **Parsing**: Built on tree-sitter for fast, incremental parsing
- **Memory**: Efficient AST representation and traversal
- **Scalability**: Handles large codebases with parallel processing

### Language Support

- **Primary**: JavaScript, TypeScript, Python, Rust, Go, Java, C/C++
- **Additional**: HTML, CSS, JSON, YAML, Bash, and more
- **Extensible**: Add new languages via tree-sitter grammars
- **Custom**: Define custom language parsers

## Best Practices

### Pattern Design

1. **Specific Patterns**: Use precise patterns to avoid false positives
2. **Meta Variables**: Use descriptive meta-variable names
3. **Context**: Provide sufficient context for complex patterns
4. **Testing**: Use playground to validate patterns before deployment

### Rule Organization

1. **Modular Rules**: Create focused, single-purpose rules
2. **Utility Rules**: Extract common patterns into reusable utilities
3. **Documentation**: Include clear messages and notes
4. **Categorization**: Organize rules by purpose or technology

### Performance Optimization

1. **File Filtering**: Use `files` and `ignores` to limit scope
2. **Early Termination**: Use `stopBy` in relational rules
3. **Specific Kinds**: Prefer `kind` over `pattern` when possible
4. **Batch Operations**: Group related transformations

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/ast-grep/`:

- Basic pattern matching and search
- Rule configuration and YAML syntax
- Complex transformations and rewriters
- Integration with CI/CD pipelines
- Language-specific patterns
- Performance optimization techniques

## Schema and Type Definitions

Configuration schemas and validation patterns in `$HOME/.claude/snippets/ast-grep/schemas/`:

- `sgconfig.schema.json` - Project configuration schema
- `rule.schema.json` - Rule definition schema
- VSCode integration with schema validation

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/ast-grep/linting/`:

- Integration with existing linting tools
- Custom rule development patterns
- CI/CD integration examples

## Common Patterns

### Basic Search and Replace

```bash
# Find all console.log statements
ast-grep --pattern 'console.log($$$)' src/

# Replace console.log with logger
ast-grep --pattern 'console.log($MSG)' --rewrite 'logger.log($MSG)' src/
```

### YAML Rule Configuration

```yaml
id: no-console-log
language: JavaScript
rule:
  pattern: console.log($$$ARGS)
message: Use logger instead of console.log
severity: warning
fix: logger.log($$$ARGS)
```

### Complex Transformations

```yaml
id: modernize-imports
language: TypeScript
rule:
  pattern: import {$$$ITEMS} from '$MODULE'
rewriters:
- id: individual-import
  rule:
    pattern: $ITEM
    kind: identifier
  fix: import $ITEM from '$MODULE/$ITEM'
transform:
  IMPORTS:
    rewrite:
      rewriters: [individual-import]
      source: $$$ITEMS
      joinBy: "\n"
fix: $IMPORTS
```

## Integration Patterns

### CI/CD Integration

- GitHub Actions workflow for automated code review
- Pre-commit hooks for local validation
- Integration with existing linting pipelines
- Custom rule deployment and management

### Editor Integration

- VS Code extension with real-time feedback
- Language server protocol support
- Schema validation for rule files
- Syntax highlighting for patterns

### Build Tool Integration

- npm/yarn script integration
- Cargo/Rust build system integration
- Make/CMake integration patterns
- Custom tool development

## Migration Strategies

### From Text-Based Tools

1. **Identify Patterns**: Convert regex patterns to AST patterns
2. **Test Thoroughly**: Use playground for validation
3. **Gradual Migration**: Replace tools incrementally
4. **Performance Tuning**: Optimize for your specific use case

### From Other AST Tools

1. **Pattern Translation**: Convert existing patterns to ast-grep syntax
2. **Rule Migration**: Adapt existing rules to YAML format
3. **Workflow Integration**: Maintain existing CI/CD processes
4. **Tool Consolidation**: Combine multiple tools into ast-grep

## Latest Standards Enforcement

### Code Quality

- Enforce modern JavaScript/TypeScript patterns
- Detect and fix deprecated API usage
- Standardize coding conventions
- Automate refactoring tasks

### Security Analysis

- Detect common security vulnerabilities
- Enforce secure coding patterns
- Identify potential injection attacks
- Validate input sanitization

### Performance Optimization

- Identify performance anti-patterns
- Suggest optimization opportunities
- Detect memory leaks and inefficiencies
- Enforce best practices

## See Also

- Complete reference: `@$HOME/.claude/references/ast-grep.md`
- Code examples: `@$HOME/.claude/snippets/ast-grep/`
- Schemas: `@$HOME/.claude/snippets/ast-grep/schemas/`
- Linting configs: `@$HOME/.claude/snippets/ast-grep/linting/`
