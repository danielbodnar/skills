import { Effect } from "effect"
import { updateSubmodules } from "#lib/submodules.ts"

interface UpdateOptions {
  target?: string
  verbose?: boolean
  quiet?: boolean
}

const TARGETS = ["vendors", "plugins", "all"] as const

export const updateCommand = (options: UpdateOptions): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    const target = options.target ?? "all"

    if (options.target && !TARGETS.includes(target as (typeof TARGETS)[number])) {
      return yield* Effect.fail(
        new Error(`Unknown target: "${target}"\nValid targets: ${TARGETS.join(", ")}`)
      )
    }

    const path =
      target === "vendors" ? "vendors/" :
      target === "plugins" ? "external_plugins/" :
      undefined

    if (!options.quiet) {
      console.log(`\nUpdating ${target} submodules...`)
    }

    const output = yield* updateSubmodules(path)

    if (options.verbose && output) {
      console.log(output)
    }

    if (!options.quiet) {
      console.log(`Update complete.\n`)
    }
  })
