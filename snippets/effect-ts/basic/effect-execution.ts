// Effect Execution Patterns

import { Effect, Exit } from "effect"

// Sample effects for demonstration
const successEffect = Effect.succeed(42)
const failureEffect = Effect.fail("Something went wrong")
const asyncEffect = Effect.promise(() => 
  new Promise(resolve => setTimeout(() => resolve("Async result"), 100))
)

// 1. Run as Promise - Most common execution method
const runAsPromise = async () => {
  try {
    const result = await Effect.runPromise(successEffect)
    console.log("Promise result:", result) // 42
  } catch (error) {
    console.error("Promise error:", error)
  }
}

// 2. Run Synchronously - Only for effects without async operations
const runSynchronously = () => {
  try {
    const result = Effect.runSync(successEffect)
    console.log("Sync result:", result) // 42
  } catch (error) {
    console.error("Sync error:", error)
  }
  
  // This would throw an error because asyncEffect is async
  // Effect.runSync(asyncEffect) // AsyncFiberException
}

// 3. Run with Exit - Captures both success and failure in Exit type
const runWithExit = async () => {
  const successExit = await Effect.runPromiseExit(successEffect)
  console.log("Success exit:", successExit)
  // { _id: "Exit", _tag: "Success", value: 42 }
  
  const failureExit = await Effect.runPromiseExit(failureEffect)
  console.log("Failure exit:", failureExit)
  // { _id: "Exit", _tag: "Failure", cause: { ... } }
}

// 4. Run in Background - Fork execution and get a Fiber
const runInBackground = () => {
  const longRunningEffect = Effect.gen(function* () {
    yield* Effect.log("Starting long task...")
    yield* Effect.sleep("2 seconds")
    yield* Effect.log("Long task completed")
    return "Task result"
  })
  
  const fiber = Effect.runFork(longRunningEffect)
  console.log("Task started in background, fiber:", fiber)
  
  // You can later join the fiber to get the result
  // const result = await fiber.await()
}

// 5. Run with Custom Runtime
import { BunRuntime } from "@effect/platform-bun"

const runWithBunRuntime = () => {
  const program = Effect.gen(function* () {
    yield* Effect.log("Running with BunRuntime")
    return "Bun result"
  })
  
  BunRuntime.runMain(program)
}

// 6. Handle Exit Results
const handleExitResults = async () => {
  const exit = await Effect.runPromiseExit(successEffect)
  
  if (Exit.isSuccess(exit)) {
    console.log("Success value:", exit.value)
  } else {
    console.log("Failure cause:", exit.cause)
  }
  
  // Pattern matching on Exit
  const result = Exit.match(exit, {
    onFailure: (cause) => `Failed: ${cause}`,
    onSuccess: (value) => `Success: ${value}`
  })
  console.log("Exit result:", result)
}

// 7. Run with Timeout
const runWithTimeout = async () => {
  const slowEffect = Effect.gen(function* () {
    yield* Effect.sleep("5 seconds")
    return "Slow result"
  })
  
  const timedEffect = slowEffect.pipe(
    Effect.timeout("2 seconds")
  )
  
  try {
    const result = await Effect.runPromise(timedEffect)
    console.log("Timed result:", result)
  } catch (error) {
    console.log("Timeout error:", error) // TimeoutException
  }
}

// 8. Run Multiple Effects
const runMultipleEffects = async () => {
  const effects = [
    Effect.succeed(1),
    Effect.succeed(2),
    Effect.succeed(3)
  ]
  
  const results = await Effect.runPromise(Effect.all(effects))
  console.log("Multiple results:", results) // [1, 2, 3]
}

// 9. Error Handling During Execution
const errorHandling = async () => {
  const unsafeEffect = Effect.gen(function* () {
    const random = Math.random()
    if (random > 0.5) {
      yield* Effect.fail("Random failure")
    }
    return "Success!"
  })
  
  // Method 1: Promise catch
  await Effect.runPromise(unsafeEffect).catch(error => {
    console.log("Caught error:", error)
  })
  
  // Method 2: Exit handling
  const exit = await Effect.runPromiseExit(unsafeEffect)
  if (Exit.isFailure(exit)) {
    console.log("Effect failed with cause:", exit.cause)
  }
}

// 10. Performance Monitoring
const performanceMonitoring = async () => {
  const timedEffect = Effect.gen(function* () {
    const start = Date.now()
    yield* Effect.sleep("100 millis")
    const end = Date.now()
    yield* Effect.log(`Effect took ${end - start}ms`)
    return "Performance test complete"
  })
  
  const result = await Effect.runPromise(timedEffect)
  console.log("Performance result:", result)
}

// Example of comprehensive execution
const comprehensiveExample = async () => {
  console.log("=== Effect Execution Examples ===")
  
  await runAsPromise()
  runSynchronously()
  await runWithExit()
  runInBackground()
  await handleExitResults()
  await runWithTimeout()
  await runMultipleEffects()
  await errorHandling()
  await performanceMonitoring()
}

export {
  runAsPromise,
  runSynchronously,
  runWithExit,
  runInBackground,
  runWithBunRuntime,
  handleExitResults,
  runWithTimeout,
  runMultipleEffects,
  errorHandling,
  performanceMonitoring,
  comprehensiveExample
}