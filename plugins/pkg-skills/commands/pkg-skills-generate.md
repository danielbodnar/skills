---
name: pkg-skills-generate
description: Deterministically generate or update Claude skills for opted-in packages.
disable-model-invocation: true
argument-hint: [package…] [--changed-only]
allowed-tools: Bash(pkg-skills *), Bash(bun run *), Read
---

# /pkg-skills-generate

**Command:** `/pkg-skills-generate $ARGUMENTS`

**Purpose:** run the deterministic pipeline (fetch docs → render templates →
validate → `skills add` → mirror) for opted-in packages. This is the same code
path the systemd timer and alpm hook use — zero agent tokens per skill.

**Arguments:**
- `[package…]` — limit to specific packages (must be opted in)
- `--changed-only` — skip packages whose installed version has not changed

**Process:**
1. Run the generation (output below)
2. Report what was generated, failed, or skipped — quote validator findings verbatim
3. For any failure, inspect the named skill dir and explain the failing checklist rule

!`pkg-skills generate $ARGUMENTS 2>&1 || bun run ${CLAUDE_PLUGIN_ROOT}/src/index.ts generate $ARGUMENTS`

**Output:** installed skills under `~/.agents/skills/pkg-<name>/`, symlinked into
`~/.claude/skills/`; validator findings on stderr.

**Next Step:** `/pkg-skills-enrich <pkg>` to hand-polish the prose of any skill.
