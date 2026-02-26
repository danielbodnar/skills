// Parallel Execution Patterns

import { Effect, Duration } from "effect"

// 1. Basic Parallel Execution with Effect.all
const basicParallelExample = Effect.gen(function* () {
  const task1 = Effect.gen(function* () {
    yield* Effect.sleep("1 second")
    return "Task 1 result"
  })
  
  const task2 = Effect.gen(function* () {
    yield* Effect.sleep("1.5 seconds")
    return "Task 2 result"
  })
  
  const task3 = Effect.gen(function* () {
    yield* Effect.sleep("800 millis")
    return "Task 3 result"
  })
  
  // All tasks run in parallel, returns when all complete
  const results = yield* Effect.all([task1, task2, task3])
  yield* Effect.log(`Parallel results: ${JSON.stringify(results)}`)
  return results
})

// 2. Parallel Execution with Concurrency Limits
const limitedConcurrencyExample = Effect.gen(function* () {
  const tasks = Array.from({ length: 10 }, (_, i) =>
    Effect.gen(function* () {
      yield* Effect.log(`Task ${i} starting`)
      yield* Effect.sleep("500 millis")
      yield* Effect.log(`Task ${i} completed`)
      return `Task ${i} result`
    })
  )
  
  // Only 3 tasks run concurrently at a time
  const results = yield* Effect.all(tasks, { concurrency: 3 })
  yield* Effect.log(`Limited concurrency results: ${results.length} tasks completed`)
  return results
})

// 3. Unbounded Concurrency
const unboundedConcurrencyExample = Effect.gen(function* () {
  const fetchData = (url: string) =>
    Effect.gen(function* () {
      yield* Effect.log(`Fetching ${url}`)
      yield* Effect.sleep("200 millis")
      return `Data from ${url}`
    })
  
  const urls = [
    "https://api.example.com/users",
    "https://api.example.com/posts",
    "https://api.example.com/comments",
    "https://api.example.com/todos",
    "https://api.example.com/albums"
  ]
  
  // All requests happen simultaneously
  const results = yield* Effect.all(
    urls.map(fetchData),
    { concurrency: "unbounded" }
  )
  
  yield* Effect.log(`Fetched ${results.length} API responses`)
  return results
})

// 4. Parallel forEach Processing
const parallelForEachExample = Effect.gen(function* () {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  
  const processNumber = (n: number) =>
    Effect.gen(function* () {
      yield* Effect.sleep("300 millis")
      const result = n * n
      yield* Effect.log(`Processed ${n} -> ${result}`)
      return result
    })
  
  // Process each number in parallel with concurrency limit
  const results = yield* Effect.forEach(
    numbers,
    processNumber,
    { concurrency: 4 }
  )
  
  yield* Effect.log(`Squared numbers: ${JSON.stringify(results)}`)
  return results
})

// 5. Parallel Tuple Processing
const parallelTupleExample = Effect.gen(function* () {
  const getUserData = Effect.gen(function* () {
    yield* Effect.sleep("500 millis")
    return { id: 1, name: "John Doe" }
  })
  
  const getUserPosts = Effect.gen(function* () {
    yield* Effect.sleep("700 millis")
    return [{ id: 1, title: "Post 1" }, { id: 2, title: "Post 2" }]
  })
  
  const getUserSettings = Effect.gen(function* () {
    yield* Effect.sleep("300 millis")
    return { theme: "dark", notifications: true }
  })
  
  // Fetch all user-related data in parallel
  const [user, posts, settings] = yield* Effect.all([
    getUserData,
    getUserPosts,
    getUserSettings
  ])
  
  yield* Effect.log(`User data fetched: ${user.name}`)
  yield* Effect.log(`Posts count: ${posts.length}`)
  yield* Effect.log(`Theme: ${settings.theme}`)
  
  return { user, posts, settings }
})

// 6. Parallel Record Processing
const parallelRecordExample = Effect.gen(function* () {
  const fetchServiceData = (service: string) =>
    Effect.gen(function* () {
      const delay = Math.random() * 1000
      yield* Effect.sleep(`${delay} millis`)
      return `${service} data`
    })
  
  const services = {
    auth: fetchServiceData("Authentication Service"),
    users: fetchServiceData("User Service"),
    posts: fetchServiceData("Posts Service"),
    comments: fetchServiceData("Comments Service"),
    notifications: fetchServiceData("Notification Service")
  }
  
  // Fetch data from all services in parallel
  const results = yield* Effect.all(services)
  
  yield* Effect.log("All services responded:")
  Object.entries(results).forEach(([service, data]) => {
    console.log(`  ${service}: ${data}`)
  })
  
  return results
})

// 7. Parallel with Early Termination
const parallelWithEarlyTermination = Effect.gen(function* () {
  const tasks = Array.from({ length: 5 }, (_, i) =>
    Effect.gen(function* () {
      yield* Effect.sleep(`${(i + 1) * 500} millis`)
      if (i === 2) {
        yield* Effect.fail(`Task ${i} failed`)
      }
      return `Task ${i} success`
    })
  )
  
  // If any task fails, all other tasks are interrupted
  try {
    const results = yield* Effect.all(tasks, { concurrency: "unbounded" })
    yield* Effect.log(`All tasks succeeded: ${JSON.stringify(results)}`)
    return results
  } catch (error) {
    yield* Effect.log(`Tasks terminated early due to failure: ${error}`)
    throw error
  }
})

// 8. Parallel with Error Collection
const parallelWithErrorCollection = Effect.gen(function* () {
  const tasks = Array.from({ length: 5 }, (_, i) =>
    Effect.gen(function* () {
      yield* Effect.sleep(`${(i + 1) * 200} millis`)
      if (i % 2 === 0 && i > 0) {
        yield* Effect.fail(`Task ${i} failed`)
      }
      return `Task ${i} success`
    })
  )
  
  // Collect all results, including failures as Either types
  const results = yield* Effect.all(tasks, { 
    concurrency: "unbounded",
    mode: "either" 
  })
  
  const successes = results.filter(r => r._tag === "Right").map(r => r.right)
  const failures = results.filter(r => r._tag === "Left").map(r => r.left)
  
  yield* Effect.log(`Successes: ${JSON.stringify(successes)}`)
  yield* Effect.log(`Failures: ${JSON.stringify(failures)}`)
  
  return { successes, failures }
})

// 9. Race Conditions and First Winner
const raceConditionExample = Effect.gen(function* () {
  const fastAPI = Effect.gen(function* () {
    yield* Effect.sleep("800 millis")
    return "Fast API response"
  })
  
  const slowAPI = Effect.gen(function* () {
    yield* Effect.sleep("2 seconds")  
    return "Slow API response"
  })
  
  const backup = Effect.gen(function* () {
    yield* Effect.sleep("1.5 seconds")
    return "Backup service response"
  })
  
  // First response wins, others are cancelled
  const winner = yield* Effect.race(fastAPI, Effect.race(slowAPI, backup))
  yield* Effect.log(`First response: ${winner}`)
  return winner
})

// 10. Parallel Batch Processing
const parallelBatchProcessing = Effect.gen(function* () {
  const data = Array.from({ length: 100 }, (_, i) => i + 1)
  
  const processBatch = (batch: number[]) =>
    Effect.gen(function* () {
      yield* Effect.log(`Processing batch: ${batch[0]}-${batch[batch.length - 1]}`)
      yield* Effect.sleep("500 millis")
      return batch.map(x => x * 2)
    })
  
  // Split data into batches
  const batchSize = 10
  const batches = []
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize))
  }
  
  // Process batches in parallel with concurrency limit
  const results = yield* Effect.all(
    batches.map(processBatch),
    { concurrency: 3 }
  )
  
  // Flatten results
  const flattened = results.flat()
  yield* Effect.log(`Processed ${flattened.length} items`)
  return flattened
})

// 11. Resource Pool Parallel Access
const resourcePoolParallelAccess = Effect.gen(function* () {
  // Simulate a resource pool
  const useResource = (resourceId: number, taskId: number) =>
    Effect.gen(function* () {
      yield* Effect.log(`Task ${taskId} acquired resource ${resourceId}`)
      yield* Effect.sleep(`${Math.random() * 1000} millis`)
      yield* Effect.log(`Task ${taskId} released resource ${resourceId}`)
      return `Task ${taskId} result using resource ${resourceId}`
    })
  
  const tasks = Array.from({ length: 8 }, (_, i) =>
    useResource(i % 3, i) // 3 resources, 8 tasks
  )
  
  // Simulate resource contention with limited concurrency
  const results = yield* Effect.all(tasks, { concurrency: 3 })
  yield* Effect.log(`All ${results.length} tasks completed`)
  return results
})

export {
  basicParallelExample,
  limitedConcurrencyExample,
  unboundedConcurrencyExample,
  parallelForEachExample,
  parallelTupleExample,
  parallelRecordExample,
  parallelWithEarlyTermination,
  parallelWithErrorCollection,
  raceConditionExample,
  parallelBatchProcessing,
  resourcePoolParallelAccess
}