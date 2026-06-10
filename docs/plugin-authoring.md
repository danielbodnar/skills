# Plugin Authoring

## First-party plugins

First-party plugins live in `plugins/<name>/` and are referenced by relative
path. Scaffold one:

```sh
just new-plugin my-plugin
```

Structure:

```
plugins/my-plugin/
├── .claude-plugin/plugin.json   # manifest (required)
├── skills/<skill>/SKILL.md      # skills
├── commands/<cmd>.md            # slash commands
├── agents/                      # agent definitions (optional)
└── hooks/                       # hook scripts (optional)
```

Minimal `plugin.json`:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "What it does.",
  "author": { "name": "Daniel Bodnar", "email": "daniel.bodnar@gmail.com" },
  "keywords": ["topic"]
}
```

Then register it in `.claude-plugin/marketplace.json`:

```json
{
  "name": "my-plugin",
  "description": "What it does.",
  "source": "./plugins/my-plugin",
  "category": "development"
}
```

Run `just validate` — it confirms the path resolves and the manifest exists.

## External plugins

External plugins are catalog entries only; nothing is vendored. Register via
the CLI:

```sh
skills add org/repo                                      # whole repo is the plugin
skills add org/monorepo@plugins/thing                    # plugin in a subdirectory
```

Or hand-edit `marketplace.json`. When re-exposing a plugin from another
marketplace (as done for the Anthropic cherry-picks), copy the upstream entry's
metadata verbatim and rewrite only the `source` — this keeps descriptions and
LSP/MCP config identical to upstream.

Entries may carry the full set of optional fields: `version`, `author`,
`category`, `homepage`, `strict`, `lspServers`, `mcpServers`.

## Versioning and pinning

Claude Code resolves a plugin's version from, in order: `plugin.json` `version`
→ marketplace entry `version` → the git commit SHA of the source.

- **Unpinned (this repo's default):** omit `ref`/`sha`/`version` on remote
  entries. The commit SHA becomes the cache key, so every upstream push is an
  available update. Best for actively developed plugins.
- **Pinned:** add `"ref": "v1.2.3"` (branch/tag) or `"sha": "<commit>"` to the
  source object. When both are set, `sha` wins. Users only get updates when you
  bump the pin.

Avoid setting an explicit `version` on entries you want to track upstream —
a stale version string suppresses updates even when new commits exist.

## Edge cases

- **Duplicate names:** `skills add` and `skills validate` both reject an entry
  whose name already exists in the catalog.
- **Plugin not at repo root:** if the upstream repo keeps the plugin in a
  subdirectory (no `.claude-plugin/plugin.json` at root), you must use
  `git-subdir`, not `github`/`url`.
- **URL-based marketplaces:** if this catalog is ever served from a raw URL
  (not git), relative-path sources stop working — Claude Code only downloads
  `marketplace.json` in that mode. Keep first-party plugins working by always
  registering the marketplace as a git/GitHub source.
