# CLI Reference

The `skills` CLI manages the marketplace catalog. Run it with
`bun run src/index.ts <command>`, via the just recipes, or as the compiled
binary (`just build` → `./dist/skills`).

```
skills <command> [options] [arguments]
```

Exit codes: `0` success, `1` command error (e.g. validation failure), `2`
unknown command.

## Global flags

| Flag | Effect |
|---|---|
| `-h`, `--help` | Show usage |
| `-V`, `--version` | Show version |
| `-v`, `--verbose` | Detailed output |
| `-q`, `--quiet` | Suppress non-error output |
| `--json` | JSON output (`list`, `search`) |
| `--dry-run` | Preview without applying (`add`, `sync`) |

## Commands

### `list [glob]`

List catalog entries, optionally filtered by a glob on the plugin name
(`*` and `?` wildcards).

```sh
skills list                    # all plugins
skills list "code-*"           # glob filter
skills list --verbose          # adds a Source column (remote sources shown as git:<url>[#path])
skills list --json | jq '.[].name'
```

### `search <query>`

Case-insensitive substring search across name, description, and category.

```sh
skills search linting
skills search lsp --json
```

### `add <org/repo[@path]>`

Register a plugin in `marketplace.json` with a remote git source. No files are
vendored — Claude Code fetches the plugin at install time.

| Spec | Resulting source |
|---|---|
| `org/repo` | `{ "source": "github", "repo": "org/repo" }` |
| `org/repo@plugins/foo` | `{ "source": "git-subdir", "url": "https://github.com/org/repo.git", "path": "plugins/foo" }` |

Options: `--name <name>` (defaults to the repo or path basename),
`--description <text>`, `--category <category>` (default `external`),
`--dry-run` to preview the JSON entry without writing.

```sh
skills add obra/superpowers
skills add anthropics/claude-plugins-official@plugins/hookify --category productivity
skills add org/repo --dry-run
```

Fails if a plugin with the same name already exists.

### `update [plugin]`

Report which entries track upstream (unpinned — they auto-update on
install/update, nothing to do locally) and which are pinned (bump `ref`/`sha`/
`version` in `marketplace.json` to update). Pass a plugin name to scope the
report; `--verbose` also lists local entries.

```sh
skills update
skills update superpowers
```

### `validate`

Validate the catalog. Checks, in order:

1. `marketplace.json` parses and matches the schema (`src/lib/schema.ts`)
2. No duplicate plugin names
3. Local sources start with `./`, exist on disk, and contain
   `.claude-plugin/plugin.json` (missing manifest is a warning)
4. Remote git sources use `https://` or `git@` URLs

Exits `1` if any errors were found. `scripts/validate-marketplace.nu` performs
the same checks in pure Nushell for environments without Bun.

### `catalog`

Generate `CATALOG.md` (plugins table plus references/snippets/configs
inventories). `--output <path>` overrides the destination.

### `sync`

Sync `references/` and `snippets/` to `~/.claude/`. Supports `--dry-run`.

## Source schema

A plugin `source` in `marketplace.json` is one of (see `src/lib/schema.ts`):

```jsonc
"./plugins/code-quality"                                              // local path
{ "source": "github",     "repo": "org/repo", "ref?": "", "sha?": "" }
{ "source": "url",        "url": "https://….git", "ref?": "", "sha?": "" }
{ "source": "git-subdir", "url": "https://….git", "path": "plugins/x", "ref?": "", "sha?": "" }
{ "source": "npm",        "package": "name", "version?": "", "registry?": "" }
```

This mirrors the source types Claude Code itself accepts, so anything that
passes `skills validate` is installable.
