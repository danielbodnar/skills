import { Effect } from "effect"
import { readMarketplace } from "#lib/marketplace.ts"

interface SearchOptions {
  query?: string
  json?: boolean
}

export const searchCommand = (options: SearchOptions): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    if (!options.query) {
      return yield* Effect.fail(new Error("Usage: skills search <query>\n\nSearch plugins by name, description, or category."))
    }

    const marketplace = yield* readMarketplace()
    const query = options.query.toLowerCase()

    const matches = marketplace.plugins.filter((p) => {
      const searchable = [p.name, p.description, p.category ?? ""].join(" ").toLowerCase()
      return searchable.includes(query)
    })

    if (options.json) {
      console.log(JSON.stringify(matches, null, 2))
      return
    }

    if (matches.length === 0) {
      console.log(`\nNo plugins matching "${options.query}".\n`)
      return
    }

    console.log(`\nFound ${matches.length} plugin(s) matching "${options.query}":\n`)
    for (const p of matches) {
      console.log(`  ${p.name.padEnd(24)} ${p.description}`)
    }
    console.log("")
  })
