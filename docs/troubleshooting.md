# Troubleshooting

## `skills validate` fails with "source not found"

A local entry's path doesn't resolve. Local sources must start with `./` and
point at a directory containing `.claude-plugin/plugin.json`. Run from the repo
root — paths resolve relative to the current working directory.

## "Plugin "x" already exists" from `skills add`

The catalog already has an entry with that name. Pick another with
`--name <other>`, or edit the existing entry in
`.claude-plugin/marketplace.json`.

## Installed plugin doesn't update after upstream pushed

Check `skills update` — if the entry is **pinned** (`ref`/`sha` on the source,
or a `version` field), Claude Code keeps the cached copy until the pin is
bumped. Remove the pin or bump it, then `/plugin update <name>@skills`.

## "path not found" when installing from this marketplace

You likely added the marketplace by raw URL. URL-based marketplaces download
only `marketplace.json`, so relative-path sources (the first-party plugins)
can't resolve. Re-add it as a git source:

```sh
claude plugin marketplace remove skills
claude plugin marketplace add danielbodnar/skills
```

## `claude plugin marketplace add` hangs in a script

Adding a marketplace whose name already exists triggers an interactive
overwrite prompt. In scripts, `remove` first, then `add`.

## Install fails for a `git-subdir` plugin

The `path` must match the subdirectory in the upstream repo exactly (e.g.
`plugins/hookify` in `anthropics/claude-plugins-official`). Verify the
directory exists upstream at the default branch, and that it contains
`.claude-plugin/plugin.json`.

## `just` recipes fail with shell syntax errors

The justfile sets `set shell := ["nu", "-c"]` — recipe bodies are Nushell, not
bash. Install Nushell or run the underlying commands directly
(`bun run src/index.ts …`).

## `bun test` finds no tests / type errors after editing the schema

Tests live next to sources (`src/**/*.test.ts`). After changing
`src/lib/schema.ts`, run `bunx tsc --noEmit` — the decoded `Marketplace` type
is deeply `readonly`, so helpers must accept `readonly PluginEntry[]`. Note the
schema strips unknown keys on decode: a new field used in `marketplace.json`
must be added to `PluginEntrySchema`, or `skills add`'s read→write round-trip
will silently drop it from existing entries.
