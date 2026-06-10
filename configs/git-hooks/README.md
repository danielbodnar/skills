# @bodnar-sh/configs/git-hooks

Pure-bash git hooks that run secret/vuln scanners on commit and push.

## Install

```sh
bun run @bodnar-sh/configs/git-hooks/install
```

Or invoke `install.sh` directly from `node_modules/@bodnar-sh/configs/git-hooks/install.sh`.

## What runs

| Stage | Tools | Scope |
| --- | --- | --- |
| pre-commit | trufflehog, nyx-scanner | staged files only |
| pre-push | trufflehog (full history), socket, nyx-scanner | full repo + deps |

Each tool is best-effort: if the binary isn't on `PATH`, the hook prints a warning and continues. Install all three via the workspace's `mise.toml`:

```toml
[tools]
trufflehog                = "latest"
"cargo:nyx-scanner"       = "latest"
"npm:@socketsecurity/cli" = "latest"
```

## Bypass

Don't. If a real false positive comes up, fix the rule in the tool's config (or open an issue here), not `--no-verify`.
