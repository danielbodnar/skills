import { Effect } from "effect"
import { readMarketplace } from "#lib/marketplace.ts"
import { formatSource, type PluginEntry } from "#lib/schema.ts"

interface ListOptions {
  glob?: string
  json?: boolean
  verbose?: boolean
}

const matchGlob = (name: string, pattern: string): boolean => {
  const regex = new RegExp(
    "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
  )
  return regex.test(name)
}

const formatTable = (plugins: readonly PluginEntry[], verbose: boolean): void => {
  if (plugins.length === 0) {
    console.log("No plugins found.")
    return
  }

  console.log("")
  if (verbose) {
    console.log(`${"Name".padEnd(24)} ${"Category".padEnd(16)} ${"Source".padEnd(32)} Description`)
    console.log(`${"─".repeat(24)} ${"─".repeat(16)} ${"─".repeat(32)} ${"─".repeat(40)}`)
    for (const p of plugins) {
      console.log(`${p.name.padEnd(24)} ${(p.category ?? "general").padEnd(16)} ${formatSource(p.source).padEnd(32)} ${p.description}`)
    }
  } else {
    console.log(`${"Name".padEnd(24)} ${"Category".padEnd(16)} Description`)
    console.log(`${"─".repeat(24)} ${"─".repeat(16)} ${"─".repeat(50)}`)
    for (const p of plugins) {
      console.log(`${p.name.padEnd(24)} ${(p.category ?? "general").padEnd(16)} ${p.description}`)
    }
  }
  console.log(`\n${plugins.length} plugin(s)\n`)
}

export const listCommand = (options: ListOptions): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    const marketplace = yield* readMarketplace()
    let plugins = marketplace.plugins

    if (options.glob) {
      plugins = plugins.filter((p) => matchGlob(p.name, options.glob!))
    }

    if (options.json) {
      console.log(JSON.stringify(plugins, null, 2))
    } else {
      formatTable(plugins, options.verbose ?? false)
    }
  })
