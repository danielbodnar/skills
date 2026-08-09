---
name: pkg-skills-enrich
description: Improve the prose of an already-generated package skill using only its local cached artifacts.
disable-model-invocation: true
argument-hint: [package]
arguments: package
allowed-tools: Bash(pkg-skills *), Bash(bun run *), Read, Edit, Write
---

# /pkg-skills-enrich

**Command:** `/pkg-skills-enrich <package>`

**Purpose:** upgrade a template-generated skill into a hand-curated one. All
inputs are already on disk (skill dir + fetch cache) — do not fetch from the
network.

**Variables and locations for `$package`:**

!`pkg-skills meta "$package" 2>/dev/null || bun run ${CLAUDE_PLUGIN_ROOT}/src/index.ts meta "$package"`

**Process:**
1. Locate the installed skill: `~/.agents/skills/<SKILL_NAME>/` (from the meta above)
2. Read its `references/cli-help.txt`, `references/man.txt`, and `references/reference.md`
3. Rewrite `cheatsheet.md` as a task → command table covering the 10–15 most
   useful real invocations (derive from help/man, not memory)
4. Expand `commands.md` with one spec block per major subcommand/flag-group
   (`**Command:** <bin> <sub> $ARGUMENTS` · Purpose · Process · Output)
5. Add 2–3 worked examples to `examples/`, parameterized with `$ARGUMENTS`/`@FILENAME`
6. Keep SKILL.md lean (<150 lines) — depth belongs in the bundled files
7. Validate: `pkg-skills validate <skill dir>` — zero errors required

**Output:** enriched skill in place (the canonical `~/.agents/skills` copy, so
every symlinked agent dir sees it).

**Next Step:** nothing — the timer keeps raw artifacts fresh; re-run this only
after major upstream releases.
