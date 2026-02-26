import { Effect } from "effect"
import { listCommand } from "#commands/list.ts"
import { validateCommand } from "#commands/validate.ts"
import { addCommand } from "#commands/add.ts"
import { updateCommand } from "#commands/update.ts"
import { catalogCommand } from "#commands/catalog.ts"
import { searchCommand } from "#commands/search.ts"
import { syncCommand } from "#commands/sync.ts"

const VERSION = "1.0.0"

const parseArgs = (argv: string[]): { command: string; args: string[]; flags: Record<string, string | boolean> } => {
  const flags: Record<string, string | boolean> = {}
  const positional: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith("-")) {
        flags[key] = next
        i++
      } else {
        flags[key] = true
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      const key = arg.slice(1)
      const next = argv[i + 1]
      if (next && !next.startsWith("-")) {
        flags[key] = next
        i++
      } else {
        flags[key] = true
      }
    } else {
      positional.push(arg)
    }
  }

  return {
    command: positional[0] ?? "",
    args: positional.slice(1),
    flags,
  }
}

const USAGE = `skills v${VERSION} — Claude Code marketplace CLI

Usage:
  skills <command> [options] [arguments]

Commands:
  list [glob]            List plugins, optionally filtered by glob pattern
  search <query>         Search plugins by name, description, or category
  add <source>           Add a plugin (e.g., org/repo or org/repo@path)
  update [target]        Update submodules (vendors, plugins, or all)
  validate               Validate marketplace manifest and plugin paths
  catalog                Generate CATALOG.md from all content
  sync                   Sync references and snippets to ~/.claude/

Options:
  -h, --help             Show this help message
  -v, --verbose          Show detailed output
  -q, --quiet            Suppress non-error output
  -V, --version          Show version number
  --json                 Output as JSON (where supported)
  --dry-run              Preview changes without applying them

Examples:
  skills list                     List all plugins
  skills list "code-*"            List plugins matching glob
  skills search "linting"         Search for linting-related plugins
  skills add obra/superpowers     Add an external plugin
  skills update vendors           Update vendor submodules only
  skills validate --verbose       Validate with detailed output
  skills sync --dry-run           Preview reference sync changes
`

const program = (): Effect.Effect<void, Error> => {
  const { command, args, flags } = parseArgs(process.argv.slice(2))

  if (flags.version || flags.V) {
    return Effect.sync(() => console.log(VERSION))
  }

  if (flags.help || flags.h) {
    return Effect.sync(() => console.log(USAGE))
  }

  const verbose = Boolean(flags.verbose || flags.v)
  const quiet = Boolean(flags.quiet || flags.q)
  const json = Boolean(flags.json)
  const dryRun = Boolean(flags["dry-run"])

  switch (command) {
    case "list":
      return listCommand({ glob: args[0], json, verbose })
    case "search":
      return searchCommand({ query: args[0], json })
    case "add":
      return addCommand({ source: args[0], verbose, dryRun })
    case "update":
      return updateCommand({ target: args[0], verbose, quiet })
    case "validate":
      return validateCommand({ verbose })
    case "catalog":
      return catalogCommand({ output: flags.output as string | undefined })
    case "sync":
      return syncCommand({ dryRun, verbose })
    case "help":
      return Effect.sync(() => console.log(USAGE))
    case "":
      return Effect.sync(() => console.log(USAGE))
    default:
      return Effect.sync(() => {
        console.error(`Unknown command: ${command}`)
        console.error(`Run 'skills --help' for usage information.`)
        process.exit(2)
      })
  }
}

Effect.runPromise(program()).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`error: ${message}`)
  process.exit(1)
})
