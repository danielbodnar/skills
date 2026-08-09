# Anatomy of a generated package skill

What every `pkg-<name>/` skill contains and the style enrichment must preserve.

## Contents

- [File inventory](#file-inventory)
- [Style contract](#style-contract)
- [meta.json schema](#metajson-schema)

## File inventory

| File | Content | Loaded |
|------|---------|--------|
| `SKILL.md` | lean overview: TOC, mermaid usage map, links | on trigger |
| `cheatsheet.md` | task → command table (tldr-derived) | on demand |
| `commands.md` | spec blocks with `$ARGUMENTS` placeholders + raw `--help` | on demand |
| `references/reference.md` | curated: quick ref, links, install, README, releases | on demand |
| `references/cli-help.txt` | raw `--help` capture | on demand |
| `references/man.txt` | rendered man page | on demand |
| `references/changelog.md` | upstream changelog snapshot | on demand |
| `references/links.md` | homepage/repo/issues/releases | on demand |
| `examples/basic-usage.md` | runnable, `$ARGUMENTS`/`@FILENAME`-parameterized | on demand |
| `snippets/<category>/` | copy-paste scripts | never (copied) |
| `scripts/sync.sh` | refresh fetch cache + regenerate (execute, do not read) | never (executed) |
| `meta.json` | machine-readable index with provenance + freshness | tooling only |

## Style contract

Enrichment (manual or `/pkg-skills-enrich`) must keep:

1. **Spec blocks** for commands: `**Command:**` (with `$ARGUMENTS`) ·
   `**Purpose:**` · `**Process:**` (numbered) · `**Output:**` · `**Next Step:**`
2. **TOC first** in SKILL.md and any file >100 lines (`## Contents`)
3. **One-level refs** — every bundled file links directly from SKILL.md;
   reference files never link to other reference files
4. **Third-person description**, key use case first, ≤1024 chars, no XML tags
5. **Snapshot framing** — "v X at generation time", never "the latest version is"
6. **Lean SKILL.md** (<150 lines preferred, <500 hard cap) — depth lives in
   the bundled files
7. Validate after editing: `pkg-skills validate <skill-dir>` must report zero errors

## meta.json schema

```json
{
  "skill": "pkg-ripgrep",
  "package": "pacman:ripgrep",
  "manager": "pacman",
  "version": "15.1.0-3",
  "generator": "pkg-skills",
  "generatedAt": "2026-06-12T02:30:48Z",
  "hash": "329f76f5d2bdbaf6",
  "sources": [
    { "kind": "cli-help", "provenance": "fetched", "path": "…/cli-help.txt", "fetchedAt": "…" }
  ]
}
```

`provenance` ∈ stated · inferred · assumed · fetched; `fetchedAt` is the
freshness field — stale sources are the signal to run `scripts/sync.sh`.
