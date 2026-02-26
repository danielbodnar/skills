# Migration Guide: From Biome to Oxc

This guide covers migrating from Biome to the Oxc toolchain for linting and formatting.

## Overview

Biome provides both linting and formatting in one tool, while Oxc uses separate tools:

- **oxlint** for linting (replaces Biome's linter)
- **@prettier/plugin-oxc** for formatting (Prettier with Oxc parser)

## Step 1: Remove Biome

```bash
# Remove Biome
npm uninstall @biomejs/biome
# or
bun remove @biomejs/biome

# Remove Biome configuration
rm biome.json
rm biome.jsonc
```

## Step 2: Install Oxc Tools

```bash
# Install oxlint and prettier with oxc plugin
npm install -D oxlint prettier @prettier/plugin-oxc
# or
bun add -d oxlint prettier @prettier/plugin-oxc
```

## Step 3: Configuration Migration

### From biome.json to .oxlintrc.json

**Before (biome.json):**

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "warn" },
      "style": { "noUselessElse": "warn", "useImportType": "error" },
      "correctness": { "noUnusedVariables": "error" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingComma": "es5",
      "semi": "always"
    }
  }
}
```

**After (.oxlintrc.json):**

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "import"],
  "extends": ["oxlint:recommended"],
  "rules": {
    "typescript/no-explicit-any": "warn",
    "no-unused-vars": "error",
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
      "newlines-between": "always"
    }]
  },
  "ignorePatterns": ["dist/", "node_modules/"]
}
```

**After (.prettierrc.yml):**

```yaml
plugins:
  - "@prettier/plugin-oxc"

semi: true
singleQuote: true
trailingComma: "es5"
tabWidth: 2
printWidth: 80

overrides:
  - files: "**/*.{js,mjs,cjs,jsx}"
    options:
      parser: "oxc"
  - files: "**/*.{ts,mts,cts,tsx}"
    options:
      parser: "oxc-ts"
```

## Step 4: Update package.json Scripts

**Before:**

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "format": "biome format --write .",
    "format:check": "biome format ."
  }
}
```

**After:**

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "quality": "oxlint && prettier --check ."
  }
}
```

## Step 5: Rule Mapping

### Common Biome to Oxlint Rule Mappings

| Biome Rule | Oxlint Equivalent |
|------------|------------------|
| `correctness.noUnusedVariables` | `no-unused-vars` |
| `suspicious.noExplicitAny` | `typescript/no-explicit-any` |
| `style.useImportType` | `typescript/consistent-type-imports` |
| `style.noUselessElse` | `no-else-return` |
| `correctness.noUndeclaredVariables` | `no-undef` |
| `correctness.noUnusedImports` | `import/no-unused-modules` |

### Rules Not Available in Oxlint

Some Biome rules don't have direct oxlint equivalents:

- `style.useConst` → Use TypeScript compiler or ESLint
- Formatting rules → Use Prettier instead

## Step 6: CI/CD Updates

### GitHub Actions

**Before:**

```yaml
- name: Lint and Format
  run: |
    biome check .
    biome format --check .
```

**After:**

```yaml
- name: Lint
  run: oxlint

- name: Format Check
  run: prettier --check .
```

### Pre-commit Hooks

**Before (lint-staged):**

```json
{
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": ["biome check --apply"]
  }
}
```

**After:**

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

## Step 7: IDE Integration

### VS Code

**Remove Biome extension:**

- Uninstall "Biome" extension

**Install Oxc extensions:**

- Install "oxc" extension for linting
- Install "Prettier - Code formatter" extension

**Update settings.json:**

```json
{
  // Remove Biome settings
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.oxc": true
    }
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.oxc": true
    }
  }
}
```

## Step 8: Performance Comparison

After migration, you should see significant performance improvements:

| Tool | Task | Before (Biome) | After (Oxc) |
|------|------|---------------|-------------|
| Linting | Large codebase | ~2s | ~0.1s |
| Formatting | 1000 files | ~1s | ~0.2s |

## Step 9: Validation

Run these commands to ensure migration was successful:

```bash
# Test linting
oxlint

# Test formatting
prettier --check .

# Test fix functionality
oxlint --fix
prettier --write .

# Run full quality check
npm run quality
```

## Troubleshooting

### Common Issues

1. **Missing rules**: Some Biome rules may not exist in oxlint
   - **Solution**: Use alternative rules or add custom ESLint rules if needed

2. **Different formatting output**: Prettier with oxc parser may format differently than Biome
   - **Solution**: Run `prettier --write .` to normalize all files

3. **Performance issues**: If oxlint seems slow
   - **Solution**: Check ignore patterns and exclude large directories

### Migration Checklist

- [ ] Remove Biome package and configuration
- [ ] Install oxlint and prettier with oxc plugin
- [ ] Create .oxlintrc.json configuration
- [ ] Create .prettierrc.yml configuration
- [ ] Update package.json scripts
- [ ] Update CI/CD configuration
- [ ] Update IDE settings and extensions
- [ ] Test linting and formatting
- [ ] Validate performance improvements
- [ ] Update team documentation

## Advanced Configuration

### Custom Rules

If you need custom rules that oxlint doesn't provide:

```json
{
  "extends": ["oxlint:recommended"],
  "plugins": ["custom"],
  "rules": {
    "custom/my-rule": "error"
  }
}
```

### Monorepo Setup

For monorepos, create root and package-specific configurations:

```json
// Root .oxlintrc.json
{
  "extends": ["oxlint:recommended"],
  "ignorePatterns": ["packages/*/dist/"]
}

// packages/frontend/.oxlintrc.json
{
  "extends": ["../../.oxlintrc.json"],
  "plugins": ["react"],
  "rules": {
    "react/jsx-uses-react": "error"
  }
}
```

## Conclusion

The migration from Biome to Oxc provides:

- ✅ Significantly faster linting (50-100x speedup)
- ✅ Better ecosystem integration
- ✅ More mature tooling
- ⚠️ Requires two tools instead of one
- ⚠️ Some rule differences may require configuration adjustments

The performance benefits typically outweigh the slight increase in configuration complexity.
