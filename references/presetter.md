# Presetter Reference

**Always remember to reference @$HOME/.claude/references/presetter.md and look for snippets and examples in @$HOME/.claude/snippets/presetter/**

## Quick Reference

- Installation: `bun add -d presetter presetter-preset-esm`
- Configuration: `presetter.config.ts`
- Documentation: [https://github.com/alvis/presetter](https://github.com/alvis/presetter)
- GitHub: [https://github.com/alvis/presetter](https://github.com/alvis/presetter)
- Package: [https://www.npmjs.com/package/presetter](https://www.npmjs.com/package/presetter)

## Default Usage Patterns

Default to using Presetter for TypeScript project configuration management instead of manual configuration setup:

- Use `bun add -d presetter presetter-preset-esm` instead of manually configuring TypeScript projects
- Use `presetter use <preset>` to adopt configuration presets
- Use `presetter bootstrap` to apply configurations automatically
- Presetter transforms 40+ dev dependencies into 2 packages through preset-based configuration
- Built-in support for ESM, CJS, Hybrid, Strict, Web, and React presets

### Key APIs

- `presetter use <preset>` for adopting configuration presets. Don't use manual configuration.
- `presetter bootstrap` for applying preset configurations to project
- `preset()` function for creating custom presets with extends and override patterns
- Built-in preset composition with conflict resolution and template generation

## Resources and Documentation

- [Presetter Documentation](https://github.com/alvis/presetter)
  - [Getting Started](https://github.com/alvis/presetter#getting-started)
  - [Configuration Guide](https://github.com/alvis/presetter#configuration)
    - [Preset System](https://github.com/alvis/presetter#preset-system)
    - [Override Patterns](https://github.com/alvis/presetter#overrides)
    - [Template Generation](https://github.com/alvis/presetter#templates)
  - [Preset Packages](https://github.com/alvis/presetter/tree/master/packages)
    - [Foundation Presets](https://github.com/alvis/presetter/tree/master/packages/preset-essentials)
    - [Module System Presets](https://github.com/alvis/presetter/tree/master/packages/preset-esm)
    - [Specialized Presets](https://github.com/alvis/presetter/tree/master/packages/preset-strict)
  - [CLI Reference](https://github.com/alvis/presetter#cli-commands)
  - [API Documentation](https://github.com/alvis/presetter#api)
- [Community Resources](https://github.com/alvis/presetter/discussions)
  - [Examples Repository](https://github.com/alvis/presetter/tree/master/examples)
  - [Best Practices](https://github.com/alvis/presetter/wiki)
  - [Migration Guides](https://github.com/alvis/presetter/releases)

## Purpose and Philosophy

Presetter is a configuration management tool for TypeScript projects that follows the principle of "Transform 40+ dev dependencies into 2 packages." It provides:

### Core Concepts

- **Preset-based Configuration**: Centralized configuration through composable presets
- **Template-driven Setup**: Automatic generation of configuration files from templates
- **Dependency Management**: Automated handling of development dependencies
- **Modular Architecture**: Extensible and composable preset system

### Key Benefits

- Reduces configuration complexity across projects
- Provides consistent development environments
- Simplifies dependency management
- Enables rapid project setup and standardization
- Supports both simple and complex configuration scenarios

## Installation and Setup

### Basic Installation

```bash
# With Bun (recommended)
bun add -d presetter presetter-preset-esm

# With npm
npm install --save-dev presetter presetter-preset-esm

# With yarn
yarn add -D presetter presetter-preset-esm

# With pnpm
pnpm add -D presetter presetter-preset-esm
```

### CLI Commands

```bash
# Adopt a preset
bunx presetter use presetter-preset-esm

# Apply configurations
bunx presetter bootstrap

# List available presets
bunx presetter list

# Show current configuration
bunx presetter show
```

## Configuration Patterns

### Basic Configuration

```typescript
// presetter.config.ts - Simple preset adoption
export { default } from 'presetter-preset-esm';
```

### Advanced Configuration

```typescript
// presetter.config.ts - Multi-preset with overrides
import { preset } from 'presetter';
import esm from 'presetter-preset-esm';
import strict from 'presetter-preset-strict';

export default preset('my-project', {
  extends: [esm, strict],
  override: {
    'tsconfig.json': {
      compilerOptions: {
        target: 'ES2023',
        strict: true
      }
    }
  },
  variables: {
    target: 'ES2023',
    source: 'src'
  }
});
```

## Available Presets

### Foundation Presets

- **presetter-preset-essentials**: Core development toolkit
- **presetter-preset-monorepo**: Monorepo management and tooling

### Module System Presets

- **presetter-preset-esm**: ES Modules support
- **presetter-preset-cjs**: CommonJS support  
- **presetter-preset-hybrid**: Dual module system support

### Specialized Presets

- **presetter-preset-strict**: Strict TypeScript and linting rules
- **presetter-preset-web**: Web application development
- **presetter-preset-react**: React application development

### Build Tool Presets

- **presetter-preset-rollup**: Rollup bundling configuration
- **presetter-preset-vite**: Vite build system integration

## Creating Custom Presets

### Custom Preset Structure

```typescript
// my-custom-preset.ts
import type { PresetConfig } from 'presetter';

export const myCustomPreset = (): PresetConfig => ({
  displayName: 'My Custom Preset',
  description: 'Custom development workflow',
  
  dependencies: {
    dependencies: {},
    devDependencies: {
      typescript: '^5.6.0',
      '@biomejs/biome': '^1.9.0'
    }
  },
  
  config: {
    'tsconfig.json': {
      compilerOptions: {
        target: 'ES2023',
        module: 'ESNext'
      }
    }
  },
  
  templates: {
    'src/index.ts': 'export const hello = "world";'
  }
});
```

### Preset Composition

```typescript
// Composing multiple presets
import { composePresets } from 'presetter';
import esm from 'presetter-preset-esm';
import { myCustomPreset } from './my-custom-preset';

export default composePresets(esm, myCustomPreset());
```

## Integration Examples

### With Vike Framework

```typescript
// presetter.config.ts for Vike projects
import { preset } from 'presetter';
import esm from 'presetter-preset-esm';
import web from 'presetter-preset-web';

export default preset('vike-app', {
  extends: [esm, web],
  override: {
    'vite.config.ts': {
      plugins: ['vike/plugin'],
      ssr: { noExternal: ['some-package'] }
    }
  }
});
```

### With Bati Scaffolding

```typescript
// presetter.config.ts for Bati projects
import { preset } from 'presetter';
import esm from 'presetter-preset-esm';
import react from 'presetter-preset-react';

export default preset('bati-app', {
  extends: [esm, react],
  override: {
    'package.json': {
      scripts: {
        'dev': 'bati dev',
        'build': 'bati build'
      }
    }
  }
});
```

## Best Practices

### Project Organization

- Use descriptive preset names that reflect project purpose
- Combine multiple presets for comprehensive configurations
- Leverage `override` for project-specific customizations
- Use `variables` for template parameterization

### Configuration Management

- Start with foundation presets and add specialized ones
- Prefer preset composition over large custom presets
- Use version pinning for stable configurations
- Document custom preset choices and reasoning

### Development Workflow

- Run `presetter bootstrap` after preset changes
- Use `presetter show` to verify configuration
- Test preset changes in isolation before applying
- Keep preset configurations in version control

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/presetter/`:

- Basic usage patterns and installation
- Advanced configuration and preset composition  
- Custom preset creation and template generation
- Integration examples with modern frameworks
- Testing setup and CI/CD configurations
- Linting and formatting integrations
- Build system configurations

## Schema and Type Definitions

Type definitions and configuration schemas in `$HOME/.claude/snippets/presetter/schemas/`:

- PresetConfig interface definitions
- Template and override type specifications
- CLI command schemas and validation patterns

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/presetter/linting/`:

- Biome integration patterns
- ESLint and Prettier configurations
- Pre-commit hook setups
- CI/CD linting workflows

## Related Tools and Frameworks

### Modern Web Development

- **Vike**: Next-generation web framework with architectural freedom
- **Bati**: Web app scaffolding tool built on Vike
- **Astro**: Modern static site generator with component islands
- **Vite**: Fast build tool with ES modules support

### Configuration Management

- **EditorConfig**: Consistent coding styles across editors
- **Prettier**: Opinionated code formatting
- **Biome**: Fast linter and formatter for JavaScript/TypeScript
- **ESLint**: Pluggable JavaScript linter

### Package Management

- **Bun**: Fast JavaScript runtime and package manager
- **pnpm**: Efficient package manager with workspace support
- **Yarn**: Package manager with workspaces and plug'n'play
- **npm**: Node.js package manager with registry access
