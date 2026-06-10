import { Effect } from "effect"
import { addPlugin } from "#lib/marketplace.ts"
import type { PluginEntry, RemoteSource } from "#lib/schema.ts"

interface AddOptions {
  source?: string
  name?: string
  description?: string
  category?: string
  verbose?: boolean
  dryRun?: boolean
}

const USAGE = `Usage: skills add <org/repo[@path]> [--name <name>] [--description <text>] [--category <category>]

Register a plugin in marketplace.json with a remote git source.
No files are vendored — Claude Code fetches the plugin on install.

Examples:
  skills add obra/superpowers
  skills add anthropics/claude-plugins-official@plugins/hookify`

const parseSource = (source: string): { org: string; repo: string; path?: string } => {
  const [orgRepo, path] = source.split("@")
  const [org, repo] = orgRepo.split("/")
  return { org, repo, path }
}

export const addCommand = (options: AddOptions): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    if (!options.source) {
      return yield* Effect.fail(new Error(USAGE))
    }

    const { org, repo, path } = parseSource(options.source)
    if (!org || !repo) {
      return yield* Effect.fail(new Error(`Invalid source format: "${options.source}"\nExpected: org/repo or org/repo@path`))
    }

    const name = options.name ?? (path ? path.split("/").at(-1)! : repo)
    const source: RemoteSource = path
      ? { source: "git-subdir", url: `https://github.com/${org}/${repo}.git`, path }
      : { source: "github", repo: `${org}/${repo}` }

    const entry: PluginEntry = {
      name,
      description: options.description ?? `External plugin from ${org}/${repo}`,
      source,
      category: options.category ?? "external",
    }

    if (options.dryRun) {
      console.log(`\nDry run — would register:\n`)
      console.log(JSON.stringify(entry, null, 2))
      console.log("")
      return
    }

    yield* addPlugin(entry)
    if (options.verbose) {
      console.log(`\nRegistered:\n${JSON.stringify(entry, null, 2)}`)
    }

    console.log(`\nPlugin "${name}" registered in marketplace.json.\n`)
  })
