# Plan: Convert vendored submodules → pure Claude marketplace (resolved)

## Context

This repo is a Claude Code marketplace, but carried 17 git submodules (~220 MB):
3 real third-party plugins under `external_plugins/`, 13 reference-only source
trees under `vendors/`, and a nested copy of `anthropics/claude-plugins-official`.
Submodules are eliminated and the repo reshaped like the official marketplace —
plugins referenced via `marketplace.json`, zero `.gitmodules`.

## Resolved decisions

1. **Cherry-picks: mirror Anthropic's entries.** The official marketplace
   already lists `superpowers`, `huggingface-skills`, and `sentry` as remote
   `url` git sources pointing at the same upstreams we vendored. Adopt
   Anthropic's entry JSON (name, description, source shape) verbatim —
   including renaming our `sentry-skills` → `sentry`.
2. **Pinning: unpinned (latest).** No `ref`/`sha`/`version` fields → commit SHA
   becomes the version key, auto-update on upstream push.
3. **bodnar-sh/configs: fold everything skills-relevant.** `oxlint/base.ts`,
   `oxfmt/{base,presets}.ts` → `configs/`; `git-hooks/*.sh` → `configs/git-hooks/`.

## Phase 1 — Third-party plugins → remote sources

Replace the 3 `./external_plugins/*` source paths in
`.claude-plugin/marketplace.json` with Anthropic's verbatim `url` source objects:

- `superpowers` → `{"source":"url","url":"https://github.com/obra/superpowers.git"}`
- `huggingface-skills` → `{"source":"url","url":"https://github.com/huggingface/skills.git"}`
- `sentry` → `{"source":"url","url":"https://github.com/getsentry/sentry-for-claude.git"}`

## Phase 2 — De-vendor reference trees (mise tools)

| Vendored dir | Disposition |
|---|---|
| `linters-formatters/oxc` | pointer → skill `oxc-project/oxc@migrate-oxlint`; covered by `plugins/code-quality` |
| `linters-formatters/biome` | pointer → skill `paulrberg/agent-skills@biome-js`; covered by `plugins/code-quality` |
| `linters-formatters/bodnar-sh-configs` | fold `oxlint`/`oxfmt` configs into `configs/`, git hooks into `configs/git-hooks/`; then pointer |
| `mise/mise` | pointer → skill `terrylica/cc-skills@mise-tasks`; covered by `plugins/project-scaffold` |
| `just/just` | new `plugins/project-scaffold/skills/just/SKILL.md` |
| `devcontainers/{features,templates}` | pointer → skill `trailofbits/skills@devcontainer-setup` + upstream registries |
| `editor-configs/{kickstart-nvim,lazyvim,zed-extensions}` | reference pointers only |
| `mcp-servers/{awesome-mcp-servers,mcp-servers,cloudflare-mcp-servers}` | reference pointers only |
| `claude-ecosystem/claude-plugins-official` | removed; cherry-picked in Phase 3 |

- `references/dev-tools.md`: one row per tool — upstream URL, mise install,
  community-skill link.
- `.mise.toml` lists the tools so versions are mise-managed.

## Phase 3 — Cherry-pick Anthropic plugins

Add via `git-subdir` (metadata copied verbatim from the official entry; only
`source` rewritten to `url: anthropics/claude-plugins-official.git`,
`path: plugins/<name>`):

`hookify`, `security-guidance`, `plugin-dev`, `skill-creator`,
`typescript-lsp`, `rust-analyzer-lsp`, `gopls-lsp`

Plus `references/related-marketplaces.md` pointing to official + community.

## Phase 4 — CLI + tooling rewrite

| File | Change |
|---|---|
| `src/lib/submodules.ts` | DELETE |
| `src/lib/schema.ts` | `source` union: relative path \| `github` \| `url` \| `git-subdir` \| `npm` |
| `src/lib/marketplace.ts` | helpers for remote-source entries |
| `src/commands/add.ts` | writes marketplace entry instead of `git submodule add` |
| `src/commands/update.ts` | bumps pinned refs; unpinned auto-update |
| `src/commands/validate.ts` + `scripts/validate-marketplace.nu` | drop submodule check; validate paths + remote fields |
| `src/commands/{list,search,catalog}.ts` | handle remote entries |
| `justfile` | drop submodule recipes |
| `.gitmodules` | DELETE |
| `.claude/CLAUDE.md`, `README.md`, `CHANGELOG.md` | rewrite plugin/vendor docs |

## Phase 5 — Submodule removal & verification

```
git submodule deinit --all -f
git rm -r external_plugins vendors
rm -rf .git/modules
```

Verification: `just validate/list/catalog/typecheck/lint/build/test` green;
`git submodule status` empty; smoke-test install of `superpowers` + `hookify`.
