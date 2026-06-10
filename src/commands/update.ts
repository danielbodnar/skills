import { Effect } from "effect"
import { readMarketplace } from "#lib/marketplace.ts"
import { formatSource, isLocalSource, isPinned } from "#lib/schema.ts"

interface UpdateOptions {
  target?: string
  verbose?: boolean
  quiet?: boolean
}

export const updateCommand = (options: UpdateOptions): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    const marketplace = yield* readMarketplace()

    const plugins = options.target
      ? marketplace.plugins.filter((p) => p.name === options.target)
      : marketplace.plugins

    if (options.target && plugins.length === 0) {
      return yield* Effect.fail(new Error(`No plugin named "${options.target}" in marketplace.json`))
    }

    const local = plugins.filter((p) => isLocalSource(p.source))
    const pinned = plugins.filter((p) => !isLocalSource(p.source) && isPinned(p.source))
    const tracking = plugins.filter((p) => !isLocalSource(p.source) && !isPinned(p.source))

    if (!options.quiet) {
      console.log("")
      if (tracking.length > 0) {
        console.log(`Tracking upstream (auto-update on install/update — nothing to do):`)
        for (const p of tracking) {
          console.log(`  ${p.name.padEnd(24)} ${formatSource(p.source)}`)
        }
        console.log("")
      }
      if (pinned.length > 0) {
        console.log(`Pinned (edit ref/sha/version in marketplace.json to bump):`)
        for (const p of pinned) {
          console.log(`  ${p.name.padEnd(24)} ${formatSource(p.source)}`)
        }
        console.log("")
      }
      if (local.length > 0 && options.verbose) {
        console.log(`Local (versioned with this repo):`)
        for (const p of local) {
          console.log(`  ${p.name.padEnd(24)} ${formatSource(p.source)}`)
        }
        console.log("")
      }
      console.log(
        `${tracking.length} tracking upstream, ${pinned.length} pinned, ${local.length} local.\n`
      )
    }
  })
