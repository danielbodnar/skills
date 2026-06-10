# Getting Started

## Use the marketplace

Register the marketplace in Claude Code, then install plugins from it:

```
/plugin marketplace add danielbodnar/skills
/plugin install superpowers@skills
```

Or from the shell:

```sh
claude plugin marketplace add danielbodnar/skills
claude plugin install hookify@skills
```

The marketplace name is `skills` (from `.claude-plugin/marketplace.json`), so
plugin specs take the form `<plugin>@skills`.

### What gets fetched

| Plugin kind | Source | Fetched from |
|---|---|---|
| First-party (`code-quality`, `project-scaffold`, `infra-ops`) | relative path | this repo |
| External (`superpowers`, `huggingface-skills`, `sentry`) | `url` git source | the upstream repo, latest commit |
| Anthropic cherry-picks (`hookify`, `plugin-dev`, LSPs, …) | `git-subdir` source | a subdirectory of `anthropics/claude-plugins-official`, cloned sparsely |

All remote entries are unpinned: Claude Code uses the upstream commit SHA as
the version key, so `/plugin update` pulls the latest upstream commit. See
[Plugin Authoring → Versioning](./plugin-authoring.md#versioning-and-pinning).

## Develop on this repo

Prerequisites: [Bun](https://bun.sh), [just](https://just.systems),
[Nushell](https://www.nushell.sh) (justfile recipes run under `nu`). Tool
versions are managed by [mise](https://mise.jdx.dev) — see `.mise.toml`.

```sh
git clone https://github.com/danielbodnar/skills.git
cd skills
just init        # bun install
just validate    # check marketplace.json and all plugin sources
just test        # bun test
just build       # compile the CLI to ./dist/skills
```

There are no git submodules — a plain clone is complete.

## Repo layout

```
.claude-plugin/marketplace.json   # the catalog — every plugin entry lives here
plugins/                          # first-party plugin sources
src/                              # skills CLI (Effect-TS + Bun)
scripts/                          # Nushell utilities (validate, catalog, sync)
configs/                          # shareable configs (linters, git hooks, mise, …)
references/  snippets/  rules/    # canonical content synced to ~/.claude/
docs/                             # this documentation
```
