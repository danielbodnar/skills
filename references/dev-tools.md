# Dev Tools Reference

Tools previously vendored as submodules under `vendors/`. They are dev tools —
install them via [mise](https://mise.jdx.dev/) (see `.mise.toml`), don't vendor
their source. Per tool: upstream, install method, and the skill that covers it.

Community skills install with `npx skills add <owner/repo@skill>` (or
`bunx skills add …`).

| Tool | Upstream | Install | Skill coverage |
|---|---|---|---|
| oxlint / oxc | [oxc-project/oxc](https://github.com/oxc-project/oxc) | `mise use oxlint` / `bun i -D oxlint` | first-party `code-quality` plugin; community `oxc-project/oxc@migrate-oxlint` |
| Biome | [biomejs/biome](https://github.com/biomejs/biome) | `mise use biome` / `bun i -D @biomejs/biome` | first-party `code-quality` plugin; community `paulrberg/agent-skills@biome-js` |
| mise | [jdx/mise](https://github.com/jdx/mise) | <https://mise.jdx.dev/getting-started.html> | first-party `project-scaffold` plugin (`mise-config` skill); community `terrylica/cc-skills@mise-tasks` |
| just | [casey/just](https://github.com/casey/just) | `mise use just` | first-party `project-scaffold` plugin (`justfile-patterns` skill) |
| Dev Containers (features) | [devcontainers/features](https://github.com/devcontainers/features) | referenced from `devcontainer.json` | first-party `project-scaffold` plugin (`devcontainer-config` skill); community `trailofbits/skills@devcontainer-setup` |
| Dev Containers (templates) | [devcontainers/templates](https://github.com/devcontainers/templates) | `devcontainer templates apply` | same as above |
| kickstart.nvim | [nvim-lua/kickstart.nvim](https://github.com/nvim-lua/kickstart.nvim) | clone per upstream README | reference only |
| LazyVim | [LazyVim/LazyVim](https://github.com/LazyVim/LazyVim) | <https://www.lazyvim.org/installation> | reference only |
| Zed extensions | [zed-industries/extensions](https://github.com/zed-industries/extensions) | in-editor extension manager | reference only |
| bodnar-sh/configs | [bodnar-sh/configs](https://github.com/bodnar-sh/configs) | `bun i -D @bodnar-sh/configs` | folded into `configs/linters/bodnar-sh/` and `configs/git-hooks/` |

## MCP server catalogs

Registries of MCP servers — browse upstream, don't vendor.

| Catalog | Upstream |
|---|---|
| Awesome MCP Servers | [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) |
| Reference MCP servers | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) |
| Cloudflare MCP servers | [cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare) |
