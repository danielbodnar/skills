---
name: pkg-skills-scaffold
description: Agent-rendered skill generation — execute the templates/ directory for one package with curation in the loop.
disable-model-invocation: true
argument-hint: [package]
arguments: package
allowed-tools: Bash(pkg-skills *), Bash(bun run *), Read, Write
---

# /pkg-skills-scaffold

**Command:** `/pkg-skills-scaffold <package>`

**Purpose:** "run" the executable template directory for `$package` with an
agent in the loop. Identical structure to `/pkg-skills-generate`, but prose
(description, cheatsheet curation, example selection) is authored from the
local cache rather than template-filled — near-zero network tokens.

## Inputs (gathered, not fetched by the agent)

Cache refresh for `$package`:

!`pkg-skills fetch "$package" 2>&1 || bun run ${CLAUDE_PLUGIN_ROOT}/src/index.ts fetch "$package"`

Template variables (the `${VAR}` vocabulary, including CACHE_DIR and OUTPUT_DIR):

!`pkg-skills meta "$package" 2>/dev/null || bun run ${CLAUDE_PLUGIN_ROOT}/src/index.ts meta "$package"`

Template blueprint files:

!`ls -1 ${CLAUDE_PLUGIN_ROOT}/templates ${CLAUDE_PLUGIN_ROOT}/templates/references ${CLAUDE_PLUGIN_ROOT}/templates/examples`

Variable legend: @${CLAUDE_PLUGIN_ROOT}/templates/VARIABLES.md
Skill blueprint: @${CLAUDE_PLUGIN_ROOT}/templates/SKILL.md
Cheatsheet blueprint: @${CLAUDE_PLUGIN_ROOT}/templates/cheatsheet.md
Commands blueprint: @${CLAUDE_PLUGIN_ROOT}/templates/commands.md
Reference blueprint: @${CLAUDE_PLUGIN_ROOT}/templates/references/reference.md
Examples blueprint: @${CLAUDE_PLUGIN_ROOT}/templates/examples/basic-usage.md

## Process

1. Parse the meta JSON above into the `${VAR}` map; CACHE_DIR holds the fetched artifacts
2. For each blueprint: substitute `${VAR}`s, resolve `@ref` lines by Reading the
   matching file in CACHE_DIR, and **improve the prose** — real task-oriented
   cheatsheet rows from the actual help text, examples that use the tool's real
   flags (keep `$ARGUMENTS` / `@FILENAME` parameterization), a description that
   states the key use case first
3. Write the finished files to `OUTPUT_DIR/SKILL_NAME/` mirroring the template tree
4. Validate: `pkg-skills validate <output dir>` — fix every error before continuing
5. Install: `skills add <output dir> -g -y`

**Output:** one installed, agent-curated skill.

**Next Step:** `/pkg-skills-generate --changed-only` keeps it updated automatically.
