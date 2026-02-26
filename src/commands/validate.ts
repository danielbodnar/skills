import { Effect } from "effect"
import { readMarketplace } from "#lib/marketplace.ts"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

interface ValidateOptions {
  verbose?: boolean
}

const ROOT = process.cwd()

export const validateCommand = (options: ValidateOptions): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    let errors = 0
    let warnings = 0
    let ok = 0

    console.log("\nValidating marketplace...\n")

    const marketplace = yield* readMarketplace()
    ok++
    if (options.verbose) {
      console.log(`  [ok]   marketplace.json schema valid`)
      console.log(`         Name: ${marketplace.name}`)
      console.log(`         Version: ${marketplace.metadata.version}`)
      console.log(`         Plugins: ${marketplace.plugins.length}`)
    } else {
      console.log(`  [ok]   marketplace.json (${marketplace.plugins.length} plugins)`)
    }

    for (const plugin of marketplace.plugins) {
      const sourcePath = resolve(ROOT, plugin.source)
      if (!existsSync(sourcePath)) {
        console.log(`  [err]  ${plugin.name}: source not found (${plugin.source})`)
        errors++
        continue
      }

      const manifestPath = resolve(sourcePath, ".claude-plugin/plugin.json")
      if (!existsSync(manifestPath)) {
        console.log(`  [warn] ${plugin.name}: no plugin.json manifest`)
        warnings++
      } else {
        ok++
        if (options.verbose) {
          console.log(`  [ok]   ${plugin.name}: valid (${plugin.source})`)
        }
      }
    }

    console.log("")
    console.log(`Results: ${ok} ok, ${warnings} warning(s), ${errors} error(s)`)
    console.log("")

    if (errors > 0) {
      return yield* Effect.fail(new Error(`Validation failed with ${errors} error(s)`))
    }
  })
