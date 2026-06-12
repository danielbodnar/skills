---
name: pkg-skills-sync
description: Refresh the pkg-skills packages.conf opt-in list from every package manager on the system.
disable-model-invocation: true
allowed-tools: Bash(pkg-skills *), Bash(bun run *)
---

# /pkg-skills-sync

**Command:** `/pkg-skills-sync`

**Purpose:** enumerate explicitly-installed packages across pacman, cargo, bun,
npm, pnpm, yarn, mise, go, pipx, deno, and uv, and merge them into
`$XDG_CONFIG_HOME/pkg-skills/packages.conf`. New packages arrive commented out;
existing opt-in choices are never touched.

**Process:**
1. Run the sync (output below)
2. Summarize: how many packages, how many new, how many opted in
3. Suggest `/pkg-skills-select` if nothing is opted in yet

!`pkg-skills sync 2>/dev/null || bun run ${CLAUDE_PLUGIN_ROOT}/src/index.ts sync`

**Output:** updated packages.conf (idempotent — safe to re-run anytime).

**Next Step:** `/pkg-skills-select` to opt packages in.
