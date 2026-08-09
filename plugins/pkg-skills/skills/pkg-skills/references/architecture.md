# pkg-skills architecture

## Contents

- [Data flow](#data-flow)
- [File layout](#file-layout)
- [packages.conf semantics](#packagesconf-semantics)
- [Template language](#template-language)
- [Design decisions](#design-decisions)

## Data flow

```
managers (pacman/cargo/bun/npm/pnpm/yarn/mise/go/pipx/deno/uv)
  └─ sync ──> packages.conf (opt-in list)
        └─ generate ──> fetch (help/man/tldr/GitHub → cache)
              └─ render templates/ (${VAR} + @ref)
                    └─ validate (fail closed) ──> skills add -g ──> ~/.agents/skills
                                                        └─ symlinks → ~/.claude/skills etc.
```

## File layout

| Path | Role |
|------|------|
| `$XDG_CONFIG_HOME/pkg-skills/config.toml` | settings: `enrich`, `github`, `prefix`, `skills_add_args`, `mirror_claude_dirs`, `output_dir` |
| `$XDG_CONFIG_HOME/pkg-skills/pkg-skills.conf` | env-file consumed by systemd `EnvironmentFile=` |
| `$XDG_CONFIG_HOME/pkg-skills/packages.conf` | opt-in list (see below) |
| `$XDG_CACHE_HOME/pkg-skills/<manager>__<name>/` | fetched artifacts: cli-help.txt, man.txt, tldr.md, readme.md, releases.md, changelog.md, links.md |
| `$XDG_STATE_HOME/pkg-skills/state.json` | per-package generation hash (`--changed-only` diffing) |
| `$XDG_DATA_HOME/pkg-skills/generated/<skill>/` | staging dirs handed to `skills add` |

## packages.conf semantics

- `manager:name  @version` — opted in; a skill is generated and kept current
- `# manager:name  @version` — known but NOT opted in (default for new packages)
- `##` lines — header prose, never touched by the merger
- Re-sync refreshes versions and appends new packages commented-out; the user's
  comment/uncomment choices always win. Vanished packages are dropped unless
  opted in (kept visible so the user notices).

## Template language

`templates/` files are real output files. Two constructs only:

- `${VAR}` — substituted from the variable map (`pkg-skills meta <pkg>` prints it)
- `@relative/path` on its own line — replaced by that cache artifact's content;
  missing artifacts render `_(not available: …)_`

Full legend: `templates/VARIABLES.md`. The TS resolver (`src/lib/render.ts`) and
the `/pkg-skills-scaffold` command implement identical semantics.

## Design decisions

- **Explicit installs only** (`pacman -Qqe`, not `-Qq`): dependency packages
  (libraries) make poor skills; tools the user chose make great ones.
- **Fail-closed validation**: the autonomous path never installs a skill that
  violates the Anthropic checklist (naming, description, body length, ref depth).
- **Names sanitized**: `pkg-` prefix; reserved words ("claude", "anthropic")
  stripped; ≤64 chars; lowercase/digits/hyphens.
- **Snapshot framing**: versions/changelogs are stamped `generatedAt` in
  meta.json rather than asserted as eternal truth; `scripts/sync.sh` refreshes.
- **Enrichment is opt-in** (`enrich = "headless"` in config.toml): the default
  pipeline costs zero tokens.
