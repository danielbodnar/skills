# Template Variables

This directory is the executable blueprint for every generated package skill.
Files here are REAL output files, not `.tmpl` sources. Two interpreters render
them identically:

- `/pkg-skills-scaffold <pkg>` — Claude Code slash command (agent in the loop)
- `src/lib/render.ts` — deterministic resolver (systemd/alpm automation)

## Substitution: `${VAR}`

| Variable | Meaning | Example |
|----------|---------|---------|
| `${SKILL_NAME}` | Sanitized skill name (`pkg-` prefix, reserved words stripped) | `pkg-fd` |
| `${PKG_NAME}` | Package name as the manager reports it | `fd` |
| `${PKG_BIN}` | Binary name (last path segment of `PKG_NAME`) | `fd` |
| `${PKG_VERSION}` | Installed version at generation time | `10.2.0` |
| `${PKG_HOMEPAGE}` | Homepage URL from the manager metadata | `https://github.com/sharkdp/fd` |
| `${PKG_REPO}` | Derived GitHub repo URL ("" when not on GitHub) | `https://github.com/sharkdp/fd` |
| `${MANAGER}` | Package manager that owns the install | `pacman` |
| `${DESCRIPTION}` | One-line description from the manager | `Simple, fast alternative to find` |
| `${GENERATED_AT}` | ISO timestamp of this generation run | `2026-06-12T01:00:00Z` |

Unknown variables render as empty strings — placeholders never leak.

## Inclusion: `@relative/path`

A line containing only `@file` is replaced by that file's content from the
package's fetch cache (`$XDG_CACHE_HOME/pkg-skills/<manager>__<name>/`):

| Reference | Cache artifact |
|-----------|----------------|
| `@cli-help.txt` | `<bin> --help` output |
| `@man.txt` | rendered man page |
| `@tldr.md` | tldr page |
| `@readme.md` | GitHub README |
| `@releases.md` | last 10 GitHub releases |
| `@changelog.md` | upstream CHANGELOG |
| `@links.md` | derived homepage/repo/issues/releases links |

Missing artifacts render as `_(not available: <file>)_` so skills degrade
gracefully for packages without man pages or GitHub repos.

## Generator-owned files

`meta.json` (the machine-readable index with provenance + freshness) is written
by the generator after rendering — do not add it here.
