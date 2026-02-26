#!/bin/bash
# Presetter Installation Examples

# 1. Install with Bun (recommended)
bun add -d presetter presetter-preset-esm

# 2. Install with npm
npm install --save-dev presetter presetter-preset-esm

# 3. Install with yarn
yarn add -D presetter presetter-preset-esm

# 4. Install with pnpm
pnpm add -D presetter presetter-preset-esm

# 5. Install multiple presets for comprehensive setup
bun add -d presetter \
  presetter-preset-esm \
  presetter-preset-strict \
  presetter-preset-web

# 6. Install foundation presets
bun add -d presetter \
  presetter-preset-essentials \
  presetter-preset-monorepo

# 7. Install React-specific presets
bun add -d presetter \
  presetter-preset-esm \
  presetter-preset-react

# 8. Install build tool presets
bun add -d presetter \
  presetter-preset-rollup \
  presetter-preset-web

# 9. Quick project initialization
npx presetter use presetter-preset-esm
# or
bunx presetter use presetter-preset-esm

# 10. Bootstrap configuration after setup
npx presetter bootstrap
# or
bunx presetter bootstrap