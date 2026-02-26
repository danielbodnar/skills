// Error Handling Patterns

import { Effect, Data, Cause, Exit } from "effect"

// 1. Custom Error Types
class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly url: string
  readonly status?: number
}> {}

class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string
  readonly message: string
}> {}

class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly query: string
  readonly cause: unknown
}> {}

// 2. Basic Error Handling
const basicErrorHandling = Effect.gen(function* () {
  const riskyOperation = Effect.gen(function* () {
    const random = Math.random()
    if (random < 0.5) {
      yield* Effect.fail(new NetworkError({ url: "https://api.example.com" }))
    }
    return "Success!"
  })
  
  // Catch all errors
  const result = yield* riskyOperation.pipe(
    Effect.catchAll(error => {
      if (error._tag === "NetworkError") {
        return Effect.succeed("Fallback for network error")
      }
      return Effect.succeed("Generic fallback")
    })
  )
  
  yield* Effect.log(`Result: ${result}`)
  return result
})

// 3. Specific Error Handling with catchTags
const specificErrorHandling = Effect.gen(function* () {
  const multiErrorOperation = Effect.gen(function* () {
    const operation = Math.random()
    
    if (operation < 0.3) {
      yield* Effect.fail(new NetworkError({ url: "https://api.example.com", status: 500 }))
    } else if (operation < 0.6) {
      yield* Effect.fail(new ValidationError({ field: "email", message: "Invalid format" }))
    } else if (operation < 0.8) {
      yield* Effect.fail(new DatabaseError({ query: "SELECT * FROM users", cause: "Connection timeout" }))
    }
    
    return "Operation succeeded"
  })
  
  const result = yield* multiErrorOperation.pipe(
    Effect.catchTags({
      NetworkError: (error) => 
        Effect.gen(function* () {
          yield* Effect.log(`Network error for ${error.url} (${error.status})`)
          return "Used cached data"
        }),
      ValidationError: (error) =>
        Effect.gen(function* () {
          yield* Effect.log(`Validation error in ${error.field}: ${error.message}`)
          return "Used default value"
        }),
      DatabaseError: (error) =>
        Effect.gen(function* () {
          yield* Effect.log(`Database error in query: ${error.query}`)
          return "Used backup database"
        })
    })
  )
  
  yield* Effect.log(`Final result: ${result}`)
  return result
})

// 4. Error Recovery with Retry
const errorRecoveryWithRetry = Effect.gen(function* () {
  let attemptCount = 0
  
  const unreliableOperation = Effect.gen(function* () {
    attemptCount++
    yield* Effect.log(`Attempt ${attemptCount}`)
    
    if (attemptCount < 3) {
      yield* Effect.fail(new NetworkError({ url: "https://unreliable-api.com" }))
    }
    
    return "Finally succeeded!"
  })
  
  const { Schedule } = yield* Effect.sync(() => import("effect"))
  
  const result = yield* unreliableOperation.pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(
        Schedule.compose(Schedule.recurs(3))
      )
    )
  )
  
  yield* Effect.log(`Retry result: ${result}`)
  return result
})

// 5. Error Transformation
const errorTransformation = Effect.gen(function* () {
  const lowLevelOperation = Effect.fail("Low-level database connection failed")
  
  // Transform low-level error into domain error
  const result = yield* lowLevelOperation.pipe(
    Effect.mapError(error => 
      new DatabaseError({ 
        query: "connection", 
        cause: error 
      })
    ),
    Effect.catchTag("DatabaseError", error =>
      Effect.gen(function* () {
        yield* Effect.log(`Handled database error: ${error.cause}`)
        return "Fallback data"
      })
    )
  )
  
  return result
})

// 6. Error Sandboxing
const errorSandboxing = Effect.gen(function* () {
  const complexOperation = Effect.gen(function* () {
    const random = Math.random()
    
    if (random < 0.3) {
      yield* Effect.fail("Regular failure")
    } else if (random < 0.6) {
      yield* Effect.die("Defect occurred")
    } else if (random < 0.8) {
      yield* Effect.interrupt
    }
    
    return "Success"
  })
  
  // Sandbox to expose all error causes
  const sandboxed = complexOperation.pipe(Effect.sandbox)
  
  const result = yield* sandboxed.pipe(
    Effect.catchTags({
      Fail: (cause) => 
        Effect.gen(function* () {
          yield* Effect.log(`Caught failure: ${cause.error}`)
          return "Recovered from failure"
        }),
      Die: (cause) =>
        Effect.gen(function* () {
          yield* Effect.log(`Caught defect: ${cause.defect}`)
          return "Recovered from defect"
        }),
      Interrupt: (cause) =>
        Effect.gen(function* () {
          yield* Effect.log(`Caught interruption: ${cause.fiberId}`)
          return "Recovered from interruption"
        })
    })
  )
  
  return result
})

// 7. Error Accumulation
const errorAccumulation = Effect.gen(function* () {
  const operations = [
    Effect.fail(new ValidationError({ field: "email", message: "Required" })),
    Effect.fail(new ValidationError({ field: "name", message: "Too short" })),
    Effect.succeed("Valid data"),
    Effect.fail(new ValidationError({ field: "age", message: "Invalid number" }))
  ]
  
  // Collect all results, including errors
  const results = yield* Effect.all(operations, { mode: "either" })
  
  const errors = results
    .filter((result): result is typeof results[number] & { _tag: "Left" } => 
      result._tag === "Left"
    )
    .map(result => result.left)
  
  const successes = results
    .filter((result): result is typeof results[number] & { _tag: "Right" } => 
      result._tag === "Right"
    )
    .map(result => result.right)
  
  yield* Effect.log(`Errors: ${errors.length}, Successes: ${successes.length}`)
  
  if (errors.length > 0) {
    yield* Effect.log("Validation errors:")
    errors.forEach(error => {
      if (error._tag === "ValidationError") {
        console.log(`  ${error.field}: ${error.message}`)
      }
    })
  }
  
  return { errors, successes }
})

// 8. Timeout Error Handling
const timeoutErrorHandling = Effect.gen(function* () {
  const slowOperation = Effect.gen(function* () {
    yield* Effect.sleep("5 seconds")
    return "Slow result"
  })
  
  const result = yield* slowOperation.pipe(
    Effect.timeout("2 seconds"),
    Effect.catchAll(error => {
      if (error._tag === "TimeoutException") {
        return Effect.succeed("Operation timed out, using cached result")
      }
      return Effect.succeed("Other error occurred")
    })
  )
  
  yield* Effect.log(`Timeout result: ${result}`)
  return result
})

// 9. Error Context and Debugging
const errorContextAndDebugging = Effect.gen(function* () {
  const operationWithContext = Effect.gen(function* () {
    yield* Effect.annotateCurrentSpan("operation", "user-fetch")
    yield* Effect.annotateCurrentSpan("userId", "12345")
    
    yield* Effect.fail(new DatabaseError({ 
      query: "SELECT * FROM users WHERE id = ?", 
      cause: "Connection lost" 
    }))
  }).pipe(
    Effect.withSpan("fetchUser")
  )
  
  const result = yield* operationWithContext.pipe(
    Effect.catchAll(error => 
      Effect.gen(function* () {
        yield* Effect.log(`Error in context: ${JSON.stringify(error)}`)
        
        // Add additional context for debugging
        const context = {
          timestamp: new Date().toISOString(),
          error: error,
          operation: "fetchUser",
          userId: "12345"
        }
        
        yield* Effect.log(`Full context: ${JSON.stringify(context, null, 2)}`)
        
        return "Error handled with full context"
      })
    )
  )
  
  return result
})

// 10. Circuit Breaker Pattern
const circuitBreakerPattern = Effect.gen(function* () {
  let failures = 0
  let isOpen = false
  let lastFailureTime = 0
  const resetTimeout = 5000 // 5 seconds
  
  const unreliableService = Effect.gen(function* () {
    // Simulate service that fails often
    if (Math.random() < 0.7) {
      throw new Error("Service unavailable")
    }
    return "Service response"
  })
  
  const circuitBreakerCall = Effect.gen(function* () {
    // Check if circuit is open
    if (isOpen) {
      const now = Date.now()
      if (now - lastFailureTime < resetTimeout) {
        yield* Effect.fail(new NetworkError({ 
          url: "service", 
          status: 503 
        }))
      } else {
        // Try to close circuit
        isOpen = false
        failures = 0
      }
    }
    
    try {
      const result = yield* unreliableService
      failures = 0 // Reset on success
      return result
    } catch (error) {
      failures++
      lastFailureTime = Date.now()
      
      if (failures >= 3) {
        isOpen = true
        yield* Effect.log("Circuit breaker opened")
      }
      
      yield* Effect.fail(new NetworkError({ 
        url: "service", 
        status: 500 
      }))
    }
  })
  
  // Try multiple calls to see circuit breaker in action
  const results = []
  for (let i = 0; i < 10; i++) {
    const result = yield* circuitBreakerCall.pipe(
      Effect.catchAll(error => Effect.succeed(`Failed: ${error._tag}`))
    )
    results.push(result)
    yield* Effect.sleep("100 millis")
  }
  
  yield* Effect.log(`Circuit breaker results: ${JSON.stringify(results)}`)
  return results
})

export {
  NetworkError,
  ValidationError,
  DatabaseError,
  basicErrorHandling,
  specificErrorHandling,
  errorRecoveryWithRetry,
  errorTransformation,
  errorSandboxing,
  errorAccumulation,
  timeoutErrorHandling,
  errorContextAndDebugging,
  circuitBreakerPattern
}