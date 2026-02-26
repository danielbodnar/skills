import { Effect, Schema } from "effect"
import { MarketplaceSchema, type Marketplace, type PluginEntry } from "./schema.ts"
import { resolve } from "node:path"

const findMarketplacePath = (): string => {
  const fromCwd = resolve(process.cwd(), ".claude-plugin/marketplace.json")
  if (Bun.file(fromCwd).size > 0) return fromCwd
  return resolve(import.meta.dir, "../../.claude-plugin/marketplace.json")
}

const MARKETPLACE_PATH = findMarketplacePath()

export const readMarketplace = (): Effect.Effect<Marketplace, Error> =>
  Effect.gen(function* () {
    const file = Bun.file(MARKETPLACE_PATH)
    const exists = yield* Effect.tryPromise({
      try: () => file.exists(),
      catch: () => new Error("Failed to check marketplace.json"),
    })
    if (!exists) {
      return yield* Effect.fail(new Error(`marketplace.json not found at ${MARKETPLACE_PATH}`))
    }
    const raw = yield* Effect.tryPromise({
      try: () => file.json(),
      catch: () => new Error("Failed to parse marketplace.json"),
    })
    return yield* Schema.decodeUnknown(MarketplaceSchema)(raw).pipe(
      Effect.mapError(() => new Error("Invalid marketplace.json schema"))
    )
  })

export const writeMarketplace = (marketplace: Marketplace): Effect.Effect<void, Error> =>
  Effect.tryPromise({
    try: () => Bun.write(MARKETPLACE_PATH, JSON.stringify(marketplace, null, 2) + "\n"),
    catch: () => new Error("Failed to write marketplace.json"),
  }).pipe(Effect.asVoid)

export const addPlugin = (entry: PluginEntry): Effect.Effect<void, Error> =>
  Effect.gen(function* () {
    const marketplace = yield* readMarketplace()
    const exists = marketplace.plugins.some((p) => p.name === entry.name)
    if (exists) {
      return yield* Effect.fail(new Error(`Plugin "${entry.name}" already exists`))
    }
    const updated: Marketplace = {
      ...marketplace,
      plugins: [...marketplace.plugins, entry],
    }
    yield* writeMarketplace(updated)
  })
