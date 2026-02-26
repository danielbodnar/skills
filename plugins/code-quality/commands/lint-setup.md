---
name: lint-setup
description: Set up OxLint, Biome, and Prettier with pre-commit hooks in the current project
---

Set up a complete linting and formatting toolchain for this project. Follow each step in order. Run each command individually.

## Step 1: Install Dependencies

Install OxLint, Biome, Prettier, husky, and lint-staged as dev dependencies:

```bash
bun i -D oxlint @biomejs/biome prettier husky lint-staged
```

## Step 2: Initialize OxLint

Generate the OxLint configuration with all recommended plugins:

```bash
bunx oxlint@latest --init --jsdoc-plugin --node-plugin --import-plugin
```

Update the generated `.oxlintrc.json` to use these opinionated defaults:

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

## Step 3: Initialize Biome

Generate the Biome configuration:

```bash
bunx @biomejs/biome@latest init
```

Update the generated `biome.jsonc` to use these defaults:

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
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "warn"
      },
      "style": {
        "useConst": "error",
        "useTemplate": "error"
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
      "coverage"
    ]
  }
}
```

## Step 4: Configure Prettier

Create `.prettierrc.yml` for any file types Biome does not cover (markdown, YAML, HTML):

```yaml
semi: true
singleQuote: true
trailingComma: es5
printWidth: 100
tabWidth: 2
endOfLine: lf
```

Create `.prettierignore` to avoid conflicts with Biome:

```
*.ts
*.tsx
*.js
*.jsx
*.mts
*.cts
*.json
*.jsonc
node_modules
dist
build
coverage
```

## Step 5: Initialize Pre-Commit Hooks

Initialize husky:

```bash
bunx husky init
```

Write the `.husky/pre-commit` file with this content:

```bash
bunx lint-staged
```

## Step 6: Configure lint-staged

Add the `lint-staged` configuration to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,mts,cts}": [
      "oxlint --fix",
      "biome check --write --no-errors-on-unmatched"
    ],
    "*.{json,jsonc}": [
      "biome format --write --no-errors-on-unmatched"
    ],
    "*.{md,yml,yaml,html,css}": [
      "prettier --write"
    ]
  }
}
```

## Step 7: Add Package Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "check": "biome check --write .",
    "check:ci": "biome ci .",
    "quality": "oxlint && biome ci ."
  }
}
```

## Step 8: Verify Setup

Run the full quality check to confirm everything works:

```bash
bun run quality
```
