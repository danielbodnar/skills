---
name: oxlint-config
description: Set up and configure OxLint for TypeScript/JavaScript projects with opinionated defaults
---

## OxLint Configuration

OxLint is a high-performance linter for JavaScript and TypeScript, built on the oxc toolchain. It runs 50-100x faster than ESLint and provides a zero-config experience with sensible defaults.

## Installation

Install OxLint as a dev dependency and generate the initial configuration:

```bash
bun i -D oxlint
```

```bash
bunx oxlint@latest --init --jsdoc-plugin --node-plugin --import-plugin
```

This generates `.oxlintrc.json` with the jsdoc, node, and import plugins enabled.

## Recommended Configuration

Create or update `.oxlintrc.json` in the project root with the following opinionated defaults:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "rules": {
    "typescript": "all",
    "suspicious": "all",
    "correctness": "all",
    "style": "all",
    "pedantic": "warn"
  },
  "fix": true,
  "import-plugin": true,
  "jsdoc-plugin": true,
  "node-plugin": true
}
```

### Rule Categories

- **typescript** (`all`): Enforces TypeScript-specific best practices, catches type-related issues
- **suspicious** (`all`): Flags code patterns that are likely bugs or unintended behavior
- **correctness** (`all`): Catches definite errors and incorrect code
- **style** (`all`): Enforces consistent code style conventions
- **pedantic** (`warn`): Opinionated rules that may produce false positives; set to warn rather than error

### Plugins

- **import-plugin**: Validates import/export syntax, prevents misspelled paths and missing exports
- **jsdoc-plugin**: Enforces JSDoc comment consistency and correctness
- **node-plugin**: Catches common Node.js/Bun API misuse patterns

## Package Scripts

Add linting scripts to `package.json`:

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix"
  }
}
```

## Pre-Commit Hook Integration

Install husky and lint-staged:

```bash
bun i -D husky lint-staged
```

Initialize husky:

```bash
bunx husky init
```

Write the pre-commit hook file `.husky/pre-commit`:

```bash
bunx lint-staged
```

Add lint-staged configuration to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,mts,cts}": [
      "oxlint --fix"
    ]
  }
}
```

## Usage

Run the linter on the entire project:

```bash
bunx oxlint
```

Run with auto-fix enabled:

```bash
bunx oxlint --fix
```

Lint a specific directory:

```bash
bunx oxlint src/
```

## Overriding Rules

Disable a specific rule in `.oxlintrc.json`:

```json
{
  "rules": {
    "no-unused-vars": "off",
    "typescript/no-explicit-any": "warn"
  }
}
```

Use inline comments for one-off suppressions:

```typescript
// oxlint-disable-next-line no-unused-vars
const _placeholder = 'intentionally unused';
```

## Integration with Biome

OxLint handles linting while Biome handles formatting. They complement each other without overlap. Run OxLint first for lint errors, then Biome for formatting:

```json
{
  "scripts": {
    "quality": "oxlint && bunx @biomejs/biome check ."
  }
}
```
