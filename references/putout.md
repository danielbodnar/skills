# Putout Reference

**Always remember to reference @$HOME/.claude/references/putout.md and look for snippets and examples in @$HOME/.claude/snippets/putout/**

## Quick Reference

- Installation: `bun add -d putout`
- Basic usage: `putout lib`
- Fix issues: `putout lib --fix`
- Documentation: <https://github.com/coderaiser/putout>
- GitHub: <https://github.com/coderaiser/putout>
- Package: <https://www.npmjs.com/package/putout>

## Resources and Documentation

- [Putout GitHub Repository](https://github.com/coderaiser/putout)
  - [Core Concepts](https://github.com/coderaiser/putout/blob/master/docs/core-concepts.md)
  - [AST Documentation](https://github.com/coderaiser/putout/blob/master/docs/the-book-of-ast.md)
  - [Plugin Development](https://github.com/coderaiser/putout/blob/master/docs/plugin-development.md)
  - [Configuration Guide](https://github.com/coderaiser/putout/blob/master/docs/configuration.md)
  - [CLI Reference](https://github.com/coderaiser/putout/blob/master/docs/cli.md)
- [NPM Package](https://www.npmjs.com/package/putout)
  - [Plugin Ecosystem](https://www.npmjs.com/search?q=putout-plugin)
  - [Built-in Rules](https://github.com/coderaiser/putout/tree/master/packages)
- [Community Resources](https://github.com/coderaiser/putout/discussions)
  - [GitHub Discussions](https://github.com/coderaiser/putout/discussions)
  - [Issue Tracker](https://github.com/coderaiser/putout/issues)
  - [Plugin Development Guide](https://github.com/coderaiser/putout/blob/master/docs/plugin-development.md)

## Core Concepts

### What is Putout?

Putout is a JavaScript linter, code transformer, and formatter that goes beyond traditional linters by providing:

- **Code Transformation**: Automatically fixes code issues rather than just reporting them
- **AST-based**: Uses Abstract Syntax Tree manipulation for precise code changes
- **Multi-format Support**: Works with JavaScript, JSX, TypeScript, Markdown, YAML, and JSON
- **Plugin Architecture**: Extensible through plugins for custom transformations

### Key Features

- **Drop-in ESLint Replacement**: Can replace ESLint with additional transformation capabilities
- **Syntax Error Fixing**: Automatically fixes common syntax errors
- **Built-in Code Printer**: Formats code during transformation
- **Declarative Codemods**: Write transformations in a simple, declarative way
- **70+ Built-in Transformations**: Extensive collection of code improvements

### Architecture Components

1. **Rules**: Core building blocks that define code transformations
2. **Plugins**: Collections of rules distributed as npm packages
3. **Processors**: Extract and manipulate code from various file types
4. **Formatters**: Control how results are presented in CLI

## Installation and Setup

### Basic Installation

```bash
# With bun (recommended)
bun add -d putout

# With npm
npm install -D putout

# With yarn
yarn add -D putout
```

### Global Installation

```bash
# With bun
bun add -g putout

# With npm
npm install -g putout
```

### Requirements

- Node.js version ≥16
- TypeScript support (optional)

## Configuration

### Configuration Files

Putout uses `.putout.json` configuration file:

```json
{
  "rules": {
    "remove-unused-variables": "on",
    "convert-commonjs-to-esm": "off"
  },
  "plugins": [
    "remove-debugger",
    "remove-console"
  ],
  "match": {
    "*.test.js": {
      "remove-only": "on"
    }
  },
  "ignore": [
    "node_modules",
    "dist"
  ]
}
```

### Environment Variables

- `PUTOUT_CONFIG_FILE`: Override config file location
- `PUTOUT_FILES`: Specify files to process
- `PUTOUT_PROCESSOR`: Override processor selection

## CLI Usage

### Basic Commands

```bash
# Lint files
putout lib

# Fix issues
putout lib --fix

# Lint specific files
putout src/index.js src/utils.js

# Disable all rules
putout src --disable-all

# Enable specific rule
putout src --enable nodejs/convert-commonjs-to-esm

# Transform without config
putout src --transform remove-unused-variables
```

### Advanced Options

```bash
# Format output
putout lib --format json

# Show progress
putout lib --progress

# Exit with code 0 even if issues found
putout lib --no-exit-code

# Custom config file
putout lib --config custom.putout.json
```

## Plugin System

### Built-in Plugins

Putout includes 70+ built-in transformations:

- **remove-unused-variables**: Remove unused variable declarations
- **remove-debugger**: Remove debugger statements
- **remove-console**: Remove console.log statements
- **convert-commonjs-to-esm**: Convert CommonJS to ES modules
- **remove-empty**: Remove empty blocks and statements
- **simplify-logical-expressions**: Simplify complex logical expressions

### Plugin Development

```javascript
// Custom plugin structure
module.exports.report = () => 'Remove unused variable';
module.exports.fix = (path) => {
    path.remove();
};
module.exports.traverse = ({push}) => ({
    VariableDeclarator(path) {
        if (isUnused(path)) {
            push(path);
        }
    }
});
```

### Plugin Installation

```bash
# Install plugin
bun add -d @putout/plugin-remove-unused-variables

# Configure in .putout.json
{
  "plugins": [
    "@putout/plugin-remove-unused-variables"
  ]
}
```

## AST Manipulation

### Core AST Concepts

- **MemberExpression**: Property access (`obj.prop`, `obj['prop']`)
- **Literal**: Primitive values (strings, numbers, booleans)
- **Identifier**: Variable names and symbols
- **Expression vs Statement**: Values vs control structures

### Common AST Patterns

```javascript
// Finding nodes
traverse({
    MemberExpression(path) {
        // Handle property access
    },
    Identifier(path) {
        // Handle variable names
    }
});

// Transforming nodes
path.replaceWith(newNode);
path.remove();
path.insertBefore(newNode);
```

## Integration Patterns

### With Build Tools

```javascript
// Webpack integration
const putout = require('putout');

module.exports = {
    module: {
        rules: [{
            test: /\.js$/,
            use: [{
                loader: 'putout-loader',
                options: {
                    fix: true
                }
            }]
        }]
    }
};
```

### With Testing Frameworks

```javascript
// Jest integration
const {transform} = require('putout');

test('should remove unused variables', () => {
    const source = 'const unused = 5; console.log("hello");';
    const result = transform(source, {
        plugins: ['remove-unused-variables']
    });
    expect(result.code).toBe('console.log("hello");');
});
```

### With CI/CD

```yaml
# GitHub Actions
name: Code Quality
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: bun install
      - run: putout src --fix
      - run: git diff --exit-code
```

## Performance Optimization

### Parallel Processing

```bash
# Process files in parallel
putout src --workers 4

# Memory optimization
putout src --max-memory 1024
```

### Caching

```bash
# Enable caching
putout src --cache

# Clear cache
putout src --cache-clear
```

## Comparison with Other Tools

### vs ESLint

- **Putout**: Fixes code automatically, more aggressive transformations
- **ESLint**: Reports issues, limited auto-fixing capabilities

### vs jscodeshift

- **Putout**: Declarative plugin system, built-in rules
- **jscodeshift**: Imperative transformations, more flexible but complex

### vs Prettier

- **Putout**: Code transformation + formatting
- **Prettier**: Formatting only, no code logic changes

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/putout/`:

- Basic usage and configuration patterns
- Plugin development examples
- AST manipulation techniques
- Integration with build tools
- Custom transformation rules
- Testing patterns and utilities
- Performance optimization examples
- Real-world transformation scenarios

## Schema and Type Definitions

Configuration schemas and type definitions in `$HOME/.claude/snippets/putout/schemas/`:

- `.putout.json` schema
- Plugin API types
- AST node type definitions

## Linting and Formatting

Configuration files available in `$HOME/.claude/snippets/putout/linting/`:

- Integration with Biome
- ESLint compatibility settings
- Prettier integration patterns

## Advanced Features

### Custom Processors

```javascript
// Markdown processor example
module.exports = {
    preProcess: (text) => extractJavaScript(text),
    postProcess: (messages) => filterMessages(messages)
};
```

### Rule Composition

```javascript
// Combining multiple rules
module.exports = {
    rules: {
        'remove-unused-variables': 'on',
        'remove-debugger': 'on',
        'convert-commonjs-to-esm': 'on'
    }
};
```

### Conditional Rules

```javascript
// Environment-based rules
module.exports = {
    env: {
        development: {
            rules: {
                'remove-console': 'off'
            }
        },
        production: {
            rules: {
                'remove-console': 'on'
            }
        }
    }
};
```

## Troubleshooting

### Common Issues

1. **Syntax Errors**: Enable syntax error fixing with `--fix-syntax`
2. **Memory Issues**: Use `--max-memory` to limit memory usage
3. **Performance**: Enable caching with `--cache`
4. **Plugin Conflicts**: Check plugin compatibility

### Debug Mode

```bash
# Enable debug output
DEBUG=putout* putout src

# Verbose logging
putout src --verbose
```

## Migration Strategies

### From ESLint

1. Install Putout: `bun add -d putout`
2. Convert ESLint config to Putout config
3. Update npm scripts
4. Test transformations gradually

### From jscodeshift

1. Convert imperative transforms to declarative rules
2. Use Putout's plugin system
3. Leverage built-in transformations
4. Test with existing codebase

## Best Practices

### Configuration Management

- Use `.putout.json` for project-specific rules
- Enable rules gradually to avoid breaking changes
- Use `match` patterns for file-specific rules
- Document custom rules and their purpose

### Plugin Development

- Follow naming conventions (`@putout/plugin-*`)
- Write comprehensive tests
- Document plugin behavior
- Consider performance implications

### CI/CD Integration

- Run with `--fix` in development
- Run without `--fix` in CI for validation
- Use caching for performance
- Combine with other quality tools

## See Also

- Complete reference: `@$HOME/.claude/references/putout.md`
- Code examples: `@$HOME/.claude/snippets/putout/`
- Schemas: `@$HOME/.claude/snippets/putout/schemas/`
- Linting configs: `@$HOME/.claude/snippets/putout/linting/`
