# Oxc (The JavaScript Oxidation Compiler) Reference

**Always reference @/home/bodnar/.claude/references/oxc.md and look for snippets and examples in @/home/bodnar/.claude/snippets/oxc/**

## Quick Reference

- **Website**: <https://oxc.rs>
- **GitHub**: <https://github.com/oxc-project/oxc>
- **Documentation**: <https://oxc.rs/docs>
- **License**: MIT
- **Language**: Rust
- **Company**: VoidZero Inc.

## Overview

Oxc is "A collection of high-performance JavaScript tools written in Rust" designed to provide a complete JavaScript/TypeScript toolchain that is 2-100x faster than existing tools. It's a comprehensive suite of tools for modern JavaScript development with a focus on performance and developer experience.

### Key Performance Metrics

- **Parser**: 3x faster than swc
- **Linter**: 50-100x faster than ESLint  
- **Resolver**: 28x faster than webpack's enhanced-resolve
- **Transformer**: 3-5x faster than swc, 20-50x faster than Babel
- **Memory Usage**: 20-70% less memory than alternatives
- **Package Size**: Significantly smaller (2MB vs swc's 37MB)

## Core Components

### 1. Parser

- Fastest Rust-based JavaScript/TypeScript parser
- Supports JavaScript, TypeScript, JSX, and TSX
- Passes all Test262 stage4 tests
- Full AST compatibility

### 2. Linter (oxlint)

- Over 520+ rules from ESLint, TypeScript, React, Jest, and more
- 93 default rules enabled out of the box
- No configuration required for basic usage
- Scales with CPU cores for maximum performance
- Supports `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.mts`, `.cts`, `.tsx`
- Works with Vue, Astro, Svelte script tags

### 3. Resolver (oxc-resolver)

- Node.js CommonJS and ESM path resolution
- Fully aligned with webpack/enhanced-resolve configurations
- High-performance module resolution
- Used by projects like Rolldown and swc-node

### 4. Transformer (oxc-transform)

- TypeScript to ESNext transformation
- React JSX transformation with built-in React Refresh
- TypeScript Isolated Declarations support
- Built-in plugins (styled-components, etc.)
- Babel compatibility

### 5. Additional Tools (In Development)

- **Minifier**: Alpha stage
- **Formatter**: Prototype complete with Prettier integration
- **Rolldown Bundler**: High-performance bundler
- **Nova JavaScript Engine**: JavaScript runtime

## Installation and Usage

### Oxlint (Linter)

#### Quick Start

```bash
# Direct run
npx oxlint@latest

# Save to project
npm install -D oxlint
# or
bun add -d oxlint
```

#### Basic Usage

```bash
# Lint current directory
oxlint

# Lint specific files
oxlint src/

# With configuration
oxlint --config .oxlintrc.json
```

### Oxc-Transform

#### Installation

```bash
npm install -D oxc-transform
# or
bun add -d oxc-transform
```

#### Basic Usage

```javascript
import { transform } from 'oxc-transform';

const result = transform('App.tsx', sourceCode, {
  typescript: {
    declaration: true, // Generate .d.ts files
  },
  jsx: {
    plugin: 'react',
    development: true,
  }
});

console.log(result.code);        // Transformed JavaScript
console.log(result.declaration); // TypeScript declarations
```

### Oxc-Resolver

#### Installation

```bash
npm install oxc-resolver
# or
bun add oxc-resolver
```

#### Basic Usage

```javascript
import resolve, { ResolverFactory } from 'oxc-resolver';

// Using default resolve function
const result = resolve.sync(process.cwd(), './src/index.js');
console.log(result.path);

// Using ResolverFactory
const resolver = new ResolverFactory({
  conditionNames: ['node', 'import'], // ESM
});

const resolved = resolver.sync(process.cwd(), './module');
```

## Configuration

### Oxlint Configuration (.oxlintrc.json)

#### Basic Configuration

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["import", "typescript", "unicorn"],
  "env": {
    "browser": true,
    "node": true
  },
  "globals": {
    "myGlobal": "readonly"
  },
  "rules": {
    "eqeqeq": "warn",
    "no-unused-vars": "error",
    "import/no-cycle": "error"
  }
}
```

#### Advanced Configuration with Overrides

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "jest"],
  "extends": ["oxlint:recommended"],
  "rules": {
    "typescript/no-explicit-any": "warn",
    "react/jsx-uses-react": "error"
  },
  "overrides": [
    {
      "files": ["**/*.test.{js,ts}"],
      "env": {
        "jest": true
      },
      "rules": {
        "jest/expect-expect": "error"
      }
    }
  ],
  "ignorePatterns": ["dist/", "node_modules/", "*.config.js"]
}
```

### Transform Configuration

#### TypeScript with Isolated Declarations

```javascript
import { transform } from 'oxc-transform';

const result = transform('Component.tsx', sourceCode, {
  typescript: {
    onlyRemoveTypeImports: true,
    declaration: {
      stripInternal: true
    }
  }
});
```

#### React with Refresh

```javascript
const result = transform('App.jsx', sourceCode, {
  jsx: {
    plugin: 'react',
    development: true,
    refresh: {
      refreshReg: '$RefreshReg$',
      refreshSig: '$RefreshSig$',
      emitFullSignatures: true
    }
  }
});
```

#### Styled Components Plugin

```javascript
const result = transform('StyledComponent.jsx', sourceCode, {
  plugins: {
    styledComponents: {
      displayName: true,
      ssr: true,
      fileName: true,
      minify: true
    }
  }
});
```

## Integration Patterns

### Bun Integration

#### package.json Scripts

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "type-check": "oxc-transform --check",
    "build": "oxc-transform src/ --out-dir dist/"
  },
  "devDependencies": {
    "oxlint": "latest",
    "oxc-transform": "latest"
  }
}
```

#### Bun Build Integration

```javascript
// build.ts
import { build } from 'bun';
import { transform } from 'oxc-transform';

await build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [
    {
      name: 'oxc-transform',
      setup(build) {
        build.onLoad({ filter: /\.tsx?$/ }, async (args) => {
          const source = await Bun.file(args.path).text();
          const result = transform(args.path, source, {
            typescript: { declaration: true }
          });
          return { contents: result.code };
        });
      }
    }
  ]
});
```

### Prettier Integration

#### Installation

```bash
npm install -D prettier @prettier/plugin-oxc
# or
bun add -d prettier @prettier/plugin-oxc
```

#### Configuration (.prettierrc.yml)

```yaml
plugins:
  - "@prettier/plugin-oxc"

overrides:
  - files: "**/*.{js,mjs,cjs,jsx}"
    options:
      parser: oxc
  - files: "**/*.{ts,mts,cts,tsx}"
    options:
      parser: oxc-ts
```

### Vue/Astro Integration

#### Vue Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'oxlint',
      buildStart() {
        // Run oxlint during build
        exec('oxlint src/');
      }
    }
  ]
});
```

#### Astro Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  vite: {
    plugins: [
      {
        name: 'oxc-transform',
        transform(code, id) {
          if (id.endsWith('.ts') || id.endsWith('.tsx')) {
            return transform(id, code, {
              typescript: { declaration: false }
            });
          }
        }
      }
    ]
  }
});
```

### GitHub Actions Integration

```yaml
name: Lint and Type Check
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      
      - name: Install dependencies
        run: bun install
        
      - name: Lint with oxlint
        run: bun run oxlint
        
      - name: Type check
        run: bun run oxc-transform --check src/
```

### Pre-commit Hooks

#### lint-staged Configuration

```json
{
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": [
      "oxlint --fix",
      "prettier --write"
    ]
  }
}
```

## Migration from Other Tools

### From ESLint

#### Replace ESLint with Oxlint

```bash
# Remove ESLint
npm uninstall eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Install oxlint
npm install -D oxlint
```

#### Convert .eslintrc.js to .oxlintrc.json

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["oxlint:recommended"],
  "plugins": ["typescript", "react"],
  "rules": {
    // Convert ESLint rules to oxlint equivalents
    "@typescript-eslint/no-explicit-any": "warn",
    "react/jsx-uses-react": "error"
  }
}
```

### From Biome

#### Replace Biome with Oxc Tools

```bash
# Remove Biome
npm uninstall @biomejs/biome

# Install oxc tools
npm install -D oxlint @prettier/plugin-oxc prettier
```

#### Convert biome.json

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "rules": {
    "no-unused-vars": "error",
    "eqeqeq": "warn"
  },
  "ignorePatterns": ["dist/", "build/"]
}
```

### From Babel/SWC

#### Replace with oxc-transform

```bash
# Remove Babel/SWC
npm uninstall @babel/core @babel/preset-env @babel/preset-typescript
npm uninstall @swc/core

# Install oxc-transform
npm install -D oxc-transform
```

## Advanced Usage

### Custom Rule Configuration

#### Severity Levels

- `"off"` or `0` - Turn the rule off
- `"warn"` or `1` - Turn the rule on as a warning
- `"error"` or `2` - Turn the rule on as an error

```json
{
  "rules": {
    "no-unused-vars": "error",
    "eqeqeq": ["warn", "always"],
    "prefer-const": "off"
  }
}
```

#### Category Configuration

```json
{
  "categories": {
    "correctness": "error",
    "style": "warn",
    "pedantic": "off"
  }
}
```

### Isolated Declarations

#### Generate .d.ts Files

```javascript
import { isolatedDeclaration } from 'oxc-transform';

const result = isolatedDeclaration('types.ts', sourceCode);
console.log(result.code); // Generated declarations
console.log(result.errors); // Any declaration errors
```

### Performance Optimization

#### Parallel Processing

```javascript
import { Worker } from 'worker_threads';
import { transform } from 'oxc-transform';

// Use Workers for CPU-intensive transformations
const transformInWorker = (files) => {
  return Promise.all(
    files.map(file => 
      new Worker('./transform-worker.js', { 
        workerData: { file } 
      })
    )
  );
};
```

## Troubleshooting

### Common Issues

#### Configuration Not Found

```bash
# Ensure configuration file is in the right location
ls -la .oxlintrc.json

# Use explicit config path
oxlint --config path/to/.oxlintrc.json
```

#### Rules Not Working

```json
{
  // Ensure correct plugin is loaded
  "plugins": ["typescript"],
  "rules": {
    "typescript/no-explicit-any": "error"
  }
}
```

#### Performance Issues

```bash
# Use ignore patterns for large directories
echo "node_modules/" >> .oxlintignore
echo "dist/" >> .oxlintignore
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=oxc:* oxlint src/

# Verbose output
oxlint --debug src/
```

## Best Practices

### Configuration Management

- Use `.oxlintrc.json` for consistent team configuration
- Leverage `ignorePatterns` for build artifacts and dependencies
- Use `overrides` for different file types or directories

### Performance Tips

- Use `.oxlintignore` file for excluding large directories
- Run oxlint in CI/CD for consistent quality checks
- Combine with IDE extensions for real-time feedback

### Code Quality

- Start with recommended configurations
- Gradually enable stricter rules
- Use TypeScript strict mode with oxc-transform

## IDE Integration

### VSCode Extension

```json
{
  "extensions.recommendations": ["oxc.vscode-oxc"]
}
```

### Settings

```json
{
  "oxc.enable": true,
  "oxc.run": "onType",
  "oxc.configPath": ".oxlintrc.json"
}
```

## Resources

### Documentation

- [Official Documentation](https://oxc.rs/docs)
- [GitHub Repository](https://github.com/oxc-project/oxc)
- [Configuration Schema](https://oxc.rs/docs/guide/usage/linter/config-file-reference.html)

### Community

- [Discord](https://discord.gg/9uXCAwqQZW)
- [GitHub Discussions](https://github.com/oxc-project/oxc/discussions)
- [Issue Tracker](https://github.com/oxc-project/oxc/issues)

### Examples

- [Stackblitz Demo](https://stackblitz.com/edit/oxc-resolver)
- [Example Configurations](https://github.com/oxc-project/oxc/tree/main/examples)

## Migration Considerations

### Compatibility

- Oxlint supports most ESLint rules but not all
- Some TypeScript-specific features may need adjustment
- Custom ESLint plugins need oxc equivalents

### Gradual Migration

1. Run oxlint alongside existing tools
2. Compare outputs and adjust configurations
3. Gradually replace tools one by one
4. Update CI/CD pipelines last

### Performance Monitoring

- Measure build times before and after migration
- Monitor memory usage improvements
- Track developer experience improvements

## Code Examples Location

Comprehensive examples available in `/home/bodnar/.claude/snippets/oxc/`:

- Basic linting configurations
- Advanced transform patterns
- Integration examples with Bun/Vue/Astro
- Migration scripts and configurations
- Performance optimization examples
- CI/CD integration patterns
