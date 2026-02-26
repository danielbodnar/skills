# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-25

### Added

- Initial release of the Skills Marketplace
- CLI tool (`skills`) with subcommands: list, search, add, update, validate, catalog, sync
- First-party plugins: code-quality, project-scaffold, infra-ops
- External plugin submodules: superpowers, qodo-skills, huggingface-skills, sentry-skills, posthog, coderabbit, firecrawl, sonatype-guide
- Vendor reference submodules: MCP servers, editor configs, devcontainers, linters, mise, just, claude-plugins-official
- Shareable configurations: mise, linters, justfiles, devcontainers, GitHub workflows, editor settings
- Canonical references (65+ tool/framework docs)
- Canonical snippets (65+ code example directories)
- Rules: reject-python, use-nushell, prevent-chained-commands, no-react, bun-only, functional-only
- Styleguides: nushell, typescript, effect-ts, rust
- Standards: typescript-and-javascript-coding-standards, nushell-scripting-standards
- Nushell management scripts: validate-marketplace, generate-catalog, sync-references
- Marketplace manifest for Claude Code plugin discovery
