// Effect Creation Patterns

import { Effect, Data } from "effect"

// 1. Success Effect - Always succeeds with a value
const successEffect = Effect.succeed(42)
const successString = Effect.succeed("Hello World")
const successObject = Effect.succeed({ id: 1, name: "John" })

// 2. Failure Effect - Always fails with an error
const failureEffect = Effect.fail("Something went wrong")
const failureWithError = Effect.fail(new Error("Network error"))

// 3. Die Effect - Unrecoverable defect (like throwing an exception)
const defectEffect = Effect.die("Unrecoverable error")

// 4. Synchronous Effect - Wraps synchronous computation
const syncEffect = Effect.sync(() => {
  console.log("Performing sync computation")
  return Math.random()
})

// 5. Try Effect - Safe synchronous computation that might throw
const tryEffect = Effect.try({
  try: () => {
    const result = JSON.parse('{"name": "John"}')
    return result
  },
  catch: (error) => new Error(`Parse error: ${error}`)
})

// 6. Promise Effect - Convert Promise to Effect
const promiseEffect = Effect.promise(() => 
  fetch("https://api.example.com/data").then(res => res.json())
)

// 7. Try Promise - Safe Promise conversion with error handling
const tryPromiseEffect = Effect.tryPromise({
  try: () => fetch("https://api.example.com/data").then(res => res.json()),
  catch: (error) => new Error(`Fetch failed: ${error}`)
})

// 8. Async Effect - Manual control over async operations
const asyncEffect = Effect.async<string, Error>((resume) => {
  setTimeout(() => {
    const success = Math.random() > 0.5
    if (success) {
      resume(Effect.succeed("Async operation completed"))
    } else {
      resume(Effect.fail(new Error("Async operation failed")))
    }
  }, 1000)
})

// 9. Generator-based Effect composition
const generatorEffect = Effect.gen(function* () {
  const value1 = yield* Effect.succeed(10)
  const value2 = yield* Effect.succeed(20)
  const result = value1 + value2
  yield* Effect.log(`Computed result: ${result}`)
  return result
})

// 10. Conditional Effects
const conditionalEffect = (shouldSucceed: boolean) =>
  shouldSucceed 
    ? Effect.succeed("Operation succeeded")
    : Effect.fail("Operation failed")

// 11. Effect with custom error types
class CustomError extends Data.TaggedError("CustomError")<{
  readonly message: string
  readonly code: number
}> {}

const customErrorEffect = Effect.fail(
  new CustomError({ message: "Custom error occurred", code: 500 })
)

// 12. Delayed Effect
const delayedEffect = Effect.succeed("Delayed result").pipe(
  Effect.delay("2 seconds")
)

// Example usage
const exampleProgram = Effect.gen(function* () {
  const syncResult = yield* syncEffect
  const tryResult = yield* tryEffect
  const generatorResult = yield* generatorEffect
  
  yield* Effect.log(`Sync: ${syncResult}`)
  yield* Effect.log(`Try: ${JSON.stringify(tryResult)}`)
  yield* Effect.log(`Generator: ${generatorResult}`)
  
  return { syncResult, tryResult, generatorResult }
})

export {
  successEffect,
  failureEffect,
  defectEffect,
  syncEffect,
  tryEffect,
  promiseEffect,
  tryPromiseEffect,
  asyncEffect,
  generatorEffect,
  conditionalEffect,
  customErrorEffect,
  delayedEffect,
  exampleProgram
}