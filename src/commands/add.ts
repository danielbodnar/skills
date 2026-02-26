import { Effect } from "effect"
import { addPlugin } from "#lib/marketplace.ts"
import { addSubmodule } from "#lib/submodules.ts"

interface AddOptions {
  source?: string
  verbose?: boolean
  dryRun?: boolean
}

const parseSource = (source: string): { org: string; repo: string; path?: string } => {
  const [orgRepo, path] = source.split("@")
  const [org, repo] = orgRepo.split("/")
  return { org, repo, path }
}

export const addCommand = (options: AddOptions): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    if (!options.source) {
      return yield* Effect.fail(
        new Error("Usage: skills add <org/repo[@path]>\n\nAdd an external plugin as a git submodule.\n\nExamples:\n  skills add obra/superpowers\n  skills add cloudflare/skills@agents-sdk")
      )
    }

    const { org, repo, path } = parseSource(options.source)
    if (!org || !repo) {
      return yield* Effect.fail(new Error(`Invalid source format: "${options.source}"\nExpected: org/repo or org/repo@path`))
    }

    const url = `https://github.com/${org}/${repo}.git`
    const name = path ?? repo
    const submodulePath = `external_plugins/${name}`

    if (options.dryRun) {
      console.log(`\nDry run — would add:`)
      console.log(`  Name:       ${name}`)
      console.log(`  Source:     ${url}`)
      console.log(`  Path:       ${submodulePath}`)
      console.log(`  Manifest:   .claude-plugin/marketplace.json\n`)
      return
    }

    if (options.verbose) {
      console.log(`\nAdding plugin "${name}"...`)
      console.log(`  URL:  ${url}`)
      console.log(`  Path: ${submodulePath}`)
    }

    yield* addSubmodule(url, submodulePath)
    if (options.verbose) console.log(`  Submodule cloned`)

    yield* addPlugin({
      name,
      description: `External plugin from ${org}/${repo}`,
      source: `./${submodulePath}`,
      category: "external",
    })
    if (options.verbose) console.log(`  Registered in marketplace.json`)

    console.log(`\nPlugin "${name}" added successfully.\n`)
  })
