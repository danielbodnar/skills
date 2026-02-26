// Effect-TS Installation and Setup

// Install Effect with Bun (preferred)
// bun add effect

// Install platform packages for specific runtimes
// bun add @effect/platform @effect/platform-bun
// bun add @effect/platform-node  # For Node.js
// bun add @effect/cli @effect/sql @effect/rpc  # Additional packages

// TypeScript configuration (tsconfig.json)
/*
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
*/

// Basic Effect import and usage
import { Effect } from "effect"

// Simple Effect program
const helloWorld = Effect.gen(function* () {
  yield* Effect.log("Starting Effect program")
  const result = yield* Effect.succeed("Hello, Effect!")
  yield* Effect.log(`Result: ${result}`)
  return result
})

// Execute the Effect
Effect.runPromise(helloWorld).then(console.log)

// Bun-specific execution
import { BunRuntime } from "@effect/platform-bun"

const program = Effect.gen(function* () {
  yield* Effect.log("Running with BunRuntime")
  return "Success!"
})

BunRuntime.runMain(program)

export { helloWorld, program }