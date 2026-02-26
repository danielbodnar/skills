#!/bin/bash
# Oxc Installation Examples

# Quick start with oxlint
echo "Running oxlint without installation..."
npx oxlint@latest

# Install oxlint as dev dependency
echo "Installing oxlint..."
npm install -D oxlint
# or with bun
bun add -d oxlint

# Install oxc-transform
echo "Installing oxc-transform..."
npm install -D oxc-transform
# or with bun
bun add -d oxc-transform

# Install oxc-resolver
echo "Installing oxc-resolver..."
npm install oxc-resolver
# or with bun
bun add oxc-resolver

# Install prettier oxc plugin
echo "Installing prettier oxc plugin..."
npm install -D prettier @prettier/plugin-oxc
# or with bun
bun add -d prettier @prettier/plugin-oxc

# Verify installations
echo "Verifying installations..."
npx oxlint --version
node -e "console.log(require('oxc-transform').transform)"
node -e "console.log(require('oxc-resolver'))"

echo "Oxc tools installed successfully!"