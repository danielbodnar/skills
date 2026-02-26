---
name: init-mise
description: Initialize mise tool version management in the current project
---

Set up mise in the current project by creating a `.mise.toml` configuration file.

## Steps

### Detect project type

Examine existing files to determine the project type:

- `package.json` with `bun.lock` or `bun.lockb` -> Bun project
- `wrangler.jsonc` or `wrangler.toml` -> Cloudflare Workers project
- `Cargo.toml` -> Rust project
- `Cargo.toml` and `package.json` -> Rust + Bun project
- No indicators -> ask the user

### Check for existing configuration

Look for existing tool version files:

- `.mise.toml` -- already configured, offer to update
- `.tool-versions` -- offer to migrate to `.mise.toml`
- `.nvmrc` or `.node-version` -- extract Node version, offer to migrate
- `rust-toolchain.toml` -- extract Rust channel, offer to migrate

If any exist, show the user what was found and ask whether to migrate or replace.

### Generate `.mise.toml`

Create a `.mise.toml` file using the appropriate template from the `mise-config` skill based on the detected project type. Use the following defaults:

- Bun: `bun = "latest"`, `just = "latest"`
- Cloudflare Workers: `bun = "latest"`, `node = "22"`, `just = "latest"`
- Rust: `rust = "stable"`, `just = "latest"`
- Rust + Bun: `bun = "latest"`, `rust = "stable"`, `just = "latest"`

### Activate and install

After creating the file, run:

1. `mise trust` to mark the directory as trusted
2. `mise install` to install all specified tools

### Clean up migrated files

If migrating from another tool version manager, ask the user whether to delete the old files (`.nvmrc`, `.node-version`, `.tool-versions`, `rust-toolchain.toml`).

### Summary

Report what was configured:

- List the tools and versions in `.mise.toml`
- Confirm tools were installed successfully
- Note any migration actions taken
- Suggest adding `.mise.toml` to version control
