import { Effect } from "effect"
import { readMarketplace } from "#lib/marketplace.ts"
import { isLocalSource, formatSource } from "#lib/schema.ts"
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

    const seen = new Set<string>()
    for (const plugin of marketplace.plugins) {
      if (seen.has(plugin.name)) {
        console.log(`  [err]  ${plugin.name}: duplicate plugin name`)
        errors++
        continue
      }
      seen.add(plugin.name)

      if (isLocalSource(plugin.source)) {
        if (!plugin.source.startsWith("./")) {
          console.log(`  [err]  ${plugin.name}: local source must start with ./ (${plugin.source})`)
          errors++
          continue
        }
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
          continue
        }
        ok++
        if (options.verbose) {
          console.log(`  [ok]   ${plugin.name}: local (${plugin.source})`)
        }
      } else {
        // Remote sources: the schema decode already enforced required fields
        // per source type; sanity-check URL shape for git-backed sources.
        const url = "url" in plugin.source ? plugin.source.url : undefined
        if (url !== undefined && !url.startsWith("https://") && !url.startsWith("git@")) {
          console.log(`  [err]  ${plugin.name}: suspicious git URL (${url})`)
          errors++
          continue
        }
        ok++
        if (options.verbose) {
          console.log(`  [ok]   ${plugin.name}: remote (${formatSource(plugin.source)})`)
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
