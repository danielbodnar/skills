// Fiber-based Concurrency Patterns

import { Effect, Fiber, Duration } from "effect"

// 1. Basic Fiber Creation and Joining
const basicFiberExample = Effect.gen(function* () {
  const task = Effect.gen(function* () {
    yield* Effect.log("Task starting")
    yield* Effect.sleep("1 second")
    yield* Effect.log("Task completed")
    return "Task result"
  })
  
  // Fork the task into a new fiber
  const fiber = yield* Effect.fork(task)
  yield* Effect.log("Task forked, continuing main execution")
  
  // Do other work while task runs
  yield* Effect.sleep("500 millis")
  yield* Effect.log("Main thread work done")
  
  // Wait for the fiber to complete
  const result = yield* Fiber.join(fiber)
  yield* Effect.log(`Fiber result: ${result}`)
  
  return result
})

// 2. Multiple Concurrent Fibers
const multipleFibersExample = Effect.gen(function* () {
  const createTask = (name: string, duration: Duration.DurationInput) =>
    Effect.gen(function* () {
      yield* Effect.log(`${name} starting`)
      yield* Effect.sleep(duration)
      yield* Effect.log(`${name} completed`)
      return `${name} result`
    })
  
  // Fork multiple tasks
  const fiber1 = yield* Effect.fork(createTask("Task 1", "1 second"))
  const fiber2 = yield* Effect.fork(createTask("Task 2", "2 seconds"))
  const fiber3 = yield* Effect.fork(createTask("Task 3", "1.5 seconds"))
  
  // Wait for all fibers to complete
  const results = yield* Effect.all([
    Fiber.join(fiber1),
    Fiber.join(fiber2),
    Fiber.join(fiber3)
  ])
  
  yield* Effect.log(`All tasks completed: ${JSON.stringify(results)}`)
  return results
})

// 3. Fiber Interruption
const fiberInterruptionExample = Effect.gen(function* () {
  const longRunningTask = Effect.gen(function* () {
    yield* Effect.log("Long task starting")
    for (let i = 0; i < 10; i++) {
      yield* Effect.sleep("500 millis")
      yield* Effect.log(`Long task step ${i + 1}`)
    }
    return "Long task completed"
  }).pipe(
    Effect.onInterrupt(() => Effect.log("Long task was interrupted"))
  )
  
  const fiber = yield* Effect.fork(longRunningTask)
  
  // Let it run for a bit
  yield* Effect.sleep("2 seconds")
  
  // Interrupt the fiber
  yield* Effect.log("Interrupting long task")
  yield* Fiber.interrupt(fiber)
  yield* Effect.log("Long task interrupted")
})

// 4. Fiber Racing
const fiberRacingExample = Effect.gen(function* () {
  const fastTask = Effect.gen(function* () {
    yield* Effect.sleep("1 second")
    return "Fast task won!"
  })
  
  const slowTask = Effect.gen(function* () {
    yield* Effect.sleep("3 seconds")
    return "Slow task won!"
  })
  
  // Race the tasks - first to complete wins
  const winner = yield* Effect.race(fastTask, slowTask)
  yield* Effect.log(`Race winner: ${winner}`)
  return winner
})

// 5. Structured Concurrency with Effect.all
const structuredConcurrencyExample = Effect.gen(function* () {
  const fetchUser = (id: number) =>
    Effect.gen(function* () {
      yield* Effect.sleep("500 millis")
      return { id, name: `User ${id}`, email: `user${id}@example.com` }
    })
  
  const fetchPosts = (userId: number) =>
    Effect.gen(function* () {
      yield* Effect.sleep("800 millis")
      return [
        { id: 1, userId, title: "Post 1" },
        { id: 2, userId, title: "Post 2" }
      ]
    })
  
  // Run operations concurrently with structured concurrency
  const [user, posts] = yield* Effect.all([
    fetchUser(1),
    fetchPosts(1)
  ], { concurrency: "unbounded" })
  
  yield* Effect.log(`Fetched user: ${JSON.stringify(user)}`)
  yield* Effect.log(`Fetched posts: ${JSON.stringify(posts)}`)
  
  return { user, posts }
})

// 6. Fiber-based Resource Management
const fiberResourceManagement = Effect.gen(function* () {
  const acquireResource = (name: string) =>
    Effect.gen(function* () {
      yield* Effect.log(`Acquiring resource: ${name}`)
      return { name, handle: Math.random() }
    })
  
  const releaseResource = (resource: { name: string; handle: number }) =>
    Effect.log(`Releasing resource: ${resource.name}`)
  
  const useResource = (resource: { name: string; handle: number }) =>
    Effect.gen(function* () {
      yield* Effect.log(`Using resource: ${resource.name}`)
      yield* Effect.sleep("1 second")
      return `Work done with ${resource.name}`
    })
  
  // Use acquireRelease for safe resource management in concurrent context
  const task = Effect.acquireRelease(
    acquireResource("Database Connection"),
    releaseResource
  ).pipe(
    Effect.flatMap(useResource)
  )
  
  // Fork multiple tasks that use resources
  const fibers = yield* Effect.all([
    Effect.fork(task),
    Effect.fork(task),
    Effect.fork(task)
  ])
  
  // Wait for all to complete - resources will be properly cleaned up
  const results = yield* Effect.all(fibers.map(Fiber.join))
  return results
})

// 7. Cooperative Cancellation
const cooperativeCancellation = Effect.gen(function* () {
  const cooperativeTask = Effect.gen(function* () {
    for (let i = 0; i < 100; i++) {
      // Check for interruption at each iteration
      yield* Effect.checkInterruptible
      yield* Effect.log(`Processing item ${i}`)
      yield* Effect.sleep("100 millis")
    }
    return "All items processed"
  }).pipe(
    Effect.onInterrupt(() => Effect.log("Task was cooperatively cancelled"))
  )
  
  const fiber = yield* Effect.fork(cooperativeTask)
  
  // Let it run for a bit
  yield* Effect.sleep("1 second")
  
  // Send interruption signal
  yield* Fiber.interrupt(fiber)
  yield* Effect.log("Interruption completed")
})

// 8. Fiber Supervision
const fiberSupervision = Effect.gen(function* () {
  const supervised = Effect.gen(function* () {
    const tasks = Array.from({ length: 5 }, (_, i) =>
      Effect.gen(function* () {
        if (i === 2) {
          yield* Effect.fail(`Task ${i} failed`)
        }
        yield* Effect.sleep(`${(i + 1) * 200} millis`)
        return `Task ${i} completed`
      }).pipe(
        Effect.catchAll(error =>
          Effect.log(`Handled error: ${error}`).pipe(
            Effect.andThen(Effect.succeed(`Task ${i} recovered`))
          )
        )
      )
    )
    
    // All tasks run concurrently under supervision
    const results = yield* Effect.all(tasks, { concurrency: "unbounded" })
    return results
  })
  
  const results = yield* supervised
  yield* Effect.log(`Supervised results: ${JSON.stringify(results)}`)
  return results
})

// 9. Fiber Communication via Refs
const fiberCommunication = Effect.gen(function* () {
  const { Ref } = yield* Effect.sync(() => import("effect"))
  
  const counter = yield* Ref.make(0)
  
  const incrementTask = (name: string) =>
    Effect.gen(function* () {
      for (let i = 0; i < 5; i++) {
        yield* Ref.update(counter, n => n + 1)
        const current = yield* Ref.get(counter)
        yield* Effect.log(`${name} incremented counter to ${current}`)
        yield* Effect.sleep("200 millis")
      }
    })
  
  // Run multiple increment tasks concurrently
  const fibers = yield* Effect.all([
    Effect.fork(incrementTask("Fiber A")),
    Effect.fork(incrementTask("Fiber B")),
    Effect.fork(incrementTask("Fiber C"))
  ])
  
  // Wait for all fibers to complete
  yield* Effect.all(fibers.map(Fiber.join))
  
  const finalCount = yield* Ref.get(counter)
  yield* Effect.log(`Final counter value: ${finalCount}`)
  return finalCount
})

export {
  basicFiberExample,
  multipleFibersExample,
  fiberInterruptionExample,
  fiberRacingExample,
  structuredConcurrencyExample,
  fiberResourceManagement,
  cooperativeCancellation,
  fiberSupervision,
  fiberCommunication
}