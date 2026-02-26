// Effect-TS Testing with Vitest Integration

import { it, describe, expect } from "@effect/vitest"
import { Effect, Layer, Context, TestContext, TestClock, Duration } from "effect"

// 1. Basic Effect Testing
describe("Basic Effect Testing", () => {
  it.effect("should handle successful effects", () =>
    Effect.gen(function* () {
      const result = yield* Effect.succeed(42)
      expect(result).toBe(42)
    })
  )
  
  it.effect("should handle failing effects", () =>
    Effect.gen(function* () {
      const result = yield* Effect.fail("error").pipe(
        Effect.catchAll(error => Effect.succeed(`handled: ${error}`))
      )
      expect(result).toBe("handled: error")
    })
  )
  
  it.effect("should handle async effects", () =>
    Effect.gen(function* () {
      const result = yield* Effect.promise(() => 
        Promise.resolve("async result")
      )
      expect(result).toBe("async result")
    })
  )
})

// 2. Testing with Services and Mocks
interface UserService {
  getUser: (id: number) => Effect.Effect<{ id: number; name: string }, string>
  createUser: (name: string) => Effect.Effect<{ id: number; name: string }, string>
}

const UserService = Context.GenericTag<UserService>("UserService")

// Real implementation
const UserServiceLive = Layer.succeed(UserService, {
  getUser: (id: number) =>
    Effect.gen(function* () {
      if (id <= 0) {
        yield* Effect.fail("Invalid user ID")
      }
      return { id, name: `User ${id}` }
    }),
  
  createUser: (name: string) =>
    Effect.gen(function* () {
      if (!name.trim()) {
        yield* Effect.fail("Name cannot be empty")
      }
      return { id: Math.floor(Math.random() * 1000), name }
    })
})

// Mock implementation for testing
const UserServiceMock = Layer.succeed(UserService, {
  getUser: (id: number) =>
    Effect.succeed({ id, name: `Mock User ${id}` }),
  
  createUser: (name: string) =>
    Effect.succeed({ id: 999, name })
})

describe("Service Testing", () => {
  it.effect("should get user with real service", () =>
    Effect.gen(function* () {
      const userService = yield* UserService
      const user = yield* userService.getUser(1)
      
      expect(user.id).toBe(1)
      expect(user.name).toBe("User 1")
    }).pipe(Effect.provide(UserServiceLive))
  )
  
  it.effect("should get user with mock service", () =>
    Effect.gen(function* () {
      const userService = yield* UserService
      const user = yield* userService.getUser(1)
      
      expect(user.id).toBe(1)
      expect(user.name).toBe("Mock User 1")
    }).pipe(Effect.provide(UserServiceMock))
  )
  
  it.effect("should handle user service errors", () =>
    Effect.gen(function* () {
      const userService = yield* UserService
      const result = yield* userService.getUser(-1).pipe(
        Effect.flip // Convert failure to success for testing
      )
      
      expect(result).toBe("Invalid user ID")
    }).pipe(Effect.provide(UserServiceLive))
  )
})

// 3. Testing with TestContext and TestClock
describe("Time-based Testing", () => {
  it.effect("should test delayed operations", () =>
    Effect.gen(function* () {
      const delayedTask = Effect.gen(function* () {
        yield* Effect.sleep("1 second")
        return "delayed result"
      })
      
      // Start the task
      const fiber = yield* Effect.fork(delayedTask)
      
      // Advance time artificially
      yield* TestClock.adjust("1 second")
      
      // Get the result
      const result = yield* fiber.await()
      expect(result._tag).toBe("Success")
      if (result._tag === "Success") {
        expect(result.value).toBe("delayed result")
      }
    }).pipe(Effect.provide(TestContext.TestContext))
  )
  
  it.effect("should test timeout behavior", () =>
    Effect.gen(function* () {
      const slowTask = Effect.gen(function* () {
        yield* Effect.sleep("5 seconds")
        return "slow result"
      })
      
      const timedTask = slowTask.pipe(
        Effect.timeout("2 seconds")
      )
      
      const fiber = yield* Effect.fork(timedTask)
      
      // Advance time beyond timeout
      yield* TestClock.adjust("3 seconds")
      
      const result = yield* fiber.await()
      expect(result._tag).toBe("Failure")
    }).pipe(Effect.provide(TestContext.TestContext))
  )
  
  it.effect("should test scheduled operations", () =>
    Effect.gen(function* () {
      let counter = 0
      
      const incrementTask = Effect.sync(() => {
        counter++
        return counter
      })
      
      const { Schedule } = yield* Effect.sync(() => import("effect"))
      
      const scheduledTask = incrementTask.pipe(
        Effect.repeat(Schedule.fixed("500 millis").pipe(Schedule.recurs(3)))
      )
      
      const fiber = yield* Effect.fork(scheduledTask)
      
      // Advance time to trigger all repetitions
      yield* TestClock.adjust("2 seconds")
      
      const result = yield* fiber.await()
      expect(result._tag).toBe("Success")
      expect(counter).toBe(4) // Initial + 3 repetitions
    }).pipe(Effect.provide(TestContext.TestContext))
  )
})

// 4. Testing Concurrent Operations
describe("Concurrency Testing", () => {
  it.effect("should test parallel operations", () =>
    Effect.gen(function* () {
      const task1 = Effect.succeed("task1")
      const task2 = Effect.succeed("task2")
      const task3 = Effect.succeed("task3")
      
      const results = yield* Effect.all([task1, task2, task3])
      
      expect(results).toEqual(["task1", "task2", "task3"])
    })
  )
  
  it.effect("should test racing operations", () =>
    Effect.gen(function* () {
      const fastTask = Effect.gen(function* () {
        yield* Effect.sleep("100 millis")
        return "fast"
      })
      
      const slowTask = Effect.gen(function* () {
        yield* Effect.sleep("500 millis")
        return "slow"
      })
      
      const fiber = yield* Effect.fork(Effect.race(fastTask, slowTask))
      
      yield* TestClock.adjust("200 millis")
      
      const result = yield* fiber.await()
      expect(result._tag).toBe("Success")
      if (result._tag === "Success") {
        expect(result.value).toBe("fast")
      }
    }).pipe(Effect.provide(TestContext.TestContext))
  )
})

// 5. Testing Error Scenarios
describe("Error Testing", () => {
  it.effect("should test error handling", () =>
    Effect.gen(function* () {
      const errorTask = Effect.fail("test error")
      
      const handledTask = errorTask.pipe(
        Effect.catchAll(error => Effect.succeed(`handled: ${error}`))
      )
      
      const result = yield* handledTask
      expect(result).toBe("handled: test error")
    })
  )
  
  it.effect("should test error propagation", () =>
    Effect.gen(function* () {
      const riskyTask = Effect.gen(function* () {
        yield* Effect.fail("inner error")
        return "success"
      })
      
      const result = yield* riskyTask.pipe(Effect.flip)
      expect(result).toBe("inner error")
    })
  )
})

// 6. Testing with Property-Based Testing
describe("Property-Based Testing", () => {
  it.effect("should test properties with generated data", () =>
    Effect.gen(function* () {
      // Property: adding zero should not change the value
      const testProperty = (n: number) =>
        Effect.gen(function* () {
          const result = n + 0
          expect(result).toBe(n)
          return true
        })
      
      // Test with multiple values
      const testValues = [1, 42, -5, 0, 1000]
      const results = yield* Effect.all(
        testValues.map(testProperty)
      )
      
      expect(results.every(r => r)).toBe(true)
    })
  )
})

// 7. Integration Testing
describe("Integration Testing", () => {
  interface DatabaseService {
    query: (sql: string) => Effect.Effect<string[], string>
  }
  
  const DatabaseService = Context.GenericTag<DatabaseService>("DatabaseService")
  
  const DatabaseServiceMock = Layer.succeed(DatabaseService, {
    query: (sql: string) =>
      Effect.gen(function* () {
        yield* Effect.sleep("10 millis") // Simulate query time
        
        if (sql.includes("SELECT")) {
          return ["row1", "row2", "row3"]
        }
        
        if (sql.includes("INSERT")) {
          return ["inserted"]
        }
        
        yield* Effect.fail("Invalid SQL")
      })
  })
  
  const userRepository = {
    getAllUsers: Effect.gen(function* () {
      const db = yield* DatabaseService
      const rows = yield* db.query("SELECT * FROM users")
      return rows.map(row => ({ name: row }))
    }),
    
    createUser: (name: string) =>
      Effect.gen(function* () {
        const db = yield* DatabaseService
        const result = yield* db.query(`INSERT INTO users (name) VALUES ('${name}')`)
        return { id: 1, name }
      })
  }
  
  it.effect("should test user repository operations", () =>
    Effect.gen(function* () {
      const users = yield* userRepository.getAllUsers
      expect(users).toEqual([
        { name: "row1" },
        { name: "row2" },
        { name: "row3" }
      ])
      
      const newUser = yield* userRepository.createUser("John")
      expect(newUser.name).toBe("John")
    }).pipe(Effect.provide(DatabaseServiceMock))
  )
})

// 8. Testing Custom Effects
const customEffect = <A>(value: A, delay: Duration.DurationInput = "0 millis") =>
  Effect.gen(function* () {
    yield* Effect.sleep(delay)
    yield* Effect.log(`Custom effect with value: ${value}`)
    return value
  })

describe("Custom Effect Testing", () => {
  it.effect("should test custom effects", () =>
    Effect.gen(function* () {
      const result = yield* customEffect("test value", "100 millis")
      expect(result).toBe("test value")
    }).pipe(Effect.provide(TestContext.TestContext))
  )
})

export {
  UserService,
  UserServiceLive,
  UserServiceMock,
  customEffect
}