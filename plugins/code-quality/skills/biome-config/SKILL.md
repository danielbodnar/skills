---
name: biome-config
description: Set up and configure Biome for linting and formatting TypeScript/JavaScript projects
---

## Biome Configuration

Biome is a fast formatter and linter for JavaScript, TypeScript, JSON, and CSS. It replaces Prettier and parts of ESLint with a single tool that runs in milliseconds.

## Installation

Install Biome as a dev dependency and generate the initial configuration:

```bash
bun i -D @biomejs/biome
```

```bash
bunx @biomejs/biome@latest init
```

This generates `biome.jsonc` (or `biome.json`) in the project root.

## Recommended Configuration

Create or update `biome.jsonc` in the project root. Always use the local schema reference for editor autocompletion:

```jsonc
{
  "$schema": "node_modules/@biomejs/biome/configuration_schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": {
    "enabled": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": "warn"
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "warn"
      },
      "style": {
        "useConst": "error",
        "useTemplate": "error",
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5",
      "semicolons": "always",
      "arrowParentheses": "always"
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "none"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      "build",
      ".next",
      ".nuxt",
      ".output",
      "coverage",
      "*.min.js",
      "*.min.css"
    ]
  }
}
```

### Key Configuration Sections

- **vcs**: Integrates with git to respect `.gitignore` patterns automatically
- **organizeImports**: Sorts and groups import statements on format
- **formatter**: Controls indentation, line width, and line endings
- **linter**: Enables rule categories with recommended defaults and targeted overrides
- **javascript.formatter**: JavaScript/TypeScript-specific formatting preferences
- **files.ignore**: Paths excluded from all Biome operations

### Schema Reference

Always use the local schema path for offline support and version-locked autocompletion:

```jsonc
"$schema": "node_modules/@biomejs/biome/configuration_schema.json"
```

This ensures the schema matches the installed Biome version exactly.

## Package Scripts

Add Biome scripts to `package.json`:

```json
{
  "scripts": {
    "format": "biome format --write .",
    "format:check": "biome format .",
    "check": "biome check --write .",
    "check:ci": "biome ci ."
  }
}
```

### Script Descriptions

- **format**: Format all files in-place
- **format:check**: Check formatting without modifying files (useful for CI)
- **check**: Run linter and formatter with auto-fix
- **check:ci**: Run all checks in CI mode (fails on any issue, no auto-fix)

## Pre-Commit Hook Integration

With husky and lint-staged installed, add Biome to the lint-staged configuration in `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,mts,cts}": [
      "biome check --write --no-errors-on-unmatched"
    ],
    "*.{json,jsonc}": [
      "biome format --write --no-errors-on-unmatched"
    ]
  }
}
```

## Usage

Check the entire project (lint + format):

```bash
bunx @biomejs/biome check .
```

Check and auto-fix:

```bash
bunx @biomejs/biome check --write .
```

Format only:

```bash
bunx @biomejs/biome format --write .
```

Run in CI mode (strict, no auto-fix):

```bash
bunx @biomejs/biome ci .
```

## Integration with OxLint

Biome and OxLint handle complementary concerns. OxLint provides deeper TypeScript-aware linting with plugins (jsdoc, import, node), while Biome handles formatting and basic lint rules. When both are configured:

- Disable overlapping lint rules in Biome that OxLint already covers
- Run OxLint for linting, Biome for formatting and import organization
- In lint-staged, run OxLint first, then Biome:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,mts,cts}": [
      "oxlint --fix",
      "biome check --write --no-errors-on-unmatched"
    ]
  }
}
```

## Editor Integration

Biome provides LSP support for real-time feedback. Install the Biome extension for your editor:

- **VS Code**: Install `biomejs.biome` extension
- **Zed**: Built-in Biome support via language server
- **Neovim**: Configure via `nvim-lspconfig` with `biome` server
