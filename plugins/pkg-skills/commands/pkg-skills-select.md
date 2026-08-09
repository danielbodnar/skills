---
name: pkg-skills-select
description: Choose which installed packages get generated Claude skills (space-to-toggle multi-select).
disable-model-invocation: true
allowed-tools: Bash(pkg-skills *), Bash(bun run *), Read
---

# /pkg-skills-select

**Command:** `/pkg-skills-select`

**Purpose:** opt packages in or out of skill generation.

**Process:**
1. The native TUI (`pkg-skills select`) needs a real terminal, which slash
   commands do not provide — so present the selection interactively instead:
2. Read the current list (below), show the user the *not yet opted-in* packages
   grouped by manager, and ask which to enable (the AskUserQuestion tool with
   multiSelect works well for ≤4 candidate groups; otherwise ask in prose).
3. Apply the chosen toggles by editing
   `$XDG_CONFIG_HOME/pkg-skills/packages.conf`: uncomment a line to opt in,
   re-comment to opt out. Change nothing else.
4. Confirm the result with `pkg-skills list`.

**Current list:**

!`pkg-skills list 2>/dev/null || bun run ${CLAUDE_PLUGIN_ROOT}/src/index.ts list`

**Output:** updated packages.conf.

**Next Step:** `/pkg-skills-generate` to build skills for the opted-in packages.
