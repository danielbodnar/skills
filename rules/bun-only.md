# Rule: Bun Only

**Bun is the sole JavaScript/TypeScript runtime, package manager, bundler, and test runner.**

## Rejected Commands

- `npm`, `npx`
- `yarn`, `pnpm`
- `node` (as runtime)
- `ts-node`, `tsx`
- `tsc` (as compiler — use `bunx tsc` for type checking only)

## Correct Usage

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Add package | `bun add <pkg>@latest` |
| Add dev dep | `bun i -D <pkg>` |
| Run script | `bun run <script>` |
| Run file | `bun run <file>.ts` |
| One-off binary | `bunx <pkg>@latest <args>` |
| Test | `bun test` |
| Build | `bun build` |
| Package info | `bun info <pkg>` |

## Lock File

Only `bun.lock` is permitted. Delete `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` if found.
